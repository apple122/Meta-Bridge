import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { motion } from "framer-motion";
import { 
  Settings2, 
  Phone, 
  MessageCircle, 
  Send, 
  MessageSquare, 
  Globe, 
  Mail, 
  Hash, 
  Shield, 
  ShieldAlert, 
  Loader2, 
  Save 
} from "lucide-react";
import { AdminInput } from "../AdminInput";
import { emailService } from "../../../services/emailService";
import type { GlobalSettings } from "../../../types";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";

interface SettingsTabProps {
  fadeProps: any;
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  logAdminAction: (actionType: string, description: string, extra: object) => Promise<void>;
  onSaveSuccess?: (newSettings: GlobalSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  fadeProps, 
  globalSettings, 
  setGlobalSettings,
  logAdminAction,
  onSaveSuccess
}) => {
  const { t, language } = useLanguage();
  const { profile: currentAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Track original settings to detect changes
  const [initialSettings, setInitialSettings] = useState<GlobalSettings>(globalSettings);
  const isDirty = JSON.stringify(initialSettings) !== JSON.stringify(globalSettings);

  // Alert before refresh/leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("global_settings")
      .update(globalSettings)
      .eq("id", "main");

    if (!error) {
      alert(t("settingsUpdated"));
      await logAdminAction(
        "UPDATE_SETTINGS",
        "Updated global system settings (contacts)",
        { settings: globalSettings }
      );
      setInitialSettings(globalSettings);
      if (onSaveSuccess) onSaveSuccess(globalSettings);
    }
    setIsSaving(false);
  };

  const handleTestEmail = async () => {
    const adminEmail = currentAdmin?.email || "";
    if (!adminEmail) {
      setTestResult({ success: false, msg: "Current admin email not found." });
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
        setTestResult({ 
          success: true, 
          msg: `Test email sent successfully to ${adminEmail}` 
        });
      } else {
        setTestResult({ success: false, msg: result.error || "Failed to send test email." });
      }
    } catch (err: any) {
      setIsTestingEmail(false);
      setTestResult({ success: false, msg: err.message || "Error occurred during testing." });
    }
  };

  return (
    <motion.div {...fadeProps} className="space-y-6">
      <div className="glass-card bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <Settings2 size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-text-main uppercase tracking-tight truncate">
                {t("systemSettings")}
              </h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1 line-clamp-1">
                {t("manageContactPolicy")}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleUpdateSettings}
            disabled={isSaving || !isDirty}
            className={`shrink-0 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
              isSaving || !isDirty
                ? "bg-card-header text-text-muted cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.3)] active:scale-95"
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? t("loading") : t("save")}
          </button>
        </div>

        {/* Contact Links */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput icon={<Phone size={18} />} label={t("phoneNumber")} value={globalSettings.contact_phone} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_phone: val }))} enabled={globalSettings.phone_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, phone_enabled: !prev.phone_enabled }))} isPhone={true} />
            <AdminInput icon={<MessageCircle size={18} />} label="LINE ID" value={globalSettings.contact_line} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_line: val }))} enabled={globalSettings.line_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, line_enabled: !prev.line_enabled }))} />
            <AdminInput icon={<Send size={18} />} label="Telegram" value={globalSettings.contact_telegram} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_telegram: val }))} enabled={globalSettings.telegram_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, telegram_enabled: !prev.telegram_enabled }))} />
            <AdminInput icon={<MessageSquare size={18} />} label="WhatsApp" value={globalSettings.contact_whatsapp} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_whatsapp: val }))} enabled={globalSettings.whatsapp_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, whatsapp_enabled: !prev.whatsapp_enabled }))} isPhone={true} />
            <AdminInput icon={<Globe size={18} />} label="Facebook" value={globalSettings.contact_facebook} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_facebook: val }))} enabled={globalSettings.facebook_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, facebook_enabled: !prev.facebook_enabled }))} />
            <AdminInput icon={<Mail size={18} />} label={t("supportEmail")} value={globalSettings.contact_email} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_email: val }))} enabled={globalSettings.email_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, email_enabled: !prev.email_enabled }))} />
            <AdminInput icon={<Hash size={18} />} label="Discord" value={globalSettings.contact_discord} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_discord: val }))} enabled={globalSettings.discord_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, discord_enabled: !prev.discord_enabled }))} />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t("securitySettings")}</h4>
            <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.registration_otp_enabled ? "bg-primary/20 text-primary" : "bg-card-header text-text-muted"}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-text-main block">{t("registrationOtp")}</span>
                  <p className="text-[10px] text-text-muted font-bold">{t("otpDescription")}</p>
                </div>
              </div>
              <button onClick={() => setGlobalSettings(prev => ({ ...prev, registration_otp_enabled: !prev.registration_otp_enabled }))} className={`w-12 h-6 rounded-full transition-all relative ${globalSettings.registration_otp_enabled ? "bg-primary" : "bg-card-header shadow-inner border border-border"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.registration_otp_enabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Email Service Test</h4>
            <div className="p-6 rounded-2xl bg-input-bg border border-border space-y-4 shadow-inner">
              <div className="flex items-center gap-3 text-text-muted">
                <Mail size={18} />
                <span className="text-xs font-bold">Admin Email: <span className="text-text-main">{currentAdmin?.email}</span></span>
              </div>
              <p className="text-[10px] text-text-muted font-bold leading-relaxed">
                Click the button below to send a test verification email to your own admin account. This verifies that the Resend API and email templates are working correctly.
              </p>
              <button onClick={handleTestEmail} disabled={isTestingEmail || !currentAdmin?.email} className="w-full py-3 rounded-xl bg-card-header border border-border text-text-main text-[10px] font-black uppercase tracking-widest hover:bg-card-header/80 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                {isTestingEmail ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />} 
                {t("sendTestEmail")}
              </button>

              {testResult && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-[11px] font-bold ${testResult.success ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {testResult.msg}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
