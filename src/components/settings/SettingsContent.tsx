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
  CheckCircle,
  X,
  User,
  Smartphone,
  Tablet,
  Monitor,
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
import { encryptPassword, comparePassword } from "../../utils/security";
import { Check, Globe, Zap, Cpu } from "lucide-react";

const THAI_BANKS = [
  { id: 'KBank', name: 'Kasikorn Bank', nameTh: 'ธนาคารกสิกรไทย', color: '#00A950', icon: 'K' },
  { id: 'SCB', name: 'Siam Commercial Bank', nameTh: 'ธนาคารไทยพาณิชย์', color: '#4E2E7F', icon: 'S' },
  { id: 'BBL', name: 'Bangkok Bank', nameTh: 'ธนาคารกรุงเทพ', color: '#1E4595', icon: 'B' },
  { id: 'KTB', name: 'Krungthai Bank', nameTh: 'ธนาคารกรุงไทย', color: '#00A1E0', icon: 'KTB' },
  { id: 'Krungsri', name: 'Krungsri Bank', nameTh: 'ธนาคารกรุงศรีอยุธยา', color: '#FFD700', icon: 'KS' },
  { id: 'TTB', name: 'ttb bank', nameTh: 'ธนาคารทหารไทยธนชาต', color: '#001E62', icon: 'ttb' },
  { id: 'GSB', name: 'Government Savings Bank', nameTh: 'ธนาคารออมสิน', color: '#EC068D', icon: 'GSB' },
];

