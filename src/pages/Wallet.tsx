import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useWallet } from "../contexts/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet as WalletIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Zap,
  X,
} from "lucide-react";
import { DepositModal } from "../components/wallet/DepositModal";
import { WithdrawModal } from "../components/wallet/WithdrawModal";
import { assets } from "../data/marketData";

import { formatCurrency, formatUnits } from "../utils/format";
import { formatDate, formatTime } from "../utils/date";
import { getAssetCategory } from "../utils/trade";
import type { ModalType } from "../types";

// ── Main Page ──────────────────────────────────────────────────────────────────
export const Wallet: React.FC = () => {
  const { t } = useLanguage();
  const { balance, transactions } = useWallet();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  const actions = [
    {
      key: "deposit" as ModalType,
      label: t("deposit"),
      icon: <ArrowDownCircle size={24} className="text-green-500" />,
      color: "from-green-500/20 to-emerald-600/20",
    },
    {
      key: "staking" as ModalType,
      label: t("staking"),
      icon: <Zap size={24} className="text-yellow-500" />,
      color: "from-yellow-500/20 to-orange-600/20",
    },
    {
      key: "withdraw" as ModalType,
      label: t("withdraw"),
      icon: <ArrowUpCircle size={24} className="text-red-500" />,
      color: "from-red-500/20 to-rose-600/20",
    },
  ];

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent blur-3xl opacity-20 pointer-events-none" />
        <div className="glass-card bg-gradient-to-br from-slate-900 to-slate-800 p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-primary/20">
          <div className="space-y-6 relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400">
              <WalletIcon size={20} />
              <span className="text-sm font-bold tracking-widest uppercase">
                {t("totalBalance")}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight break-words">
              {formatCurrency(balance)}
            </h2>
          </div>

          <div className="mt-8 md:mt-0 grid grid-cols-2 gap-4 relative z-10">
            {actions.map((action, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveModal(action.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-3 p-6 ${i === 2 ? "col-span-2" : ""} rounded-2xl bg-gradient-to-tr ${action.color} border border-white/5 shadow-2xl transition-all cursor-pointer hover:border-white/20`}
              >
                {action.icon}
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1">
        {/* Unified Activity Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-0 overflow-hidden border-white/5 flex flex-col"
        >
          {/* Ledger Header */}
          <div className="p-6 border-b border-white/5 space-y-6 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Clock size={22} className="text-primary" />
                  {t("activityLedger")}
                </h3>
                <p className="text-slate-500 text-xs mt-1 font-medium">
                  {t("trackActivityDesc")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                >
                  <option value="all">{t("allAssets")}</option>
                  <option value="crypto">{t("crypto")}</option>
                  <option value="commodity">{t("commodity")}</option>
                  <option value="stock">{t("stock")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ledger Content with Overflow Control (Vertical Only) */}
          <div className="w-full group/ledger">
            <div className="w-full max-h-[600px] overflow-y-auto custom-scrollbar p-2">
              <AnimatePresence mode="popLayout">
                {(() => {
                  const filteredTransactionsList = transactions.filter((tx) => {
                    if (categoryFilter === "all") return true;
                    if (!tx.asset) return categoryFilter === "wallets";
                    return getAssetCategory(tx.asset) === categoryFilter;
                  });

                  if (filteredTransactionsList.length === 0) {
                    return (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                          <Clock size={24} className="text-slate-700" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{t("noRecordsFound")}</p>
                          <p className="text-slate-500 text-xs">{t("noActivityInCat") || "There is no activity in this category yet."}</p>
                        </div>
                      </div>
                    );
                  }

                  return filteredTransactionsList.map((tx, idx) => {
                    const isExpanded = expandedId === tx.id;
                    const expandedTx = expandedId ? transactions.find(t => t.id === expandedId) : null;
                    const highlightedSmartId = expandedTx?.smart_id;
                    const isRelated = highlightedSmartId && tx.smart_id === highlightedSmartId && tx.id !== expandedId;
                    const assetInfo = tx.asset ? assets.find((a) => a.symbol === tx.asset) : null;
                    const isBinaryBet = !!tx.binary_type && !tx.binary_result;

                    const txDate = new Date(tx.timestamp).toLocaleDateString();
                    const prevTxDate = idx > 0 ? new Date(filteredTransactionsList[idx - 1].timestamp).toLocaleDateString() : null;
                    const showDateHeader = txDate !== prevTxDate;

                    return (
                      <React.Fragment key={tx.id}>
                        {showDateHeader && (
                          <div className="flex items-center gap-4 py-4 px-2 first:pt-0">
                            <div className="h-px flex-grow bg-white/5" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap bg-white/5 py-1 px-3 rounded-full border border-white/5">
                              {txDate === new Date().toLocaleDateString() ? t("today") : formatDate(new Date(tx.timestamp), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="h-px flex-grow bg-white/5" />
                          </div>
                        )}
                        {/* ... rest of the motion.div ... */}
                        
                        <motion.div
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                          className={`group flex flex-col p-2.5 sm:p-4 rounded-2xl transition-all cursor-pointer border border-transparent relative overflow-hidden ${
                            isExpanded 
                              ? "bg-white/[0.04] border-white/10 shadow-2xl" 
                              : isRelated
                                ? "bg-indigo-500/[0.05] border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                                : "hover:bg-white/[0.03] hover:border-white/5"
                          } mb-1`}
                        >
                          {/* Related Match Indicator */}
                          {isRelated && (
                            <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/10 text-[7px] font-black text-indigo-400 uppercase">
                              {t("matched")}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                              {/* Visual Icon (Squircle Arrow or Logo) */}
                              <div
                                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center relative flex-shrink-0 shadow-lg ${
                                  tx.type === "deposit" || tx.type === "sell" || tx.type === "win"
                                    ? "bg-green-500/10 text-green-500"
                                    : isBinaryBet
                                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                      : "bg-red-500/10 text-red-500"
                                  }`}
                              >
                                {tx.asset && assetInfo?.iconUrl ? (
                                  <div className="w-full h-full p-0.5">
                                    <img src={assetInfo.iconUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-slate-900 rounded-full ${
                                      tx.type === "sell" || tx.type === "deposit" || tx.type === "win" 
                                        ? "bg-green-500" 
                                        : isBinaryBet 
                                          ? "bg-indigo-400" 
                                          : "bg-red-500"
                                    }`} />
                                  </div>
                                ) : (
                                  <>
                                    {tx.type === "deposit" || tx.type === "sell" || tx.type === "win" ? (
                                      <ArrowUpRight size={22} strokeWidth={2.5} />
                                    ) : (
                                      <ArrowDownLeft size={22} strokeWidth={2.5} />
                                    )}
                                  </>
                                )}
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-slate-700 border border-slate-600 text-[7px] font-black text-slate-300 tabular-nums shadow-sm uppercase">
                                  #{tx.smart_id || tx.id.slice(-4)}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="text-white font-black flex items-center gap-1 sm:gap-2 group-hover:text-primary transition-colors text-[10px] sm:text-sm uppercase min-w-0">
                                  <span 
                                    title={isBinaryBet ? t('predictionAmount') : tx.type}
                                    className={`${isExpanded ? 'whitespace-normal' : 'truncate max-w-[80px] sm:max-w-none'}`}
                                  >
                                    {isBinaryBet ? t('predictionAmount') : t(tx.type)}
                                  </span>
                                  {tx.asset && (
                                    <span className="text-slate-400 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded-lg text-[7px] sm:text-[9px] uppercase tracking-widest font-bold flex-shrink-0">
                                      {tx.asset}
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold tabular-nums">
                                    {formatTime(tx.timestamp)}
                                  </span>
                                  {tx.binary_type && (
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider ${
                                      tx.binary_type === 'up' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                      {tx.binary_type === 'up' ? "▲ UP" : "▼ DOWN"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p
                                className={`text-xs sm:text-base font-black tabular-nums ${
                                  tx.type === "deposit" || tx.type === "sell" || tx.type === "win"
                                  ? "text-green-500" 
                                  : isBinaryBet
                                    ? "text-indigo-400"
                                    : "text-red-500"
                                  }`}
                              >
                                {tx.type === "deposit" || tx.type === "sell" || tx.type === "win" ? "+" : "-"} {formatCurrency(tx.total)}
                              </p>
                              <span
                                className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1 sm:px-1.5 py-0.5 rounded ${
                                  tx.status === "success" 
                                    ? isBinaryBet ? "bg-indigo-500/10 text-indigo-400" : "bg-green-500/10 text-green-500" 
                                    : "bg-yellow-500/10 text-yellow-500"
                                  }`}
                              >
                                {isBinaryBet ? t('active') : t(tx.status)}
                              </span>
                            </div>
                          </div>

                          {/* Expandable Details Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 pb-1">
                                  <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t("transactionId")}</p>
                                    <p className="text-[8px] text-white font-mono break-all group-active:select-all">#{tx.id}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t("dateTime") || "Date & Time"}</p>
                                    <p className="text-[10px] text-white font-bold">{new Date(tx.timestamp).toLocaleString()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t("type")}</p>
                                    <p className="text-[10px] text-white font-bold capitalize">{t(tx.type)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t("quantity")}</p>
                                    <p className="text-[10px] text-white font-bold">
                                      {tx.amount ? formatUnits(tx.amount) : formatCurrency(tx.total)} {tx.asset || "USD"}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </React.Fragment>
                    );
                  });
                })()}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 pb-24 md:pb-4 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-white/10 rounded-3xl w-full max-w-sm relative flex flex-col max-h-[85vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar my-auto shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-30 pointer-events-none" />
                  <div className="">
                    {activeModal === "deposit" && (
                      <DepositModal onClose={closeModal} />
                    )}
                    {activeModal === "withdraw" && (
                      <WithdrawModal balance={balance} onClose={closeModal} />
                    )}
                    {activeModal === "staking" && (
                      <div className="flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-slate-900/50">
                          <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" /> Staking
                          </h2>
                          <button
                            onClick={closeModal}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                          <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center space-y-4 mb-6">
                            <Zap size={48} className="text-yellow-400 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                            <div className="space-y-1">
                              <p className="text-white font-black text-xl uppercase tracking-tighter">
                                Coming Soon
                              </p>
                              <p className="text-yellow-400/80 text-[11px] font-bold uppercase tracking-wider">
                                Staking pools will launch soon
                              </p>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              Earn up to <span className="text-yellow-400 font-black text-lg">12%</span> APY on BTC, ETH, and more global assets.
                            </p>
                          </div>
                          <button
                            onClick={closeModal}
                            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-base transition-all active:scale-95"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
