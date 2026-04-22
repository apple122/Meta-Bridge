import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Search,
  Edit2,
  Save,
  X,
  Loader2,
  TrendingUp,
  Shield,
  Phone,
  MessageCircle,
  Send,
  UserPlus,
  Activity,
  History,
  Mail,
  MessageSquare,
  Globe,
  Hash,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Wallet,
  Settings2,
} from "lucide-react";
import { emailService } from "../services/emailService";
import type { Profile, GlobalSettings } from "../types";
import { UserTable } from "../components/admin/UserTable";
import { AdminInput } from "../components/admin/AdminInput";
import { CreateUserModal } from "../components/admin/CreateUserModal";
import { TopUpModal } from "../components/admin/TopUpModal";
import { encryptPassword, decryptPassword, isHashed } from "../utils/security";
import { useLanguage } from "../contexts/LanguageContext";
import { AuditLogTable } from "../components/admin/AuditLogTable";
import { auditService } from "../services/auditService";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { UserActivityLog } from "../components/admin/UserActivityLog";

/* ─── Types ────────────────────────────────────────────── */
type AdminTab = "users" | "activity" | "logs" | "settings";

/* ─── Tab definition ───────────────────────────────────── */
const TABS: { id: AdminTab; labelKey: string; icon?: React.ReactNode }[] = [
  { id: "users", labelKey: "users" },
  { id: "activity", labelKey: "activity", icon: <Activity size={13} /> },
  { id: "logs", labelKey: "auditLogs", icon: <History size={13} /> },
  { id: "settings", labelKey: "settings" },
];

