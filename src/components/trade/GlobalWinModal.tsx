import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useLanguage } from "../../contexts/LanguageContext";
import { playSuccessSound } from "../../utils/audio";
import { sendWinnerNotification } from "../../utils/notifications";

const Particles = () => {
  return (
    <>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: Math.random() * 1.5 + 0.5,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400 - 50,
          }}
          transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full z-0 pointer-events-none"
          style={{
            backgroundColor: [
              "#4ade80",
              "#facc15",
              "#60a5fa",
              "#f472b6",
              "#c084fc",
            ][Math.floor(Math.random() * 5)],
            marginLeft: "-0.375rem",
            marginTop: "-0.375rem",
          }}
        />
      ))}
    </>
  );
};

export const GlobalWinModal: React.FC = () => {
  const { t } = useLanguage();
  const [winModalData, setWinModalData] = useState<{
    assetSymbol: string;
    amount: number;
    payout: number;
  } | null>(null);

  useEffect(() => {
    const handler = async (e: any) => {
      if (e.detail?.won) {
        setWinModalData({
          assetSymbol: e.detail.assetSymbol,
          amount: e.detail.amount,
          payout: e.detail.payout,
        });
        playSuccessSound();
        
        // Trigger system notification
        await sendWinnerNotification(
          e.detail.assetSymbol, 
          e.detail.payout,
          t("wonNotificationTitle"),
          t("predictionCorrect"),
          t("wasCorrect")
        );
      }
    };
    window.addEventListener("binary-trade-result", handler);
    return () => window.removeEventListener("binary-trade-result", handler);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && winModalData) {
        setWinModalData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [winModalData]);

  return (
    <AnimatePresence>
      {winModalData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
          onClick={() => setWinModalData(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-[2rem] overflow-hidden bg-gradient-to-b from-green-500/20 to-slate-900 border border-green-500/30 p-4 sm:p-8 text-center shadow-2xl shadow-green-500/20 mb-16 md:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Particles />

            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 relative">
              <Trophy size={40} className="text-green-400 drop-shadow-lg" />
              <Sparkles
                size={24}
                className="text-yellow-400 absolute -top-2 -right-2 animate-pulse"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              {t("congratulations")}
            </h2>
            <p className="text-sm font-bold text-slate-400 mb-6">
              {t("predictionCorrect")}{" "}
              <span className="text-white uppercase font-black">
                {winModalData.assetSymbol}
              </span>{" "}
              {t("wasCorrect")}
            </p>

            <div className="bg-slate-900/50 rounded-2xl p-3 sm:p-6 border border-white/5 mb-8 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">
                {t("totalPayout")}
              </p>
              <p
                className={`font-black text-green-400 tabular-nums drop-shadow-md break-all leading-tight transition-all duration-300 ${
                  (() => {
                    const len = `+${formatCurrency(winModalData.payout)}`.length;
                    if (len > 15) return "text-lg sm:text-2xl md:text-5xl";
                    if (len > 12) return "text-xl sm:text-3xl md:text-5xl";
                    if (len > 10) return "text-2xl sm:text-4xl md:text-5xl";
                    return "text-3xl sm:text-4xl md:text-5xl";
                  })()
                }`}
              >
                +{formatCurrency(winModalData.payout)}
              </p>
            </div>

            <button
              onClick={() => setWinModalData(null)}
              className="w-full py-4 rounded-full bg-green-500 text-slate-900 font-black text-lg hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/30"
            >
              {t("collectProfit")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
