import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Save,
  Landmark,
  History,
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowLeft,
  Bell,
  BellOff,
  AlertCircle,
} from "lucide-react";
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
} from "../../utils/notifications";
import { supabase } from "../../lib/supabase";
import { SettingsInput } from "./SettingsInput";
import { useLanguage } from "../../contexts/LanguageContext";
import { generateOTP } from "../../utils/otp";
import { emailService } from "../../services/emailService";
import { Check, Globe } from "lucide-react";

interface SettingsContentProps {
  activeTab: "profile" | "bank" | "security" | "history" | "notifications" | "language";
  balance: number;
  t: (key: string) => string;
  onClose: () => void;
  isMobile?: boolean;
  profileData: any;
  setProfileData: any;
  userId?: string;
  refreshProfile: () => Promise<void>;
  transactions?: any[];
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeTab,
  t,
  onClose,
  isMobile,
  profileData,
  setProfileData,
  userId,
  refreshProfile,
  transactions = [],
}) => {
  const {  } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(() => {
    return sessionStorage.getItem("settings_is_changing_password") === "true";
  });
  
  React.useEffect(() => {
    sessionStorage.setItem("settings_is_changing_password", isChangingPassword.toString());
  }, [isChangingPassword]);
  
  // OTP States
  const [isOtpFlow, setIsOtpFlow] = useState(() => {
    return sessionStorage.getItem("settings_is_otp_flow") === "true";
  });
  const [otpStep, setOtpStep] = useState<"request" | "verify" | "new_password">(() => {
    return sessionStorage.getItem("settings_otp_step") as any || "request";
  });

  React.useEffect(() => {
    sessionStorage.setItem("settings_is_otp_flow", isOtpFlow.toString());
    sessionStorage.setItem("settings_otp_step", otpStep);
  }, [isOtpFlow, otpStep]);

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Email States
  const [isEmailFlow, setIsEmailFlow] = useState(() => {
    return sessionStorage.getItem("settings_is_email_flow") === "true";
  });
  const [emailOtpStep, setEmailOtpStep] = useState<"request_old" | "verify_old" | "new_email" | "verify_new">(() => {
    return sessionStorage.getItem("settings_email_otp_step") as any || "request_old";
  });

  React.useEffect(() => {
    sessionStorage.setItem("settings_is_email_flow", isEmailFlow.toString());
    sessionStorage.setItem("settings_email_otp_step", emailOtpStep);
  }, [isEmailFlow, emailOtpStep]);
  const [isLoginHistoryFlow, setIsLoginHistoryFlow] = useState(false);
  const [loginHistoryList, setLoginHistoryList] = useState<any[]>([]);
  const [isLoginHistoryLoading, setIsLoginHistoryLoading] = useState(false);
  
  React.useEffect(() => {
    if (isLoginHistoryFlow && userId) {
      const fetchHistory = async () => {
         setIsLoginHistoryLoading(true);
         const { data } = await supabase
           .from("user_login_history")
           .select("*")
           .eq("user_id", userId)
           .order("created_at", { ascending: false })
           .limit(10);
         if (data) setLoginHistoryList(data);
         setIsLoginHistoryLoading(false);
      };
      fetchHistory();
    }
  }, [isLoginHistoryFlow, userId]);

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermissionStatus());

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          username: profileData.username,
          phone_number: profileData.phone_number,
          address: profileData.address,
          bank_network: profileData.bank_network,
          bank_account: profileData.bank_account,
          bank_name: profileData.bank_name,
        })
        .eq("id", userId);

      if (error) throw error;

      await refreshProfile();
      setSaveMessage("Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Error saving data");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNormalPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setSaveMessage("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      if (!userId) throw new Error("You must be logged in to change your password");

      const { data: userProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("password")
        .eq("id", userId)
        .single();
        
      if (fetchError || !userProfile) throw new Error("User not found");
      
      if (userProfile.password !== currentPassword) {
        throw new Error("Current password incorrect");
      }
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ password: newPassword })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      setSaveMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setSaveMessage("");
        setIsChangingPassword(false);
      }, 3000);
    } catch (err: any) {
      setSaveMessage(err.message || "Error updating password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!profileData.email) {
      setOtpError("Email not found. Please refresh the page.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
      
      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);

      if (error) throw error;

      await emailService.sendOTP({ 
        email: profileData.email, 
        code, 
        userName: profileData.first_name,
        type: 'reset'
      });

      setOtpStep("verify");
    } catch (err: any) {
      setOtpError(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
       const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", otpCode)
        .single();

      if (error || !data) throw new Error(t("invalidOtp"));
      
      // Check expiry
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));

      setOtpStep("new_password");
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setOtpError("Passwords do not match");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ password: newPassword, otp_code: null })
        .eq("id", userId);

      if (error) throw error;
      setSaveMessage(t("passwordChanged"));
      setIsOtpFlow(false);
      setOtpStep("request");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: any) {
      setOtpError(err.message || "Error resetting password");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendOldEmailOtp = async () => {
    setEmailLoading(true);
    setEmailError("");
    try {
      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);
      if (error) throw error;
      await emailService.sendOTP({ 
        email: profileData.email, 
        code, 
        userName: profileData.first_name || "User",
        type: 'change_email'
      });
      setEmailOtpStep("verify_old");
    } catch (err: any) {
      setEmailError(err.message || "Failed to send code");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOldEmailOtp = async () => {
    setEmailLoading(true);
    setEmailError("");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", emailOtp)
        .single();
      if (error || !data) throw new Error(t("invalidOtp"));
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ otp_code: null })
        .eq("id", userId);
      
      if (updateError) throw updateError;
      
      setEmailOtpStep("new_email");
      setEmailOtp("");
    } catch (err: any) {
      setEmailError(err.message || "Invalid or expired OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    try {
      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);
      if (error) throw error;
      await emailService.sendOTP({ 
        email: newEmail, 
        code, 
        userName: profileData.first_name || "User",
        type: 'change_email'
      });
      setEmailOtpStep("verify_new");
    } catch (err: any) {
      setEmailError(err.message || "Failed to send code");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailLoading(true);
    setEmailError("");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", emailOtp)
        .single();
      if (error || !data) throw new Error(t("invalidOtp"));
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ email: newEmail, otp_code: null })
        .eq("id", userId);
      
      if (updateError) throw updateError;
      
      setProfileData((prev: any) => ({...prev, email: newEmail}));
      setSaveMessage(t("emailUpdated"));
      setIsEmailFlow(false);
      setEmailOtpStep("request_old");
      setNewEmail("");
      setEmailOtp("");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: any) {
      setEmailError(err.message || "Invalid or expired OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  };

  return (
    <AnimatePresence mode="wait">
      {activeTab === "profile" && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card space-y-8 relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-primary/20">
              {profileData.first_name && profileData.last_name
                ? `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase()
                : (profileData.username || "AC").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                {t("verification")}
              </h2>
              <p className="text-slate-400 text-sm">
                {t("managePersonalInfo")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsInput
              label={t("firstName")}
              placeholder="John"
              value={profileData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
            />
            <SettingsInput
              label={t("lastName")}
              placeholder="Doe"
              value={profileData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
            />
            <SettingsInput
              label={t("username")}
              placeholder="johndoe123"
              value={profileData.username}
              onChange={(e) => updateField("username", e.target.value)}
            />
            <SettingsInput
              label={t("phone")}
              placeholder="08x-xxx-xxxx"
              value={profileData.phone_number}
              onChange={(e) => updateField("phone_number", e.target.value)}
            />
            <div className="md:col-span-2">
              <SettingsInput
                label={t("address")}
                placeholder="123 Example St."
                value={profileData.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <div className="text-sm font-bold text-green-500">
              {saveMessage}
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:text-white transition-colors">
                {t("discard")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {t("save")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "bank" && (
        <motion.div
          key="bank"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card space-y-8 relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
              <Landmark size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                {t("bankDetails")}
              </h2>
              <p className="text-slate-400 text-sm">
                {t("bankDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <SettingsInput
              label={t("network")}
              placeholder="e.g. ERC-20, BEP-20, Regional Bank"
              value={profileData.bank_network}
              onChange={(e) => updateField("bank_network", e.target.value)}
            />
            <SettingsInput
              label={t("accountAddress")}
              placeholder="Paste your wallet address or account number"
              value={profileData.bank_account}
              onChange={(e) => updateField("bank_account", e.target.value)}
            />
            <SettingsInput
              label={t("accountName")}
              placeholder="Full name on account"
              value={profileData.bank_name}
              onChange={(e) => updateField("bank_name", e.target.value)}
            />
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex gap-3">
            <ShieldCheck size={18} className="shrink-0" />
            <p>
              {t("bankWarning")}
            </p>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <div className="text-sm font-bold text-green-500">
              {saveMessage}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {t("save")}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === "security" && (
        <motion.div
          key="security"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card max-w-lg relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}

          {!isOtpFlow && !isEmailFlow && !isChangingPassword && !isLoginHistoryFlow ? (
            <div className="space-y-8">
              {/* Account Binding Section */}
              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {t("accountSecurity") || t("changePassword")}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {t("securityDescription")}
                </p>

                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  {t("loginMethods") || "Login Methods"}
                </h3>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{t("emailLogin")}</p>
                      <p className="text-xs text-slate-400">{profileData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                      {t("connected") || "Connected"}
                    </span>
                    <button 
                      onClick={() => setIsEmailFlow(true)}
                      className="text-xs font-bold text-primary hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary"
                    >
                      {t("changeEmail") || "Change Email"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login History Section */}
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <History size={16} className="text-primary" />
                  {t("loginHistory")}
                </h3>
                <div className="p-4 flex items-center justify-between rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white font-bold text-sm">{t("recentActivity")}</p>
                    <p className="text-xs text-slate-400">{t("viewRecentSignins")}</p>
                  </div>
                  <button 
                    onClick={() => setIsLoginHistoryFlow(true)}
                    className="text-xs font-bold text-primary hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary"
                  >
                    {t("viewHistory")}
                  </button>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <KeyRound size={16} className="text-primary" />
                    {t("changePassword")}
                  </h3>
                  <button
                    onClick={() => setIsOtpFlow(true)}
                    className="text-xs font-bold text-primary hover:underline transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white font-bold text-sm">{t("accountPassword")}</p>
                    <p className="text-xs text-slate-400">{t("updatePasswordDesc")}</p>
                  </div>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="text-xs font-bold text-primary hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary"
                  >
                    {t("changePassword")}
                  </button>
                </div>
              </div>
            </div>
          ) : isChangingPassword ? (
             <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setSaveMessage("");
                    }}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-black text-white">{t("changePassword")}</h2>
                </div>
                
                <p className="text-slate-400 text-sm mb-6">
                  {t("ensureStrongPassword")}
                </p>

                <div className="space-y-4">
                  <SettingsInput
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <SettingsInput
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <SettingsInput
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {saveMessage && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${saveMessage.includes("success") || saveMessage.includes("สำเร็จ") ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                    {saveMessage}
                  </div>
                )}

                <button
                  onClick={handleNormalPasswordUpdate}
                  disabled={isSaving}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                  {t("save")}
                </button>
             </div>
          ) : isLoginHistoryFlow ? (
             <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setIsLoginHistoryFlow(false)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-black text-white">{t("loginHistory")}</h2>
                </div>
                
                <p className="text-slate-400 text-sm mb-6">
                  {t("loginHistoryDesc")}
                </p>

                <div className="space-y-3">
                  {isLoginHistoryLoading ? (
                    <div className="py-8 flex justify-center text-primary">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : loginHistoryList.length > 0 ? (
                    loginHistoryList.map((hist, i) => (
                      <div key={hist.id || i} className={`p-4 rounded-xl bg-white/5 border ${i === 0 ? "border-primary/20 relative overflow-hidden" : "border-white/5"}`}>
                        {i === 0 && <div className="absolute top-0 right-0 p-1 bg-green-500/20 text-green-500 text-[9px] font-bold px-2 rounded-bl-lg">{t("lastSignedIn")}</div>}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400"}`}>
                              <Globe size={18} />
                            </div>
                            <div>
                               <p className="text-white font-bold text-sm text-shadow-sm">{hist.device_info}</p>
                               <p className="text-xs text-slate-400">
                                 {hist.ip_address && hist.ip_address !== "Unknown IP" ? `${hist.ip_address} • ` : ""}
                                 {new Date(hist.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      {t("noRecentActivity")}
                    </div>
                  )}
                </div>
             </div>
          ) : isEmailFlow ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setIsEmailFlow(false);
                    setEmailOtpStep("request_old");
                    setNewEmail("");
                    setEmailOtp("");
                    setEmailError("");
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-white">{t("updateEmail")}</h2>
              </div>

              {emailOtpStep === "request_old" && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Mail size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{t("verifyCurrentEmail")}</p>
                    <p className="text-sm text-slate-400 px-8">
                      {t("verifyCurrentEmailDesc")}
                      <span className="text-primary block mt-1">{profileData.email}</span>
                    </p>
                  </div>
                  {emailError && (
                    <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                      {emailError}
                    </div>
                  )}
                  <button
                    onClick={handleSendOldEmailOtp}
                    disabled={emailLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </div>
              )}

              {emailOtpStep === "verify_old" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("enterVerificationCode")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxCode")}
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                  {emailError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {emailError}
                    </div>
                  )}
                  <button
                    onClick={handleVerifyOldEmailOtp}
                    disabled={emailLoading || emailOtp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                  </button>
                  <button 
                    onClick={handleSendOldEmailOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </div>
              )}

              {emailOtpStep === "new_email" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("newEmail")}</p>
                    <p className="text-sm text-slate-400">
                      {t("enterNewEmailDesc")}
                    </p>
                  </div>
                  <SettingsInput
                    label={t("newEmail")}
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@mail.com"
                  />
                  {emailError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {emailError}
                    </div>
                  )}
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={emailLoading || !newEmail.includes("@")}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </div>
              )}

              {emailOtpStep === "verify_new" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("verifyNewEmail")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxNewEmail")} <span className="text-primary">{newEmail}</span>.
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                  {emailError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {emailError}
                    </div>
                  )}
                  <button
                    onClick={handleVerifyEmailOtp}
                    disabled={emailLoading || emailOtp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyAndUpdateEmail")}
                  </button>
                  <button 
                    onClick={handleSendEmailOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setIsOtpFlow(false);
                    setOtpStep("request");
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-white">{t("resetPassword")}</h2>
              </div>

              {otpStep === "request" && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Mail size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{t("requestPasswordReset")}</p>
                    <p className="text-sm text-slate-400 px-8">
                      {t("sendCodeToEmail")} 
                      <span className="text-primary block mt-1">{profileData.email}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </div>
              )}

              {otpStep === "verify" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("enterVerificationCode")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxCode")}
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                  {otpError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {otpError}
                    </div>
                  )}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                  </button>
                  <button 
                    onClick={handleSendOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </div>
              )}

              {otpStep === "new_password" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("setNewPassword")}</p>
                    <p className="text-sm text-slate-400">
                      {t("codeVerifiedNewPassword")}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <SettingsInput
                      label={t("newPasswordLabel")}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <SettingsInput
                      label={t("confirmNewPasswordLabel")}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {otpError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {otpError}
                    </div>
                  )}
                  <button
                    onClick={handleOtpPasswordUpdate}
                    disabled={otpLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("resetPassword")}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div
          key="history"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card max-w-lg relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <h2 className="text-2xl font-black text-white mb-2">
            {t("historyDeposit")}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {t("historyDepositDesc")}
          </p>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {transactions.filter((t) => t.type === "deposit").length === 0 ? (
              <div className="text-center py-8">
                <History
                  size={48}
                  className="mx-auto text-slate-600 mb-4 opacity-50"
                />
                <p className="text-slate-400 text-sm font-bold">
                  {t("noDepositHistory")}
                </p>
              </div>
            ) : (
              transactions
                .filter((t) => t.type === "deposit")
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-black">
                        +
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm uppercase">
                          {tx.asset || "Deposit"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-bold text-sm">
                        +$
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div
          key="notifications"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card max-w-lg relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <h2 className="text-2xl font-black text-white mb-2">
            {t("systemNotifications")}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {t("systemNotificationsDesc")}
          </p>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  notificationPermission === 'granted' ? 'bg-green-500/20 text-green-500' : 
                  notificationPermission === 'denied' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                }`}>
                  {notificationPermission === 'granted' ? <Bell size={24} /> : 
                   notificationPermission === 'denied' ? <BellOff size={24} /> : <Bell size={24} />}
                </div>
                <div>
                  <p className="text-white font-bold">
                    {notificationPermission === 'granted' ? t("notificationsEnabled") : 
                     notificationPermission === 'denied' ? t("notificationsDisabled") : t("enableNotifications")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {notificationPermission === 'unsupported' ? t("notificationsUnsupported") : 
                     notificationPermission === 'denied' ? t("notificationsDenied") : 'Web Push Notifications'}
                  </p>
                </div>
              </div>
              
              {notificationPermission !== 'unsupported' && (
                <button
                  onClick={handleRequestPermission}
                  disabled={notificationPermission === 'granted'}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    notificationPermission === 'granted' 
                    ? 'bg-green-500/20 text-green-500 cursor-default' 
                    : 'bg-primary text-white hover:bg-primary/80 active:scale-95'
                  }`}
                >
                  {notificationPermission === 'granted' ? t('notificationsEnabled') : t('enableNotifications')}
                </button>
              )}
            </div>

            {notificationPermission === 'denied' && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-3">
                <AlertCircle size={18} className="shrink-0" />
                <p>{t("notificationsDenied")}</p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("notificationTypes")}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <span className="text-sm font-bold text-white">{t("tradeOutcomes")}</span>
                  <div className="w-10 h-5 rounded-full bg-green-500 relative cursor-default">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 opacity-50">
                  <span className="text-sm font-bold text-white">{t("priceAlerts")}</span>
                  <div className="w-10 h-5 rounded-full bg-slate-700 relative cursor-not-allowed">
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-slate-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "language" && (
        <motion.div
          key="language"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card max-w-lg relative"
        >
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <h2 className="text-2xl font-black text-white mb-2">
            {t("languageSettings")}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {t("languageSettingsDesc")}
          </p>

          <div className="space-y-3">
            {[
              { id: 'th', label: 'ภาษาไทย (Thai)', icon: '🇹🇭' },
              { id: 'en', label: 'English (US)', icon: '🇺🇸' },
            ].map((lang) => {
              const { language, setLanguage } = useLanguage();
              const isActive = language === lang.id;

              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as 'th' | 'en')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/10 border-primary/50 text-white shadow-lg shadow-primary/10' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl leading-none">{lang.icon}</span>
                    <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {lang.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-background">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Globe size={24} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("translationsApplied")}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
