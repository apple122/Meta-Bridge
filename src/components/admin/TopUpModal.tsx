import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, X, Loader2, Plus, ClipboardPaste, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import { AdminInput } from "./AdminInput";
import type { Profile } from "../../types";
import { emailService } from "../../services/emailService";

interface TopUpModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ onClose, onSuccess }) => {
  const { language } = useLanguage();
  const [userCode, setUserCode] = useState("");
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [matchedUser, setMatchedUser] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codePasted, setCodePasted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUserCode(text.trim().toUpperCase());
      setCodePasted(true);
      setTimeout(() => setCodePasted(false), 2000);
    } catch {
      // fallback — user can paste manually
    }
  };

  const handleSearchUser = async () => {
    if (!userCode.trim()) return;
    setError("");
    const { data, error: searchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("code", userCode.toUpperCase().trim())
      .single();

    if (searchError || !data) {
      setMatchedUser(null);
      setError("User not found for this code.");
    } else {
      setMatchedUser(data as Profile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedUser || topUpAmount <= 0) return;
    setIsSubmitting(true);
    setError("");

    try {
      // Direct sum in code: user.balance + amount
      const newBalance = matchedUser.balance + topUpAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchedUser.id);

      if (updateError) throw updateError;

      // Log transaction record
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: matchedUser.id,
        type: "deposit",
        asset_symbol: "USD",
        amount: topUpAmount,
        price: 1,
        total: topUpAmount,
        status: "success",
      });

      if (txError) {
        console.error("Failed to insert deposit transaction:", txError);
      }

      alert(
        `เติมเงินสำเร็จจำนวน $${topUpAmount.toLocaleString()} ให้บัญชีคุณ ${matchedUser.first_name} เรียบร้อยแล้ว`,
      );

      // Send email notification (fire & forget)
      emailService.sendDepositNotification({
        email: matchedUser.email,
        userName: `${matchedUser.first_name} ${matchedUser.last_name}`,
        amount: topUpAmount,
        lang: language,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "การเติมเงินล้มเหลว");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg relative z-10 p-0 overflow-hidden max-h-[90vh] md:max-h-[95vh] flex flex-col mb-16 md:mb-0 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="text-accent" size={24} />
            เติมเงินให้ผู้ใช้งาน
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto scrollbar-hide space-y-6">
          <div className="space-y-2">
            {/* Input + Paste on same row */}
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
              ค้นหาด้วยรหัสส่วนตัว
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="USERCODE123"
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3.5 px-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-600 uppercase"
              />
              <button
                type="button"
                onClick={handlePasteCode}
                className={`shrink-0 flex items-center gap-1.5 px-4 rounded-xl font-bold text-xs transition-all border ${
                  codePasted
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-primary/20 hover:text-primary border-white/10 hover:border-primary/30'
                }`}
              >
                {codePasted ? <CheckCircle2 size={15} /> : <ClipboardPaste size={15} />}
                {codePasted ? 'วางแล้ว!' : 'วาง'}
              </button>
            </div>
            {/* Search button below */}
            <button
              onClick={handleSearchUser}
              className="w-full py-3.5 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/5 text-sm"
            >
              ค้นหา
            </button>
          </div>

          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs md:text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          ) : matchedUser ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 shadow-inner"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    ยืนยันตัวตนบัญชี
                  </p>
                  <p className="text-lg md:text-xl font-bold text-white leading-tight">
                    {matchedUser.first_name} {matchedUser.last_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    @{matchedUser.username}
                  </p>
                </div>
                <div className="sm:text-right border-l sm:border-l-0 sm:border-t-0 border-white/10 pl-4 sm:pl-0 pt-1 sm:pt-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    ยอดเงินคงเหลือ
                  </p>
                  <p className="text-xl md:text-2xl font-black text-primary tabular-nums">
                    $
                    {matchedUser.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 pt-6 border-t border-white/5"
              >
                <AdminInput
                  label="จำนวนเงินที่ต้องการเติม ($)"
                  type="number"
                  step="0.01"
                  value={topUpAmount.toString()}
                  onChange={(v) => setTopUpAmount(parseFloat(v) || 0)}
                  placeholder="0.00"
                />

                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 text-accent text-xs md:text-sm font-black uppercase tracking-widest text-center shadow-inner">
                  ยอดเงินใหม่จะกลายเป็น: 
                  <span className="text-white ml-2 text-base tabular-nums">
                    $
                    {(matchedUser.balance + topUpAmount).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMatchedUser(null)}
                    className="flex-1 px-6 py-4 rounded-xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all text-sm border border-white/5"
                  >
                    ล้างข้อมูล
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || topUpAmount <= 0}
                    className="flex-[2] py-4 bg-accent hover:bg-accent/90 text-white border border-accent/30 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base font-black shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Plus size={20} />
                    )}
                    <span className="whitespace-nowrap uppercase tracking-tight">ยืนยันการเติมเงิน</span>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl">
               <TrendingUp size={48} className="opacity-10 mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">รอการค้นหาผู้ใช้งาน...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
