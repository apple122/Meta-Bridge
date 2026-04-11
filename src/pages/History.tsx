import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useWallet } from "../contexts/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Trophy,
  TrendingDown,
  Zap
} from "lucide-react";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  formatTime,
} from "../utils/date";
import { getTransactionTypeLabel } from "../utils/trade";
import { formatCurrency, formatUnits } from "../utils/format";

export const History: React.FC = () => {
  const { t } = useLanguage();
  const { transactions } = useWallet();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>("all");

  const tradeTransactions = transactions.filter(
    (tx) =>
      tx.type === "buy" ||
      tx.type === "sell" ||
      tx.type === "deposit" ||
      tx.type === "withdraw" ||
      tx.type === "win" ||
      tx.type === "loss",
  );

  const uniqueAssets = useMemo(() => {
    const assets = new Set<string>();
    tradeTransactions.forEach((tx) => {
      if (tx.asset) assets.add(tx.asset);
    });
    return Array.from(assets).sort();
  }, [tradeTransactions]);

  // Calendar setup
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Map dates that have transactions for indicators
  const transactionDates = useMemo(() => {
    const dates = new Set<string>();
    tradeTransactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      dates.add(
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(),
      );
    });
    return dates;
  }, [tradeTransactions]);

  // Filter transactions up to the selected day and asset (Cumulative)
  const filteredTransactions = useMemo(() => {
    return tradeTransactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      // Create a date object for the very end of the selected day (23:59:59.999)
      const endOfSelectedDay = new Date(selectedDate);
      endOfSelectedDay.setHours(23, 59, 59, 999);

      const isUpToDate = txDate.getTime() <= endOfSelectedDay.getTime();
      const matchesAsset =
        selectedAsset === "all" || tx.asset === selectedAsset;
      return isUpToDate && matchesAsset;
    });
  }, [tradeTransactions, selectedDate, selectedAsset]);

  // Month names for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-l-4 border-primary pl-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon size={24} className="text-primary" />
            {t("history") || "History"}
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Calendar View
          </p>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="glass-card bg-slate-900/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Calendar Nav */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
          >
            <ChevronLeft size={24} />
          </button>

          <h2 className="text-xl font-black text-white tracking-tight">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="relative z-10">
          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-4">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-slate-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              const today = new Date();
              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;

              const hasTransaction = transactionDates.has(
                dateObj.toDateString(),
              );

              return (
                <div key={day} className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`relative w-10 h-10 flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300
                      ${
                        isSelected
                          ? "bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/30"
                          : isToday
                            ? "bg-white/10 text-white border border-white/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <span className="relative z-10">{day}</span>

                    {/* Transaction Dot Indicator */}
                    {hasTransaction && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`}
                      />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day View Header with Asset Filter */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white">
          {t("transactionsUpTo") || "Transactions up to"}{" "}
          {formatDate(selectedDate, { weekday: "short" })}
        </h3>

        {/* Asset Filter Select */}
        <div className="relative group min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-primary transition-colors">
            <Filter size={14} strokeWidth={3} />
          </div>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-black text-white outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 appearance-none cursor-pointer transition-all"
          >
            <option value="all"> {t("allAssets") || "All Assets"} </option>
            {uniqueAssets.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredTransactions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-12 space-y-4 text-center glass-card bg-slate-900/30"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
              <ClipboardList size={32} />
            </div>
            <p className="text-slate-500 font-medium tracking-wide text-sm">
              No trading activity on this day.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredTransactions.map((tx, idx) => {
              const isExpanded = expandedId === tx.id;
              const expandedTx = expandedId
                ? filteredTransactions.find((t) => t.id === expandedId)
                : null;
              const highlightedSmartId = expandedTx?.smart_id;
              const isRelated =
                highlightedSmartId &&
                tx.smart_id === highlightedSmartId &&
                tx.id !== expandedId;
              const resLower = tx.binary_result?.toLowerCase();
              const isWin = resLower === "win" || resLower === "won" || tx.is_win;
              const isBinaryBet = !!tx.binary_type && !tx.binary_result;

              const txDate = new Date(tx.timestamp).toLocaleDateString();
              const prevTxDate =
                idx > 0
                  ? new Date(
                      filteredTransactions[idx - 1].timestamp,
                    ).toLocaleDateString()
                  : null;
              const showDateHeader = txDate !== prevTxDate;

              return (
                <React.Fragment key={tx.id}>
                  {showDateHeader && (
                    <div className="flex items-center gap-4 py-4 first:pt-0">
                      <div className="h-px flex-grow bg-white/5" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap bg-white/5 py-1 px-3 rounded-full border border-white/5">
                        {txDate === new Date().toLocaleDateString()
                          ? t("today")
                          : formatDate(new Date(tx.timestamp), {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                      </span>
                      <div className="h-px flex-grow bg-white/5" />
                    </div>
                  )}

                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    className={`glass-card bg-slate-900/60 hover:border-primary/30 transition-all flex flex-col group p-2.5 sm:p-4 rounded-2xl cursor-pointer relative overflow-hidden ${
                      isExpanded
                        ? "border-primary/40 ring-1 ring-primary/20 shadow-xl shadow-primary/5"
                        : isRelated
                          ? "border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-500/5"
                          : ""
                    }`}
                  >
                    {/* Related Match Indicator */}
                    {isRelated && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase"
                      >
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                        {t("matched") || "Matched"}
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                              tx.type === "sell" ||
                              tx.type === "deposit" ||
                              isWin ||
                              tx.type === "win"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : isBinaryBet
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}
                          >
                            {isWin ? (
                              <Trophy
                                size={20}
                                className="stroke-[2.5] sm:w-6 sm:h-6 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                              />
                            ) : isBinaryBet ? (
                                <Zap size={20} className="stroke-[2.5] sm:w-6 sm:h-6" />
                            ) : tx.type === "sell" || tx.type === "deposit" ? (
                                <ArrowUpRight size={20} className="stroke-[2.5] sm:w-6 sm:h-6" />
                            ) : tx.binary_result === "loss" ? (
                                <TrendingDown size={20} className="stroke-[2.5] sm:w-6 sm:h-6" />
                            ) : (
                              <ArrowDownLeft
                                size={20}
                                className="stroke-[2.5] sm:w-6 sm:h-6"
                              />
                            )}
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] sm:-top-2 sm:-right-2 sm:min-w-[22px] sm:h-[22px] flex items-center justify-center px-1 rounded-full bg-slate-700 border border-slate-600 text-[8px] sm:text-[9px] font-black text-slate-300 tabular-nums shadow-sm uppercase">
                            #{tx.smart_id || tx.id.slice(-4)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                            <h3
                              title={
                                isBinaryBet ? t("predictionAmount") : tx.asset
                              }
                              className={`font-bold text-white text-xs sm:text-sm uppercase ${isExpanded ? "whitespace-normal" : "truncate max-w-[100px] sm:max-w-none"}`}
                            >
                              {isBinaryBet ? t("predictionAmount") : tx.asset}
                            </h3>
                            {tx.binary_type && (
                              <span
                                className={`px-1 sm:px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black border ${
                                  tx.binary_type === "up"
                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                    : "bg-red-500/10 border-red-500/20 text-red-500"
                                }`}
                              >
                                {tx.binary_type === "up" ? "▲ UP" : "▼ DOWN"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold tabular-nums">
                              {formatTime(tx.timestamp)}
                            </span>
                            {tx.binary_result && (
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider ${
                                  isWin
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                    : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                }`}
                              >
                                {tx.binary_result}
                              </span>
                            )}
                            {!tx.binary_result && (
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase ${isBinaryBet ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"}`}
                              >
                                {isBinaryBet
                                  ? t("active")
                                  : getTransactionTypeLabel(tx.type)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-center flex-shrink-0">
                        <p
                          className={`text-sm sm:text-base font-black ${
                            tx.type === "sell" ||
                            tx.type === "deposit" ||
                            isWin ||
                            tx.type === "win"
                              ? "text-green-400"
                              : isBinaryBet
                                ? "text-indigo-400"
                                : "text-red-400"
                          }`}
                        >
                          {tx.type === "sell" ||
                          tx.type === "deposit" ||
                          isWin ||
                          tx.type === "win"
                            ? "+"
                            : "-"}
                          {formatCurrency(tx.total)}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 sm:mt-1 group-hover:text-slate-300 transition-colors">
                          {tx.amount && formatUnits(tx.amount)} {tx.asset}
                        </p>
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
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {t("transactionId")}
                              </p>
                              <p className="text-[8px] text-white font-mono break-all group-active:select-all">
                                #{tx.id}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {t("dateTime") || "Date & Time"}
                              </p>
                              <p className="text-[10px] text-white font-bold">
                                {new Date(tx.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {t("type")}
                              </p>
                              <p className="text-[10px] text-white font-bold capitalize">
                                {tx.type} {tx.asset ? "Market" : "Account"}
                              </p>
                            </div>
                            {tx.price && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                  {t("executionPrice")}
                                </p>
                                <p className="text-[10px] text-white font-mono">
                                  {formatCurrency(tx.price)}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