const CRYPTO_NETWORKS = [
  { id: 'TRC-20', name: 'USDT (TRC-20)', desc: 'Tron Network (Low Fee)', color: '#FF0013' },
  { id: 'ERC-20', name: 'USDT (ERC-20)', desc: 'Ethereum Network', color: '#627EEA' },
  { id: 'BEP-20', name: 'USDT (BEP-20)', desc: 'Binance Smart Chain', color: '#F3BA2F' },
];

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
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(() => {
    return sessionStorage.getItem("settings_is_changing_password") === "true";
  });

  // Notification System
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  
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
  
  // Bank 2.0 States
  const [bankType, setBankType] = useState<"bank" | "crypto">(() => {
    const net = profileData.bank_network?.toUpperCase() || "";
    return (net.includes("RC-") || net.includes("EP-")) ? "crypto" : "bank";
  });
  const [tempBankNetwork, setTempBankNetwork] = useState(profileData.bank_network);
  const [tempBankName, setTempBankName] = useState(profileData.bank_name);
  const [tempBankAccount, setTempBankAccount] = useState(profileData.bank_account);

  // Validation functions
  const getAccountError = () => {
    if (!tempBankAccount) return "";
    
    if (bankType === "bank") {
      const digitsOnly = tempBankAccount.replace(/[^0-9]/g, "");
      if (digitsOnly.length !== tempBankAccount.length) {
        return language === "th" ? "เลขบัญชีต้องเป็นตัวเลขเท่านั้น" : "Account number must contain only digits";
      }
      if (tempBankAccount.length < 10 || tempBankAccount.length > 12) {
        return language === "th" ? "เลขบัญชีธนาคารปกติจะมี 10-12 หลัก" : "Bank accounts are usually 10-12 digits";
      }
    } else {
      if (tempBankNetwork === "TRC-20") {
        if (!tempBankAccount.startsWith("T")) {
          return language === "th" ? "ที่อยู่ TRC-20 ต้องขึ้นต้นด้วย 'T'" : "TRC-20 address must start with 'T'";
        }
        if (tempBankAccount.length !== 34) {
          return language === "th" ? "ที่อยู่ TRC-20 ต้องมีความยาว 34 ตัวอักษร" : "TRC-20 address must be 34 characters long";
        }
      } else if (tempBankNetwork === "ERC-20" || tempBankNetwork === "BEP-20") {
        if (!tempBankAccount.startsWith("0x")) {
          return language === "th" ? "ที่อยู่ต้องขึ้นต้นด้วย '0x'" : "Address must start with '0x'";
        }
        if (tempBankAccount.length !== 42) {
          return language === "th" ? "ที่อยู่ต้องมีความยาว 42 ตัวอักษร" : "Address must be 42 characters long";
        }
      }
    }
    return "";
  };

  const accountError = getAccountError();

  React.useEffect(() => {
    if (activeTab === "bank") {
      setTempBankNetwork(profileData.bank_network);
      setTempBankName(profileData.bank_name);
      setTempBankAccount(profileData.bank_account);
      const net = profileData.bank_network?.toUpperCase() || "";
      setBankType((net.includes("RC-") || net.includes("EP-")) ? "crypto" : "bank");
    }
  }, [activeTab, profileData]);
  
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

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermissionStatus());

  const handleSave = async () => {
    if (!userId) return;
    
    // Basic Validation
    if (!profileData.first_name?.trim() || !profileData.last_name?.trim()) {
      const fallbackMsg = language === "th" ? "กรุณาระบุชื่อและนามสกุล" : "First name and last name are required";
      showToast(t("nameRequired") !== "nameRequired" ? t("nameRequired") : fallbackMsg, "error");
      return;
    }

    if (profileData.username && profileData.username.length < 3) {
      showToast(t("usernameTooShort") || "Username must be at least 3 characters", "error");
      return;
    }

    setIsSaving(true);
    try {
      let newKycStatus = profileData.kyc_status;
      const isProfileComplete = Boolean(
        profileData.first_name?.trim() && 
        profileData.last_name?.trim() && 
        profileData.phone_number?.trim() && 
        profileData.address?.trim()
      );
      const isBankComplete = Boolean(
        profileData.bank_network?.trim() && 
        profileData.bank_account?.trim() && 
        profileData.bank_name?.trim()
      );
      
      if (isProfileComplete && isBankComplete && newKycStatus !== "verified") {
        newKycStatus = "verified";
      } else if ((!isProfileComplete || !isBankComplete) && newKycStatus === "verified") {
        newKycStatus = "unverified";
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profileData.first_name.trim(),
          last_name: profileData.last_name.trim(),
          username: profileData.username?.trim(),
          phone_number: profileData.phone_number?.trim(),
          address: profileData.address?.trim(),
          bank_network: profileData.bank_network?.trim(),
          bank_account: profileData.bank_account?.trim(),
          bank_name: profileData.bank_name?.trim(),
          kyc_status: newKycStatus,
        })
        .eq("id", userId);

      if (error) {
        // Handle specific unique constraint error for username
        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error(t("usernameTaken") || "This username is already taken");
        }
        console.error("[Settings] handleSave Error Object:", error);
        throw error;
      };
      
      showToast(t("saveSuccess") || "Settings saved successfully", "success");
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNormalPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (!userId) throw new Error("You must be logged in to change your password");

      const { data: userProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("password")
        .eq("id", userId)
        .single();
        
      if (fetchError || !userProfile) throw new Error("User not found");
      
      if (!(await comparePassword(currentPassword, userProfile.password))) {
        throw new Error("Current password incorrect");
      }
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ password: encryptPassword(newPassword) })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err: any) {
      showToast(err.message || "Error updating password", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!profileData.email) {
      showToast("Email not found. Please refresh the page.", "error");
      return;
    }
    setOtpLoading(true);
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
      showToast("Verification code sent!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
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
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ password: encryptPassword(newPassword), otp_code: null })
        .eq("id", userId);

      if (error) throw error;
      showToast(t("passwordChanged"), "success");
      setIsOtpFlow(false);
      setOtpStep("request");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Error resetting password", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendOldEmailOtp = async () => {
    setEmailLoading(true);
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
      showToast("Verification code sent!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send code", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOldEmailOtp = async () => {
    setEmailLoading(true);
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
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setEmailLoading(true);
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
      showToast("Verification code sent to new email!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send code", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailLoading(true);
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
      showToast(t("emailUpdated"), "success");
      setIsEmailFlow(false);
      setEmailOtpStep("request_old");
      setNewEmail("");
      setEmailOtp("");
    } catch (err: any) {
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  };

  return (
    <>
      <div className="fixed top-20 right-6 z-[200] space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto backdrop-blur-xl border ${
                n.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === "success" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                {n.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              </div>
              <span className="font-bold text-sm">{n.message}</span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
          className="glass-card relative"
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
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{t("verification")}</h2>
              <p className="text-slate-400 text-sm">{t("managePersonalInfo")}</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8 mt-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsInput
                  label={t("firstName")}
                  placeholder="สมชาย"
                  value={profileData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                />
                <SettingsInput
                  label={t("lastName")}
                  placeholder="ใจดี"
                  value={profileData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsInput
                  label={t("username")}
                  placeholder="somchai123"
                  value={profileData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                />
                <SettingsInput
                  label={t("phone")}
                  placeholder="08x-xxx-xxxx"
                  value={profileData.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <SettingsInput
                  label={t("address")}
                  placeholder="123 Example St."
                  value={profileData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end items-center pt-6 border-t border-white/5 gap-3">
              <button
                type="button"
                onClick={() => refreshProfile()}
                className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:text-white transition-colors"
              >
                {t("discard")}
              </button>
              <button
                type="submit"
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
          </form>
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
              <h2 className="text-2xl font-black text-white">{t("bankDetails")}</h2>
              <p className="text-slate-400 text-sm">{t("bankDescription")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Bank/Crypto Toggle */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full max-w-sm mx-auto">
              {(["bank", "crypto"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBankType(type)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    bankType === type 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {type === "bank" ? <Landmark size={14} /> : <Zap size={14} />}
                  {type === "bank" ? (language === "th" ? "ธนาคารไทย" : "Thai Bank") : (language === "th" ? "คริปโต (USDT)" : "Crypto Wallet")}
                </button>
              ))}
            </div>

            <form 
              onSubmit={async (e) => { 
                e.preventDefault(); 
                
                // Block saving if there's a validation error
                if (accountError) {
                  showToast(accountError, "error");
                  return;
                }

                setIsSaving(true);
                
                let newKycStatus = profileData.kyc_status;
                const isProfileComplete = Boolean(
                  profileData.first_name?.trim() && 
                  profileData.last_name?.trim() && 
                  profileData.phone_number?.trim() && 
                  profileData.address?.trim()
                );
                const isBankComplete = Boolean(
                  tempBankNetwork?.trim() && 
                  tempBankAccount?.trim() && 
                  tempBankName?.trim()
                );
                
                if (isProfileComplete && isBankComplete && newKycStatus !== "verified") {
                  newKycStatus = "verified";
                } else if ((!isProfileComplete || !isBankComplete) && newKycStatus === "verified") {
                  newKycStatus = "unverified";
                }

                const { error } = await supabase
                  .from("profiles")
                  .update({
                    bank_network: tempBankNetwork,
                    bank_account: tempBankAccount,
                    bank_name: tempBankName,
                    kyc_status: newKycStatus
                  })
                  .eq("id", userId);
                
                if (!error) {
                  showToast(language === "th" ? "บันทึกข้อมูลสำเร็จ" : "Bank details updated", "success");
                  await refreshProfile();
                } else {
                  showToast(error.message, "error");
                }
                setIsSaving(false);
              }} 
              className="space-y-8"
            >
              <div className="space-y-6">
                {bankType === "bank" ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                      {t("selectBank")}
                    </label>
                    {/* Custom Dropdown */}
                    <div className="relative">
                      <select
                        value={tempBankNetwork || ""}
                        onChange={(e) => {
                          setTempBankNetwork(e.target.value);
                          setTempBankName("");
                        }}
                        className="w-full appearance-none bg-slate-900 border border-white/10 rounded-2xl py-4 pl-16 pr-10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                      >
                        <option value="" disabled>{language === "th" ? "— เลือกธนาคาร —" : "— Select a bank —"}</option>
                        {THAI_BANKS.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {language === "th" ? bank.nameTh : bank.name}
                          </option>
                        ))}
                      </select>

                      {/* Left: colored bank logo */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {(() => {
                          const bank = THAI_BANKS.find(b => b.id === tempBankNetwork);
                          return bank ? (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-md"
                              style={{ backgroundColor: bank.color }}
                            >
                              {bank.icon}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                              <Landmark size={16} className="text-slate-500" />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right: chevron arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                      {t("network")}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CRYPTO_NETWORKS.map((net) => (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => setTempBankNetwork(net.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all  ${
                            tempBankNetwork === net.id 
                              ? "bg-white/10 border-white/30 ring-1 ring-white/10" 
                              : "bg-white/5 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: net.color }}
                          >
                            <Cpu size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-bold text-xs">{net.name}</p>
                            <p className="text-[10px] text-slate-500 leading-none mt-1">{net.desc}</p>
                          </div>
                          {tempBankNetwork === net.id && (
                             <div className="ml-auto text-primary">
                               <Check size={14} strokeWidth={4} />
                             </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                   <div className="space-y-1">
                    <SettingsInput
                      label={bankType === "bank" ? t("accountNumberLabel") : t("walletAddress")}
                      placeholder={bankType === "bank" ? "xxx-x-xxxxx-x" : "Paste your TRC-20 address"}
                      value={tempBankAccount || ""}
                      onChange={(e) => setTempBankAccount(e.target.value)}
                    />
                    {accountError && (
                      <p className="text-red-400 text-[10px] font-bold ml-1 animate-pulse">
                        ⚠️ {accountError}
                      </p>
                    )}
                  </div>
                  
                  <SettingsInput
                    label={t("accountName")}
                    placeholder="Full name on account"
                    value={tempBankName || ""}
                    onChange={(e) => setTempBankName(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex gap-3">
                <ShieldCheck size={18} className="shrink-0" />
                <p>{t("bankWarning")}</p>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSaving || !tempBankNetwork || !tempBankAccount || !tempBankName || !!accountError}
                  className="btn-primary flex items-center gap-4 px-10 disabled:opacity-50 h-12"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span className="text-base">{t("save")}</span>
                </button>
              </div>
            </form>
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
             <form onSubmit={(e) => { e.preventDefault(); handleNormalPasswordUpdate(); }} className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
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

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                  {t("save")}
                </button>
             </form>
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
                    loginHistoryList.map((hist, i) => {
                      const isMobile = /iPhone|Android|Mobile/i.test(hist.os_name || hist.device_name);
                      const isTablet = /iPad|Tablet/i.test(hist.os_name || hist.device_name);
                      
                      return (
                        <div key={hist.id || i} className={`p-4 rounded-xl bg-white/5 border ${i === 0 ? "border-primary/20 relative overflow-hidden" : "border-white/5"}`}>
                          {i === 0 && <div className="absolute top-0 right-0 p-1 bg-green-500/20 text-green-500 text-[9px] font-bold px-2 rounded-bl-lg">{t("lastSignedIn")}</div>}
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400"}`}>
                                {isTablet ? <Tablet size={18} /> : isMobile ? <Smartphone size={18} /> : <Monitor size={18} />}
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                   <p className="text-white font-bold text-sm text-shadow-sm">{hist.device_name || "Legacy Session"}</p>
                                   <p className="text-[10px] text-slate-500 font-medium">{new Date(hist.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                 </div>
                                 <p className="text-xs text-slate-400 mt-0.5">
                                   <span className="text-primary/80">{hist.os_name || "Unknown OS"}</span>
                                   <span className="mx-1.5 opacity-30">•</span>
                                   <span>{hist.browser_name || "Unknown Browser"}</span>
                                   {hist.ip_address && hist.ip_address !== "Unknown IP" && (
                                     <>
                                       <span className="mx-1.5 opacity-30">•</span>
                                       <span className="opacity-70">{hist.ip_address}</span>
                                     </>
                                   )}
                                 </p>
                              </div>
                          </div>
                        </div>
                      );
                    })
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
                  type="button"
                  onClick={() => {
                    setIsEmailFlow(false);
                    setEmailOtpStep("request_old");
                    setNewEmail("");
                    setEmailOtp("");
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-black text-white">{t("updateEmail")}</h2>
              </div>

              {emailOtpStep === "request_old" && (
                <form onSubmit={(e) => { e.preventDefault(); handleSendOldEmailOtp(); }} className="text-center space-y-6 py-4">
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
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </form>
              )}

              {emailOtpStep === "verify_old" && (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyOldEmailOtp(); }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("enterVerificationCode")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxCode")}
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder={t("otpPlaceholder")}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={emailLoading || emailOtp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendOldEmailOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </form>
              )}

              {emailOtpStep === "new_email" && (
                <form onSubmit={(e) => { e.preventDefault(); handleSendEmailOtp(); }} className="space-y-6">
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
                  <button
                    type="submit"
                    disabled={emailLoading || !newEmail.includes("@")}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </form>
              )}

              {emailOtpStep === "verify_new" && (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyEmailOtp(); }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("verifyNewEmail")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxNewEmail")} <span className="text-primary">{newEmail}</span>.
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder={t("otpPlaceholder")}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={emailLoading || emailOtp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyAndUpdateEmail")}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
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
                <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="text-center space-y-6 py-4">
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
                    type="submit"
                    disabled={otpLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                  </button>
                </form>
              )}

              {otpStep === "verify" && (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white font-bold">{t("enterVerificationCode")}</p>
                    <p className="text-sm text-slate-400">
                      {t("checkInboxCode")}
                    </p>
                  </div>
                  <SettingsInput
                    label={t("verifyCodeLabel")}
                    placeholder={t("otpPlaceholder")}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full text-xs font-bold text-slate-500 hover:text-white"
                  >
                    {t("didntGetCode")}
                  </button>
                </form>
              )}

              {otpStep === "new_password" && (
                <form onSubmit={(e) => { e.preventDefault(); handleOtpPasswordUpdate(); }} className="space-y-6">
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
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("resetPassword")}
                  </button>
                </form>
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
    </>
  );
};
