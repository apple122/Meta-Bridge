import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Clock,
  History as HistoryIcon,
  Trophy,
  TrendingDown,
  Zap
} from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { calculateProfit } from "../../utils/trade";
import { TIMEFRAMES } from "../../constants/trade";
import type { Transaction } from "../../types";
import type { BinaryTrade } from "../../contexts/WalletContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface TradingPanelProps {
  balance: number;
  amount: string;
  setAmount: (val: string) => void;
  orderType: "up" | "down";
  setOrderType: (val: "up" | "down") => void;
  onTrade: () => void;
  tradeLoading: boolean;
  selectedAsset: { symbol: string };
  transactions: Transaction[];
  timeframe: { label: string; minutes: number; payout: number };
  setTimeframe: (val: {
    label: string;
    minutes: number;
    payout: number;
  }) => void;
  activeBinaryTrades: BinaryTrade[];
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  balance,
  amount,
  setAmount,
  orderType,
  setOrderType,
  onTrade,
  tradeLoading,
  selectedAsset,
  transactions,
  timeframe,
  setTimeframe,
  activeBinaryTrades,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [showAmountModal, setShowAmountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState(amount);
  const [timeLeftAmount, setTimeLeftAmount] = useState(120);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer logic for Amount Modal
  useEffect(() => {
    let timer: any;
    if (showAmountModal && timeLeftAmount > 0) {
      timer = setInterval(() => setTimeLeftAmount((prev) => prev - 1), 1000);
    } else if (timeLeftAmount === 0 && showAmountModal) {
      setShowAmountModal(false);
    }
    return () => clearInterval(timer);
  }, [showAmountModal, timeLeftAmount]);

  // Close Setup Option modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAmountModal) {
        setShowAmountModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAmountModal]);

  const handleConfirmAmount = (amt: string) => {
    setAmount(amt);
    setShowAmountModal(false);
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card bg-card border-border shadow-xl"
      >
        <div className="flex gap-2 p-1 bg-card-header/50 rounded-xl mb-6 shadow-inner">
          <button
            onClick={() => setOrderType("up")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              orderType === "up"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t("upCall")}
          </button>
          <button
            onClick={() => setOrderType("down")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              orderType === "down"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t("downPut")}
          </button>
        </div>

        <div className="space-y-4">
          {/* Consolidated Amount & Time Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase ml-1">
              {t("investmentAndTime")}
            </label>
            <div
              className="relative group cursor-pointer"
              onClick={() => {
                setTempAmount(amount);
                setTimeLeftAmount(120);
                setShowAmountModal(true);
              }}
            >
              <div className="w-full bg-input-bg border border-input-border hover:border-primary/30 rounded-xl p-4 transition-all flex items-center justify-between shadow-inner">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text-main">
                    {amount || "0.00"}{" "}
                    <span className="text-sm text-text-muted font-bold ml-1">
                      USD
                    </span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 shadow-sm">
                    <span className="text-sm font-black text-primary">
                      {timeframe.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 mt-1">
                    +{timeframe.payout}% Profit
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-text-muted px-1">
            <div className="flex flex-col gap-0.5">
              <span>
                {t("availableBalance")}: {formatCurrency(balance)}
              </span>
              <span className="text-primary/70 italic">
                {t("minimum")}: $1.00
              </span>
            </div>
            <span
              onClick={() => setAmount(balance.toString())}
              className="text-primary cursor-pointer hover:underline self-end"
            >
              MAX
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card-header/30 border border-border shadow-inner space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">
                Profit if Won (+{timeframe.payout}%)
              </span>
              <span className="text-green-500 font-mono font-bold">
                +
                {formatCurrency(
                  calculateProfit(Number(amount), timeframe.payout),
                )}
              </span>
            </div>
          </div>

          <button
            onClick={onTrade}
            disabled={tradeLoading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 ${
              orderType === "up"
                ? "bg-green-500 shadow-green-500/20"
                : "bg-red-500 shadow-red-500/20"
            }`}
          >
            {orderType === "up" ? (
              <ArrowUpRight size={20} />
            ) : (
              <ArrowDownLeft size={20} />
            )}
            {orderType === "up" ? t("predictUp") : t("predictDown")}
          </button>
        </div>
      </motion.div>

      {/* Active Binary Trades */}
      {activeBinaryTrades.length > 0 && (
        <div className="glass-card p-6 bg-card border-border shadow-xl">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary" />
            {t("activeBinaryTrades")}
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {activeBinaryTrades.map((trade) => {
              const now = Date.now();
              const remainingSecs = Math.max(
                0,
                Math.floor((trade.expiryTime - now) / 1000),
              );
              
              const isSettling = remainingSecs === 0;
              const m = Math.floor(remainingSecs / 60);
              const s = remainingSecs % 60;
              const timeString = isSettling ? t("settling") || "Settling..." : `${m}:${s.toString().padStart(2, "0")}`;

              return (
                <div
                  key={trade.id}
                  className="p-3 bg-card-header/50 rounded-xl border border-border flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${trade.type === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {trade.type === "up" ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-main uppercase">
                        {trade.assetSymbol}
                      </p>
                      <p className="text-[10px] text-text-muted font-medium">
                        Entry: {formatCurrency(trade.entryPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-black text-text-main tabular-nums tracking-wider">
                      {timeString}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold">
                      {formatCurrency(trade.amount)}{" "}
                      <span className="text-green-500">
                        +{trade.payoutPercent}%
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card p-6 bg-card border-border shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <HistoryIcon size={16} className="text-primary" />
            {t("recentTransactions")}
          </h3>
          <button
            onClick={() => navigate("/history")}
            className="text-xs text-text-muted hover:text-primary transition-colors"
          >
            {t("viewAll")}
          </button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {transactions
            .filter((t_tx) => t_tx.asset === selectedAsset.symbol)
            .map((tx) => {
              const resLower = tx.binary_result?.toLowerCase();
              const isWin = resLower === "win" || resLower === "won";
              const isPositive =
                tx.type === "sell" ||
                tx.type === "deposit" ||
                tx.type === "win" ||
                isWin;
              const isBinaryBet = tx.binary_type && !tx.binary_result;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:translate-x-1 transition-transform cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center relative flex-shrink-0 shadow-sm border-2 transition-colors ${
                          isPositive 
                            ? "bg-green-500/10 text-green-600 border-green-500/20" 
                            : isBinaryBet 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {isWin ? (
                          <Trophy size={16} className="stroke-[2.5]" />
                        ) : isBinaryBet ? (
                          <Zap size={16} className="stroke-[2.5]" />
                        ) : tx.type === "sell" || tx.type === "deposit" ? (
                          <ArrowUpRight size={16} strokeWidth={2.5} />
                        ) : tx.binary_result?.toLowerCase().includes("loss") ? (
                          <TrendingDown size={16} strokeWidth={2.5} />
                        ) : (
                          <ArrowDownLeft size={16} strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-card-header border border-border text-[8px] font-black text-text-muted tabular-nums uppercase shadow-sm">
                        #{tx.smart_id || tx.id.slice(-4)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-black text-text-main uppercase truncate max-w-[80px] sm:max-w-none">
                          {isBinaryBet ? t('predictionAmount') : tx.asset}
                        </p>
                        {tx.binary_type && (
                          <span className={`text-[8px] font-black px-1 rounded flex-shrink-0 ${tx.binary_type === 'up' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                            {tx.binary_type === 'up' ? "▲" : "▼"} {tx.binary_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[8px] text-text-muted font-bold uppercase tracking-tight">
                          {new Date(tx.timestamp).getHours().toString().padStart(2, '0')}:
                          {new Date(tx.timestamp).getMinutes().toString().padStart(2, '0')}
                        </p>
                        {tx.binary_result && (
                          <span className={`text-[8px] font-black px-1 rounded-full uppercase flex-shrink-0 ${isWin ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                            {tx.binary_result}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-[11px] sm:text-xs font-bold ${
                        isPositive ? "text-green-600" : isBinaryBet ? "text-primary" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatCurrency(tx.total)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {isBinaryBet ? t('active') : t(tx.status)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Custom Amount Selection Modal */}
      <AnimatePresence>
        {showAmountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            onClick={() => setShowAmountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col mb-16 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50 shadow-sm">
                <h2 className="text-lg font-black text-text-main flex items-center gap-2">
                  <Clock size={20} className="text-primary" />{" "}
                  {t("setupOption")}
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tabular-nums transition-colors ${timeLeftAmount <= 5 ? "bg-red-500/20 text-red-600 animate-pulse" : "bg-primary/20 text-primary"}`}
                  >
                    <Clock size={12} />
                    {Math.floor(timeLeftAmount / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timeLeftAmount % 60).toString().padStart(2, "0")}
                  </div>
                  <button
                    onClick={() => setShowAmountModal(false)}
                    className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Balance View */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card-header/30 border border-border shadow-inner">
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">
                      {t("availableBalance")}
                    </p>
                    <p className="text-xl font-bold text-text-main tabular-nums">
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <button
                    onClick={() => setTempAmount(balance.toString())}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-black uppercase transition-all shadow-sm"
                  >
                    Max
                  </button>
                </div>

                {/* Amount Output */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-text-muted">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-input-bg border border-input-border hover:border-primary/50 focus:border-primary rounded-2xl py-5 pl-10 pr-16 text-3xl font-black text-text-main focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all tabular-nums shadow-inner"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">
                    USD
                  </span>
                </div>

                {/* 3x2 Timeframe Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.minutes}
                      onClick={() =>
                        setTimeframe({
                          label: tf.label,
                          minutes: tf.minutes,
                          payout: tf.payout,
                        })
                      }
                      className={`py-3 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 shadow-sm ${
                        timeframe.minutes === tf.minutes
                          ? "bg-primary/20 border-primary shadow-md shadow-primary/10"
                          : "bg-card-header/50 border-border hover:border-primary/30 hover:bg-card-header"
                      }`}
                    >
                      <span
                        className={`font-bold text-lg ${timeframe.minutes === tf.minutes ? "text-primary" : "text-text-main"}`}
                      >
                        {tf.label}
                      </span>
                      <span className="text-[10px] font-bold text-green-500">
                        +{tf.payout}% {t("profitIfWon")}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Submit Area */}
                <button
                  onClick={() => handleConfirmAmount(tempAmount)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-black text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center"
                >
                  {t("confirmTradeSetup")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
