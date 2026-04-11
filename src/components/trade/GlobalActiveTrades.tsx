import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";
import { useLanguage } from "../../contexts/LanguageContext";

export const GlobalActiveTrades: React.FC = () => {
  const { activeBinaryTrades } = useWallet();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [, setTick] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Make sure the timer always counts down smoothly
  useEffect(() => {
    if (activeBinaryTrades.length === 0) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [activeBinaryTrades.length]);

  // If there are no active trades, we don't need to show it at all
  if (activeBinaryTrades.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-20 right-4 z-50 flex flex-col items-end"
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 glass px-3 py-2 rounded-full border border-primary/20 shadow-lg shadow-primary/10 hover:bg-white/5 transition-all outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Clock size={16} className="text-primary animate-pulse" />
        <span className="text-xs font-bold text-white tracking-widest">
          {activeBinaryTrades.length} {t("active")}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={14} className="text-slate-400" />
        </motion.div>
      </motion.button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.95,
              transformOrigin: "top right",
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 400,
              opacity: { duration: 0.2 },
            }}
            className="mt-2 glass-card border border-white/10 shadow-2xl w-64 overflow-hidden flex flex-col mr-1 custom-scrollbar max-h-[60vh] overflow-y-auto"
          >
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">
                {t("activeBinaryTrades")}
              </h3>
              {activeBinaryTrades.map((trade) => {
                const now = Date.now();
                const remainingSecs = Math.max(
                  0,
                  Math.floor((trade.expiryTime - now) / 1000),
                );
                const m = Math.floor(remainingSecs / 60);
                const s = remainingSecs % 60;
                const timeString = `${m}:${s.toString().padStart(2, "0")}`;

                return (
                  <div
                    key={trade.id}
                    className="p-2 bg-slate-900/40 rounded-lg border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center shadow-sm ${trade.type === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                      >
                        {trade.type === "up" ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownLeft size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase leading-none mb-0.5">
                          {trade.assetSymbol}
                        </p>
                        <p className="text-[9px] text-slate-500 font-medium">
                          Entry: ${trade.entryPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs font-black text-white tabular-nums tracking-wider leading-none mb-0.5">
                        {timeString}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold">
                        ${trade.amount.toLocaleString()}{" "}
                        <span className="text-green-500">
                          +{trade.payoutPercent}%
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
