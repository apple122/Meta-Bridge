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
} from "lucide-react";
import type { Profile, GlobalSettings } from "../types";
import { UserTable } from "../components/admin/UserTable";
import { AdminInput } from "../components/admin/AdminInput";
import { CreateUserModal } from "../components/admin/CreateUserModal";
import { TopUpModal } from "../components/admin/TopUpModal";
import { hashPassword, isHashed } from "../utils/security";
import { useLanguage } from "../contexts/LanguageContext";
import { AuditLogTable } from "../components/admin/AuditLogTable";
import { auditService } from "../services/auditService";
import { useAuth } from "../contexts/AuthContext";
import { UserActivityLog } from "../components/admin/UserActivityLog";

/* ─── Types ────────────────────────────────────────────── */
type AdminTab = "users" | "activity" | "logs" | "settings";

/* ─── Tab definition ───────────────────────────────────── */
const TABS: { id: AdminTab; labelKey: string; icon?: React.ReactNode }[] = [
  { id: "users",    labelKey: "users" },
  { id: "activity", labelKey: "activity", icon: <Activity size={13} /> },
  { id: "logs",     labelKey: "auditLogs", icon: <History size={13} /> },
  { id: "settings", labelKey: "settings" },
];

/* ═══════════════════════════════════════════════════════ */
export const Admin: React.FC = () => {
  const { t, language } = useLanguage();
  const { profile: currentAdmin } = useAuth();

  /* ── State ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  // Users
  const [profiles,       setProfiles]       = useState<Profile[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isSaving,       setIsSaving]       = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal,  setShowTopUpModal]  = useState(false);

  // Audit logs
  const [auditLogs,    setAuditLogs]    = useState<any[]>([]);
  const [logsLoading,  setLogsLoading]  = useState(false);

  // Settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    contact_phone:    "",
    contact_line:     "",
    contact_telegram: "",
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
      if (showCreateModal)    setShowCreateModal(false);
      else if (showTopUpModal) setShowTopUpModal(false);
      else if (editingProfile) setEditingProfile(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, showTopUpModal, editingProfile]);

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
        contact_phone:    data.contact_phone    || "",
        contact_line:     data.contact_line     || "",
        contact_telegram: data.contact_telegram || "",
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
      adminId:         currentAdmin.id,
      adminEmail:      currentAdmin.email || "unknown",
      targetUserId:    targetProfile?.id,
      targetUserEmail: targetProfile?.email,
      actionType,
      description,
      details: extra,
    });
    fetchAuditLogs();
  };

  const handleUpdateProfile = async (profile: Profile) => {
    setIsSaving(true);
    const updateData: any = {
      first_name:   profile.first_name,
      last_name:    profile.last_name,
      email:        profile.email,
      phone_number: profile.phone_number,
      balance:      profile.balance,
    };
    if (profile.password && !isHashed(profile.password)) {
      updateData.password = await hashPassword(profile.password);
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
    exit:    { opacity: 0, y: -10 },
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
              className={`flex-1 lg:flex-none lg:px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
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
                  onEdit={setEditingProfile}
                  onToggleRole={handleToggleRole}
                  emptyMessage={t("noAdminFound")}
                />
              </div>

              {/* Regular Accounts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h2 className="text-base font-bold text-white tracking-tight">{t("regularAccounts")}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-1">
                    {filteredProfiles.filter((p) => !p.is_admin).length} {t("userCountSuffix")}
                  </span>
                </div>
                <UserTable
                  profiles={filteredProfiles.filter((p) => !p.is_admin)}
                  loading={loading}
                  onEdit={setEditingProfile}
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
            <div className="glass-card space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{t("supportContactTitle")}</h2>
                  <p className="text-slate-400 text-[11px] md:text-xs mt-1">{t("supportContactDesc")}</p>
                </div>
              </div>

              <div className="space-y-6">
                <AdminInput
                  label={t("phoneContact")}
                  icon={<Phone size={18} />}
                  value={globalSettings.contact_phone}
                  onChange={(val) => setGlobalSettings((prev) => ({ ...prev, contact_phone: val }))}
                  placeholder="+66 8x xxx xxxx"
                />
                <AdminInput
                  label="Line ID"
                  icon={<MessageCircle size={18} />}
                  value={globalSettings.contact_line}
                  onChange={(val) => setGlobalSettings((prev) => ({ ...prev, contact_line: val }))}
                  placeholder="@yourlineid"
                />
                <AdminInput
                  label="Telegram ID"
                  icon={<Send size={18} />}
                  value={globalSettings.contact_telegram}
                  onChange={(val) => setGlobalSettings((prev) => ({ ...prev, contact_telegram: val }))}
                  placeholder="@yourtelegramid"
                />
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={isSaving}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm font-bold"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t("saveAllSettings")}
              </button>
            </div>
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
                  onChange={(val) => setEditingProfile({ ...editingProfile, first_name: val })}
                />
                <AdminInput
                  label={t("lastName")}
                  value={editingProfile.last_name}
                  onChange={(val) => setEditingProfile({ ...editingProfile, last_name: val })}
                />
                <div className="md:col-span-2">
                  <AdminInput
                    label={t("email")}
                    value={editingProfile.email}
                    onChange={(val) => setEditingProfile({ ...editingProfile, email: val })}
                  />
                </div>
                <div className="md:col-span-1">
                  <AdminInput
                    label={t("password")}
                    type="password"
                    value={editingProfile.password || ""}
                    onChange={(val) => setEditingProfile({ ...editingProfile, password: val })}
                  />
                </div>
                <div className="md:col-span-2">
                  <AdminInput
                    label={t("phone")}
                    value={editingProfile.phone_number}
                    onChange={(val) => setEditingProfile({ ...editingProfile, phone_number: val })}
                  />
                </div>

                {/* Balance (read-only display) */}
                <div className="md:col-span-2 p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/20">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                    {t("walletBalanceEdit")}
                  </label>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="text-primary" size={24} />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editingProfile.balance}
                      readOnly
                      onChange={(e) =>
                        setEditingProfile({ ...editingProfile, balance: parseFloat(e.target.value) || 0 })
                      }
                      className="bg-transparent border-none text-xl md:text-2xl font-black text-white focus:outline-none w-full"
                    />
                  </div>
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
                  onClick={() => handleUpdateProfile(editingProfile)}
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