/* ═══════════════════════════════════════════════════════ */
export const Admin: React.FC = () => {
  const { t, language } = useLanguage();
  const { profile: currentAdmin, user, refreshProfile } = useAuth();
  const { refreshWallet } = useWallet();

  /* ── State ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  // Users
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingWalletProfile, setEditingWalletProfile] = useState<Profile | null>(null);
  const [editingControlProfile, setEditingControlProfile] = useState<Profile | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>("");
  const [walletReason, setWalletReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    contact_phone: "",
    contact_line: "",
    contact_telegram: "",
    contact_whatsapp: "",
    contact_facebook: "",
    contact_email: "",
    contact_discord: "",
    phone_enabled: true,
    line_enabled: true,
    telegram_enabled: true,
    whatsapp_enabled: false,
    facebook_enabled: false,
    email_enabled: false,
    discord_enabled: false,
    registration_otp_enabled: true,
  });

  /* ── Effects ───────────────────────────────────────── */
  useEffect(() => {
    fetchProfiles();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") fetchAuditLogs();
  }, [activeTab]);

  // Global ESC to close modals / edit panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showCreateModal) setShowCreateModal(false);
      else if (showTopUpModal) setShowTopUpModal(false);
      else if (editingProfile) setEditingProfile(null);
      else if (editingWalletProfile) setEditingWalletProfile(null);
      else if (editingControlProfile) setEditingControlProfile(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, showTopUpModal, editingProfile, editingWalletProfile, editingControlProfile]);

  /* ── Data fetchers ─────────────────────────────────── */
  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setProfiles(data as Profile[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("*")
      .eq("id", "main")
      .single();
    if (!error && data) {
      setGlobalSettings({
        contact_phone: data.contact_phone || "",
        contact_line: data.contact_line || "",
        contact_telegram: data.contact_telegram || "",
        contact_whatsapp: data.contact_whatsapp || "",
        contact_facebook: data.contact_facebook || "",
        contact_email: data.contact_email || "",
        contact_discord: data.contact_discord || "",
        phone_enabled: data.phone_enabled ?? true,
        line_enabled: data.line_enabled ?? true,
        telegram_enabled: data.telegram_enabled ?? true,
        whatsapp_enabled: data.whatsapp_enabled ?? false,
        facebook_enabled: data.facebook_enabled ?? false,
        email_enabled: data.email_enabled ?? false,
        discord_enabled: data.discord_enabled ?? false,
        registration_otp_enabled: data.registration_otp_enabled ?? true,
      });
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    const logs = await auditService.fetchLogs(100);
    setAuditLogs(logs);
    setLogsLoading(false);
  };

  /* ── Handlers ──────────────────────────────────────── */
  const logAdminAction = async (
    actionType: Parameters<typeof auditService.logAction>[0]["actionType"],
    description: string,
    extra: object,
    targetProfile?: Profile,
  ) => {
    if (!currentAdmin?.id) return;
    await auditService.logAction({
      adminId: currentAdmin.id,
      adminEmail: currentAdmin.email || "unknown",
      targetUserId: targetProfile?.id,
      targetUserEmail: targetProfile?.email,
      actionType,
      description,
      details: extra,
    });
    fetchAuditLogs();
  };

  const handleUpdateWallet = async (type: 'deposit' | 'withdraw') => {
    if (!editingWalletProfile) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (!window.confirm(t("confirmWalletAdjustment"))) return;

    setIsSaving(true);
    const newBalance = type === 'deposit' 
      ? editingWalletProfile.balance + amount 
      : editingWalletProfile.balance - amount;

    // 1. Update Profile Balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", editingWalletProfile.id);

    if (balanceError) {
      console.error("Failed to update wallet balance:", balanceError);
    } else {
      // 2. Insert Transaction Record for User
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: editingWalletProfile.id,
          type: type,
          asset_symbol: 'USD',
          amount: amount,
          price: 1,
          total: amount,
          status: 'success',
          description: walletReason || (type === 'deposit' ? (language === 'th' ? 'รายการฝากเงิน' : 'Deposit') : (language === 'th' ? 'รายการถอนเงิน' : 'Withdrawal'))
        });

      if (txError) {
        console.error("Failed to create transaction record:", txError);
      }

      // 3. Send Email Notification
      if (type === 'deposit') {
        emailService.sendDepositNotification({
          email: editingWalletProfile.email,
          userName: `${editingWalletProfile.first_name} ${editingWalletProfile.last_name}`,
          amount: amount,
          lang: language as "th" | "en",
        });
      } else {
        emailService.sendWithdrawNotification({
          email: editingWalletProfile.email,
          userName: `${editingWalletProfile.first_name} ${editingWalletProfile.last_name}`,
          amount: amount,
          lang: language as "th" | "en",
        });
      }

      // 4. Log Admin Audit
      await logAdminAction(
        type === 'deposit' ? "WALLET_DEPOSIT" : "WALLET_WITHDRAW",
        type === 'deposit' 
          ? `Refilled balance for user ${editingWalletProfile.username}`
          : `Withdrew balance from user ${editingWalletProfile.username}`,
        { 
          amount, 
          reason: walletReason || 'None',
          oldBalance: editingWalletProfile.balance, 
          newBalance 
        },
        editingWalletProfile
      );

      alert(type === 'deposit' ? t("topUpSuccess") : (language === 'th' ? 'ทำรายการถอนสำเร็จ' : 'Withdrawal successful'));
      
      // If updating self, refresh own wallet context
      if (editingWalletProfile.id === user?.id) {
        await refreshProfile();
        await refreshWallet();
      }

      fetchProfiles();
      setEditingWalletProfile(null);
      setWalletAmount("");
      setWalletReason("");
    }
    setIsSaving(false);
  };

  const handleUpdateControl = async () => {
    if (!editingControlProfile) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ trade_control: editingControlProfile.trade_control })
      .eq("id", editingControlProfile.id);

    if (error) {
      console.error("Failed to update trade control:", error);
    } else {
      await logAdminAction(
        "TRADE_CONTROL_UPDATE",
        `Updated trade control for ${editingControlProfile.username} to ${editingControlProfile.trade_control}`,
        { trade_control: editingControlProfile.trade_control },
        editingControlProfile
      );
      fetchProfiles();
      setEditingControlProfile(null);
    }
    setIsSaving(false);
  };

  const handleUpdateProfile = async (profile: Profile) => {
    setIsSaving(true);
    const updateData: any = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone_number: profile.phone_number,
      balance: profile.balance,
      trade_control: profile.trade_control,
    };
    if (profile.password) {
      // If it's a new password (not hashed and not already encrypted), encrypt it
      updateData.password = (!isHashed(profile.password) && !profile.password.startsWith("enc:"))
        ? encryptPassword(profile.password)
        : profile.password;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
      await logAdminAction(
        "EDIT_PROFILE",
        `Updated profile for user ${profile.username}`,
        { updated_fields: updateData },
        profile,
      );
      setEditingProfile(null);
    }
    setIsSaving(false);
  };

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("global_settings")
      .update(globalSettings)
      .eq("id", "main");

    if (!error) {
      alert("Settings updated successfully!");
      await logAdminAction(
        "UPDATE_SETTINGS",
        "Updated global system settings (contacts)",
        { settings: globalSettings },
      );
    }
    setIsSaving(false);
  };

  const handleToggleRole = async (profile: Profile) => {
    const newRole = !profile.is_admin
      ? language === "th" ? "แอดมิน" : "Admin"
      : language === "th" ? "ผู้ใช้งาน" : "User";

    if (!window.confirm(
      language === "th"
        ? `คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนบทบาทของ ${profile.first_name} เป็น ${newRole}?`
        : `Change ${profile.first_name}'s role to ${newRole}?`
    )) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !profile.is_admin })
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p))
      );
      await logAdminAction(
        "TOGGLE_ROLE",
        `Changed role for user ${profile.username} to ${newRole}`,
        { new_role: newRole, is_admin: !profile.is_admin },
        profile,
      );
    } else {
      alert("Error updating role: " + error.message);
    }
  };

  const handleTestEmail = async () => {
    // Use the current admin profile from useAuth
    const adminEmail = currentAdmin?.email || "";

    if (!adminEmail) {
      setTestResult({ success: false, msg: "Current admin email not found. Please ensure you have an email address set in your profile." });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const result = await emailService.sendOTP({
        email: adminEmail,
        code: "123456",
        userName: currentAdmin?.first_name || "Admin",
        lang: language as any,
        type: 'verification'
      });

      setIsTestingEmail(false);
      if (result.success) {
        const msgId = result.data?.messageId || "";
        setTestResult({ 
          success: true, 
          msg: `Test email sent successfully! Please check ${adminEmail}${msgId ? ` (Message ID: ${msgId})` : ""}` 
        });
      } else {
        setTestResult({ success: false, msg: result.error || "Failed to send test email." });
      }
    } catch (err: any) {
      setIsTestingEmail(false);
      setTestResult({ success: false, msg: err.message || "An unexpected error occurred during testing." });
    }
  };

  const handleVerifyUser = async (profile: Profile) => {
    if (!window.confirm(t("confirmManualVerify"))) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true, otp_code: null })
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_verified: true, otp_code: undefined } : p))
      );
      await logAdminAction(
        "VERIFY_USER" as any,
        `Manually verified user ${profile.username}`,
        { verified: true },
        profile,
      );
    } else {
      alert("Error verifying user: " + error.message);
    }
  };

  /* ── Derived ───────────────────────────────────────── */
  const filteredProfiles = profiles.filter((p) =>
    [p.username, p.first_name, p.last_name, p.code]
      .some((v) => v?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabLabel = (tab: (typeof TABS)[number]) => {
    if (tab.id === "activity") return language === "th" ? "ความเคลื่อนไหว" : "Activity";
    return t(tab.labelKey as any);
  };

  /* ── Shared fade-in transition ─────────────────────── */
  const fadeProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">

      {/* ── Header + Tab Bar ─────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-primary" size={24} />
            {t("adminDashboard")}
          </h1>
          <p className="text-slate-400 text-[11px] md:text-xs mt-1">
            {t("adminDashboardDesc")}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 w-full lg:w-auto gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none lg:px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:text-slate-300"
                }`}
            >
              {tab.icon}
              {tabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* USERS */}
        {activeTab === "users" && (
          <motion.div key="users" {...fadeProps} className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder={t("searchUserPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent/90 transition-all active:scale-95 whitespace-nowrap"
                >
                  <TrendingUp size={16} />
                  {t("topUp")}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
                >
                  <UserPlus size={16} />
                  {t("createNewAccount")}
                </button>
              </div>
            </div>

            {/* Admin Accounts */}
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-primary" />
                  <h2 className="text-base font-bold text-white tracking-tight">{t("adminAccounts")}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-1">
                    {t("adminCountPrefix")} {filteredProfiles.filter((p) => p.is_admin).length} {t("adminCountSuffix")}
                  </span>
                </div>
                <UserTable
                  profiles={filteredProfiles.filter((p) => p.is_admin)}
                  loading={loading}
                  onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
                  onEditWallet={setEditingWalletProfile}
                  onEditControl={setEditingControlProfile}
                  onToggleRole={handleToggleRole}
                  emptyMessage={t("noAdminFound")}
                />
              </div>

              {/* Pending Verification Accounts */}
              {filteredProfiles.some(p => !p.is_admin && !p.is_verified) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={18} className="text-orange-500" />
                    <h2 className="text-base font-bold text-white tracking-tight">{t("pendingVerificationAccounts")}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-1">
                      {filteredProfiles.filter((p) => !p.is_admin && !p.is_verified).length} {t("unverifiedCountSuffix")}
                    </span>
                  </div>
                  <UserTable
                    profiles={filteredProfiles.filter((p) => !p.is_admin && !p.is_verified)}
                    loading={loading}
                   onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
                    onEditWallet={setEditingWalletProfile}
                    onEditControl={setEditingControlProfile}
                    onToggleRole={handleToggleRole}
                    onVerify={handleVerifyUser}
                    emptyMessage={t("noUserFound")}
                  />
                </div>
              )}

              {/* Regular Accounts (Verified Only) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h2 className="text-base font-bold text-white tracking-tight">{t("regularAccounts")}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-1">
                    {filteredProfiles.filter((p) => !p.is_admin && p.is_verified).length} {t("userCountSuffix")}
                  </span>
                </div>
                <UserTable
                  profiles={filteredProfiles.filter((p) => !p.is_admin && p.is_verified)}
                  loading={loading}
                  onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
                  onEditWallet={setEditingWalletProfile}
                  onEditControl={setEditingControlProfile}
                  onToggleRole={handleToggleRole}
                  emptyMessage={t("noUserFound")}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVITY */}
        {activeTab === "activity" && (
          <motion.div key="activity" {...fadeProps} className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              {language === "th" ? "ความเคลื่อนไหวของผู้ใช้" : "User Activity"}
            </h2>
            <UserActivityLog />
          </motion.div>
        )}

        {/* AUDIT LOGS */}
        {activeTab === "logs" && (
          <motion.div key="logs" {...fadeProps} className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={20} className="text-primary" />
              {t("auditLogs")}
            </h2>
            <AuditLogTable logs={auditLogs} loading={logsLoading} />
          </motion.div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <motion.div key="settings" {...fadeProps} className="max-w-2xl">
            <div className="glass-card space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{t("supportContactTitle")}</h2>
                  <p className="text-slate-400 text-[11px] md:text-xs mt-1">{t("supportContactDesc")}</p>
                </div>
              </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    {
                      key: "phone",
                      label: language === "th" ? "โทรศัพท์" : "Phone",
                      icon: <Phone size={18} />,
                      color: "text-sky-400",
                      bg: "bg-sky-400/10",
                      activeBg: "bg-sky-400",
                      placeholder: "8x xxx xxxx",
                      valueKey: "contact_phone" as const,
                      enabledKey: "phone_enabled" as const,
                      urlPrefix: "tel:",
                    },
                    {
                      key: "line",
                      label: "Line Official",
                      icon: <MessageCircle size={18} />,
                      color: "text-green-400",
                      bg: "bg-green-400/10",
                      activeBg: "bg-green-400",
                      placeholder: "@yourlineid",
                      valueKey: "contact_line" as const,
                      enabledKey: "line_enabled" as const,
                      urlPrefix: "https://line.me/ti/p/",
                    },
                    {
                      key: "telegram",
                      label: "Telegram",
                      icon: <Send size={18} />,
                      color: "text-blue-400",
                      bg: "bg-blue-400/10",
                      activeBg: "bg-blue-400",
                      placeholder: "@yourtelegramid",
                      valueKey: "contact_telegram" as const,
                      enabledKey: "telegram_enabled" as const,
                      urlPrefix: "https://t.me/",
                    },
                    {
                      key: "whatsapp",
                      label: "WhatsApp",
                      icon: <MessageSquare size={18} />,
                      color: "text-emerald-400",
                      bg: "bg-emerald-400/10",
                      activeBg: "bg-emerald-400",
                      placeholder: "812345678",
                      valueKey: "contact_whatsapp" as const,
                      enabledKey: "whatsapp_enabled" as const,
                      urlPrefix: "https://wa.me/",
                    },
                    {
                      key: "facebook",
                      label: "Facebook Page",
                      icon: <Globe size={18} />,
                      color: "text-blue-500",
                      bg: "bg-blue-500/10",
                      activeBg: "bg-blue-500",
                      placeholder: "yourpagename",
                      valueKey: "contact_facebook" as const,
                      enabledKey: "facebook_enabled" as const,
                      urlPrefix: "https://m.me/",
                    },
                    {
                      key: "email",
                      label: "Email Support",
                      icon: <Mail size={18} />,
                      color: "text-amber-400",
                      bg: "bg-amber-400/10",
                      activeBg: "bg-amber-400",
                      placeholder: "support@example.com",
                      valueKey: "contact_email" as const,
                      enabledKey: "email_enabled" as const,
                      urlPrefix: "mailto:",
                    },
                    {
                      key: "discord",
                      label: "Discord",
                      icon: <Hash size={18} />,
                      color: "text-violet-400",
                      bg: "bg-violet-400/10",
                      activeBg: "bg-violet-400",
                      placeholder: "discord.gg/yourserver",
                      valueKey: "contact_discord" as const,
                      enabledKey: "discord_enabled" as const,
                      urlPrefix: "https://",
                    },
                  ] as const).map((ch) => {
                    const value = globalSettings[ch.valueKey] as string;
                    const enabled = globalSettings[ch.enabledKey] as boolean;
                    return (
                      <div
                        key={ch.key}
                        className={`relative rounded-3xl border transition-all duration-500 overflow-hidden ${enabled
                            ? "bg-slate-800/40 border-white/10 shadow-xl shadow-black/20"
                            : "bg-slate-900/30 border-white/5 opacity-70 hover:opacity-100"
                          }`}
                      >
                        {/* Status Indicator Line */}
                        <div 
                          className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${enabled ? ch.activeBg : "bg-transparent"}`}
                        />
                        
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${enabled ? ch.bg + " " + ch.color : "bg-white/5 text-slate-500"
                                  }`}
                              >
                                {ch.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`font-black text-sm tracking-tight transition-colors ${enabled ? "text-white" : "text-slate-500"
                                    }`}
                                >
                                  {ch.label}
                                </p>
                                {value && enabled && (
                                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                    {ch.urlPrefix}{value.replace("@", "")}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                setGlobalSettings((prev) => ({
                                  ...prev,
                                  [ch.enabledKey]: !enabled,
                                }))
                              }
                              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${enabled
                                  ? "bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.4)]"
                                  : "bg-white/10"
                                }`}
                              aria-label={`Toggle ${ch.label}`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-1"
                                  }`}
                              />
                            </button>
                          </div>

                          {/* Input */}
                          <div className={`transition-all duration-500 ${enabled ? "opacity-100" : "opacity-50 pointer-events-none grayscale"}`}>
                            <AdminInput
                              label=""
                              icon={ch.icon}
                              value={value}
                              onChange={(val) =>
                                setGlobalSettings((prev) => ({
                                  ...prev,
                                  [ch.valueKey]: val,
                                }))
                              }
                              placeholder={ch.placeholder}
                              isPhone={ch.key === "phone" || ch.key === "whatsapp"}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security & Registration Settings */}
              <div className="glass-card bg-slate-900/50 border border-white/5 p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{language === "th" ? "การตั้งค่าความปลอดภัยและการสมัครสมาชิก" : "Security & Registration"}</h3>
                    <p className="text-[11px] text-slate-500">{language === "th" ? "ปรับแต่งวิธีการสมัครสมาชิกและระบบความปลอดภัย" : "Customize registration methods and security systems"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{language === "th" ? "สมัครสมาชิกด้วย Email OTP" : "Email OTP Registration"}</p>
                      <p className="text-xs text-slate-500">{language === "th" ? "ผู้ใช้ต้องยืนยันตัวตนผ่านอีเมลก่อนเริ่มใช้งาน" : "Users must verify identity via email before using"}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setGlobalSettings((prev) => ({
                        ...prev,
                        registration_otp_enabled: !prev.registration_otp_enabled,
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${globalSettings.registration_otp_enabled
                        ? "bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.4)]"
                        : "bg-white/10"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${globalSettings.registration_otp_enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{language === "th" ? "ทดสอบการเชื่อมต่อ" : "Test Connection"}</p>
                      <p className="text-[10px] text-slate-500">{language === "th" ? "ส่งอีเมลทดสอบไปยังบัญชีของคุณเพื่อตรวจสอบระบบ" : "Send a test email to your account to verify settings"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isTestingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      {language === "th" ? "ทดสอบอีเมล" : "Test Email"}
                    </button>
                  </div>

                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-[11px] flex gap-3 ${testResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                    >
                      {testResult.success ? <Shield size={16} /> : <ShieldAlert size={16} />}
                      <span>{testResult.msg}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={isSaving}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm font-bold"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t("saveAllSettings")}
              </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit User Modal ───────────────────────────── */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingProfile(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-xl relative z-10 p-5 md:p-8 max-h-[90vh] md:max-h-[95vh] overflow-y-auto scrollbar-hide mb-16 md:mb-0"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="text-primary" size={24} />
                  {t("editUserTitle")}: {editingProfile.first_name}
                </h3>
                <button onClick={() => setEditingProfile(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <AdminInput
                  label={t("firstName")}
                  value={editingProfile.first_name}
                  onChange={(val) => setEditingProfile({ ...editingProfile!, first_name: val })}
                />
                <AdminInput
                  label={t("lastName")}
                  value={editingProfile.last_name}
                  onChange={(val) => setEditingProfile({ ...editingProfile!, last_name: val })}
                />
                <div className="md:col-span-2">
                  <AdminInput
                    label={t("email")}
                    value={editingProfile.email}
                    onChange={(val) => setEditingProfile({ ...editingProfile!, email: val })}
                  />
                </div>
                <div className="md:col-span-1">
                  <AdminInput
                    label={t("password")}
                    type="password"
                    value={editingProfile.password || ""}
                    onChange={(val) => setEditingProfile({ ...editingProfile!, password: val })}
                  />
                </div>
                <div className="md:col-span-2">
                  <AdminInput
                    label={t("phone")}
                    value={editingProfile.phone_number || ""}
                    onChange={(val) => setEditingProfile({ ...editingProfile!, phone_number: val })}
                    isPhone={true}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all text-sm"
                >
                  {t("cancelChanges")}
                </button>
                <button
                  onClick={() => handleUpdateProfile(editingProfile!)}
                  disabled={isSaving}
                  className="flex-[2] btn-primary flex items-center justify-center gap-2 text-sm font-bold py-3"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {t("updateProfile")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Wallet Management Modal ─────────────────── */}
      <AnimatePresence>
        {editingWalletProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingWalletProfile(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md relative z-10 p-5 sm:p-6"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 leading-tight">
                  <Wallet className="flex-shrink-0 text-emerald-400" size={20} />
                  <span>{t("walletBalanceEdit")}: {editingWalletProfile.username}</span>
                </h3>
                <button onClick={() => setEditingWalletProfile(null)} className="flex-shrink-0 p-1 text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{t("balance")}</p>
                <p className="text-2xl sm:text-3xl font-black text-white">${editingWalletProfile.balance.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <AdminInput
                  label={t("amount")}
                  type="number"
                  value={walletAmount}
                  onChange={(val) => setWalletAmount(val)}
                />


                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUpdateWallet('withdraw')}
                    disabled={isSaving}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold hover:bg-rose-500/20 transition-all text-sm sm:text-base min-h-[56px]"
                  >
                    <ArrowDown size={16} className="flex-shrink-0" />
                    <span className="text-center">{t("walletWithdraw")}</span>
                  </button>
                  <button
                    onClick={() => handleUpdateWallet('deposit')}
                    disabled={isSaving}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-all text-sm sm:text-base min-h-[56px]"
                  >
                    <ArrowUp size={16} className="flex-shrink-0" />
                    <span className="text-center">{t("walletDeposit")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Trade Control Modal ─────────────────────── */}
      <AnimatePresence>
        {editingControlProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingControlProfile(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md relative z-10 p-5 sm:p-6"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 leading-tight">
                  <Settings2 className="flex-shrink-0 text-indigo-400" size={20} />
                  <span>{t("tradeControl")}: {editingControlProfile.username}</span>
                </h3>
                <button onClick={() => setEditingControlProfile(null)} className="flex-shrink-0 p-1 text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-6">
                {[
                  { id: 'normal', label: t("tradeNormal"), color: 'text-slate-400', bg: 'bg-slate-900' },
                  { id: 'always_win', label: t("tradeAlwaysWin"), color: 'text-green-400', bg: 'bg-green-500/10' },
                  { id: 'always_loss', label: t("tradeAlwaysLoss"), color: 'text-red-400', bg: 'bg-red-500/10' },
                  { id: 'low_win_rate', label: t("tradeLowWinRate"), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setEditingControlProfile({ ...editingControlProfile!, trade_control: option.id as any })}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      editingControlProfile.trade_control === option.id 
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--color-primary),0.1)]" 
                        : "border-white/5 bg-slate-900/50 hover:bg-slate-900"
                    }`}
                  >
                    <span className={`text-xs font-bold ${option.color}`}>{option.label}</span>
                    {editingControlProfile.trade_control === option.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleUpdateControl}
                disabled={isSaving}
                className="w-full btn-primary py-3 font-bold text-sm flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t("confirm")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create User Modal ─────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => { setShowCreateModal(false); fetchProfiles(); fetchAuditLogs(); }}
          />
        )}
      </AnimatePresence>

      {/* ── Top-Up Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showTopUpModal && (
          <TopUpModal
            onClose={() => setShowTopUpModal(false)}
            onSuccess={() => { setShowTopUpModal(false); fetchProfiles(); fetchAuditLogs(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
