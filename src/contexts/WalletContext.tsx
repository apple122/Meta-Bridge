import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { emailService } from "../services/emailService";
import { useLanguage } from "./LanguageContext";

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "deposit" | "withdraw" | "win" | "loss";
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: "success" | "pending" | "failed";
  binary_type?: "up" | "down";
  binary_result?: "win" | "loss";
  trade_id?: string;
  smart_id?: string;
  is_win?: boolean;
  is_loss?: boolean;
}
export interface BinaryTrade {
  id: string;
  type: "up" | "down";
  assetSymbol: string;
  amount: number;
  entryPrice: number;
  payoutPercent: number;
  startTime: number;
  expiryTime: number;
  status: "active" | "won" | "lost" | "pending";
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  portfolio: Record<string, number>;
  loading: boolean;
  activeBinaryTrades: BinaryTrade[];
  handleTrade: (
    type: "buy" | "sell",
    asset: any,
    amountUSD: number,
  ) => Promise<{ success: boolean; message: string }>;
  createBinaryTrade: (
    type: "up" | "down",
    asset: any,
    amountUSD: number,
    durationMinutes: number,
    payoutPercent: number,
  ) => Promise<{ success: boolean; message: string }>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
}

import { marketService } from "../services/marketService";

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeBinaryTrades, setActiveBinaryTrades] = useState<BinaryTrade[]>([]);
  const processingTradeIds = useRef<Set<string>>(new Set());
  const hasReconciled = useRef(false);

  // Sync internal balance with profile balance when it loads
  useEffect(() => {
    if (profile) {
      setBalance(Number(profile.balance));
    }
  }, [profile]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Load transactions (limit to 100 for better history)
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (txError) {
        console.error(
          "[WalletContext] Error loading transactions:",
          txError.message,
        );
      } else {
        // --- SMART LINKING ALGORITHM ---
        // We process transactions chronologically to pair results with their original stakes.
        
        // 1. Initial mapping and sort oldest to newest
        const processed = (txData ?? []).map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          asset: tx.asset_symbol,
          amount: Number(tx.amount),
          price: Number(tx.price),
          total: Number(tx.total),
          timestamp: tx.created_at,
          status: tx.status,
          binary_type: tx.binary_type,
          binary_result: tx.binary_result,
          trade_id: tx.binary_trade_id || tx.reference_id || tx.id,
          smart_id: (tx.binary_trade_id || tx.id).slice(-4).toUpperCase(), 
        }) as Transaction).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // 2. Direct Linking & Map of "open" trade Ticket IDs
        const openStacks: Record<string, string[]> = {};
        const tradeIdToSmartId: Record<string, string> = {};

        // 3. Sequential Pairing (Prioritize Direct ID > then FIFO fallback)
        processed.forEach((tx) => {
          if (!tx.binary_type) return;
          
          const key = `${tx.asset}-${tx.binary_type}`;
          const isStake = !tx.binary_result;
          
          if (isStake) {
            const tid = (tx.trade_id || tx.id).slice(-4).toUpperCase();
            tx.smart_id = tid;
            
            // Map the direct binary_trade_id to this smart_id for future results
            if (tx.trade_id) tradeIdToSmartId[tx.trade_id] = tid;
            
            // Still push to stack for FIFO fallback in case direct ID is missing
            if (!openStacks[key]) openStacks[key] = [];
            openStacks[key].push(tid);
          } else {
            // Result found:
            // a. Try Direct Link first
            if (tx.trade_id && tradeIdToSmartId[tx.trade_id]) {
              tx.smart_id = tradeIdToSmartId[tx.trade_id];
            } 
            // b. Fallback to FIFO stack
            else if (openStacks[key] && openStacks[key].length > 0) {
              const matchedId = openStacks[key].shift();
              if (matchedId) tx.smart_id = matchedId;
            }

            // --- MERGING LOGIC ---
            // Find the parent stake transaction (by smart_id) and update it
            const parentStake = processed.find(t => t.smart_id === tx.smart_id && !t.binary_result && (t.type === 'buy' || t.type === 'sell'));
            if (parentStake) {
              parentStake.binary_result = tx.binary_result;
              // If it's a win, the 'total' on the ledger should show the Payout
              const isWin = tx.binary_result?.toLowerCase() === 'win' || tx.binary_result?.toLowerCase() === 'won';
              if (isWin) {
                parentStake.total = tx.total;
                // Force a positive representation for the UI merging
                parentStake.is_win = true; 
              } else {
                parentStake.is_loss = true;
              }
            }
          }
        });

        // 4. Sort back to newest first for the UI (with ID tie-breaker)
        setTransactions(
          processed
            .filter(t => t.type !== 'win' && t.type !== 'loss')
            .sort((a, b) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              if (timeA !== timeB) return timeB - timeA;
              // Secondary sort by ID in descending order for transactions in the same millisecond or second
              return b.id.localeCompare(a.id);
            })
        );
      }

      // Load portfolio
      const { data: portData, error: portError } = await supabase
        .from("portfolio")
        .select("asset_symbol, units")
        .eq("user_id", user.id);

      if (portError) {
        console.error(
          "[WalletContext] Error loading portfolio:",
          portError.message,
          portError.details,
          portError.hint,
        );
      } else {
        // console.log('[WalletContext] Portfolio loaded:', portData?.length ?? 0, 'assets');
        const portMap: Record<string, number> = {};
        (portData ?? []).forEach((p: any) => {
          portMap[p.asset_symbol] = Number(p.units);
        });
        setPortfolio(portMap);
      }
    } catch (err) {
      console.error(
        "[WalletContext] Unexpected error loading wallet data:",
        err,
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * RECONCILIATION: Check for trades that settled while offline/refreshing
   */
  const reconcileSettledTrades = useCallback(async () => {
    if (!user || !profile || hasReconciled.current) return;
    
    // console.log("[WalletContext] Reconciling settled trades...");
    
    try {
      // 1. Get last 10 settled trades
      const { data, error } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['won', 'lost'])
        .order('settled_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        hasReconciled.current = true;
        return;
      }

      // 2. Get the list of IDs already notified from localStorage
      const notifiedIdsRaw = localStorage.getItem(`notified_trades_${user.id}`);
      const notifiedIds = notifiedIdsRaw ? JSON.parse(notifiedIdsRaw) : [];
      
      let newNotifications = 0;
      const now = new Date();

      // 3. Compare and notify for any "recent" settled trades
      for (const trade of data) {
        // --- HARDENING: Time-bound check ---
        // Only notify if trade was settled in the last 60 seconds.
        // This prevents old history from triggering popups on page refresh.
        const settledAt = new Date(trade.settled_at);
        const diffSeconds = (now.getTime() - settledAt.getTime()) / 1000;
        
        if (diffSeconds > 60) continue; 

        if (!notifiedIds.includes(trade.id)) {
          const won = trade.status === 'won';
          const payout = won 
            ? Number(trade.amount) + (Number(trade.amount) * Number(trade.payout_percent)) / 100 
            : 0;

          // console.log(`[WalletContext] Retro-notifying trade ${trade.id} (${trade.status})`);

          // Trigger winner modal event
          window.dispatchEvent(
            new CustomEvent("binary-trade-result", {
              detail: {
                won,
                assetSymbol: trade.asset_symbol,
                amount: Number(trade.amount),
                payout: won ? payout : 0, // Fix: Payout is 0 for loss
              },
            })
          );

          // Send win email notification (if won)
          if (won) {
            const durationMs = Number(trade.expiry_time) - new Date(trade.created_at).getTime();
            const durationMinutes = Math.round(durationMs / 60000);
            emailService.sendWinNotification({
              email: profile.email || user.email || '',
              userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
              amount: Number(trade.amount),
              payout,
              assetSymbol: trade.asset_symbol,
              orderId: trade.id.slice(-4).toUpperCase(),
              durationMinutes,
              payoutPercent: Number(trade.payout_percent),
              lang: language,
            });
          }
          
          notifiedIds.push(trade.id);
          newNotifications++;
        }
      }

      if (newNotifications > 0) {
        // Keep only top 20 to avoid localStorage bloat
        const updatedNotified = notifiedIds.slice(-20);
        localStorage.setItem(`notified_trades_${user.id}`, JSON.stringify(updatedNotified));
      }

      hasReconciled.current = true;
    } catch (err) {
      console.error("[WalletContext] Reconciliation failed:", err);
    }
  }, [user, profile, language]);

  const refreshWallet = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // --- Realtime Subscription for Trade Results ---
  useEffect(() => {
    if (!user) return;

    // Load initial active trades from DB
    const loadActiveTrades = async () => {
      const { data, error } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (!error && data) {
        setActiveBinaryTrades(data.map((t: any) => ({
          id: t.id,
          type: t.type,
          assetSymbol: t.asset_symbol,
          amount: Number(t.amount),
          entryPrice: Number(t.entry_price),
          payoutPercent: Number(t.payout_percent),
          startTime: new Date(t.created_at).getTime(),
          expiryTime: Number(t.expiry_time),
          status: t.status
        })));
      }
    };
    loadActiveTrades();

    // Subscribe to changes in binary_trades table
    const channel = supabase
      .channel(`binary-trades-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'binary_trades',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const updatedTrade = payload.new as any;
          
          // If a trade was settled (won/lost)
          if (updatedTrade.status === 'won' || updatedTrade.status === 'lost') {
            const won = updatedTrade.status === 'won';
            const payout = won 
              ? Number(updatedTrade.amount) + (Number(updatedTrade.amount) * Number(updatedTrade.payout_percent)) / 100 
              : 0;

            // Trigger winner modal event
            window.dispatchEvent(
              new CustomEvent("binary-trade-result", {
                detail: {
                  won,
                  assetSymbol: updatedTrade.asset_symbol,
                  amount: Number(updatedTrade.amount),
                  payout: won ? payout : 0, 
                },
              })
            );

            // Send win email notification (fire & forget)
            if (won && user && profile) {
              const durationMs = Number(updatedTrade.expiry_time) - new Date(updatedTrade.created_at).getTime();
              const durationMinutes = Math.round(durationMs / 60000);
              emailService.sendWinNotification({
                email: profile.email || user.email || '',
                userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
                amount: Number(updatedTrade.amount),
                payout,
                assetSymbol: updatedTrade.asset_symbol,
                orderId: updatedTrade.id.slice(-4).toUpperCase(),
                durationMinutes,
                payoutPercent: Number(updatedTrade.payout_percent),
                lang: language,
              });
            }

            // Update local balance and trades
            refreshProfile(); // Backend already updated the DB, so we just refresh
            setActiveBinaryTrades(prev => prev.filter(t => t.id !== updatedTrade.id));
            
            // Refresh transactions list
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshProfile, loadData]);

  // --- Load data from Supabase on mount ---
  useEffect(() => {
    const init = async () => {
      await loadData();
      // Small delay to ensure state is settled before reconciliation
      setTimeout(() => {
        reconcileSettledTrades();
      }, 2000);
    };
    init();
  }, [loadData, reconcileSettledTrades]);

  // --- Frontend Fallback: Resolve expired trades when app is open ---
  useEffect(() => {
    if (activeBinaryTrades.length === 0 || !user) return;

    const interval = setInterval(async () => {
      // ONLY run if there are pending trades that have actually expired
      const now = Date.now();
      const expiredTrades = activeBinaryTrades.filter(
        (t) => now >= t.expiryTime && (t.status === "pending" || t.status === "active"),
      );

      if (expiredTrades.length === 0) return;

      // console.log(`[WalletContext] Found ${expiredTrades.length} expired trades to resolve.`);
      
      for (const trade of expiredTrades) {
        // Skip if already being processed (prevents duplicate processing)
        if (processingTradeIds.current.has(trade.id)) continue;
        processingTradeIds.current.add(trade.id);

        // Remove from active list immediately
        setActiveBinaryTrades((prev) => prev.filter((t) => t.id !== trade.id));

        try {
          // Check if backend already resolved this trade
          const { data: dbTrade } = await supabase
            .from("binary_trades")
            .select("status")
            .eq("id", trade.id)
            .single();

          if (dbTrade && (dbTrade.status === "won" || dbTrade.status === "lost")) {
            // Backend already resolved - just refresh UI
            await refreshProfile();
            await loadData();
            processingTradeIds.current.delete(trade.id);
            continue;
          }

          // Fetch current price
          const result = await marketService.fetchSymbolPrice(trade.assetSymbol);
          if (!result || typeof result.price !== "number") {
            console.warn(`[WalletContext] Could not fetch price for ${trade.assetSymbol}, refunding.`);
            
            // --- ATOMIC REFUND VIA RPC ---
            const { data: refundRes, error: refundErr } = await supabase.rpc('refund_binary_trade', {
              p_trade_id: trade.id
            });

            if (refundErr || !refundRes?.success) {
              console.error(`[WalletContext] Atomic refund failed for ${trade.id}:`, refundErr || refundRes?.message);
            } else {
              console.log(`[WalletContext] Atomic refund successful for ${trade.id}`);
              await refreshProfile();
            }
            
            processingTradeIds.current.delete(trade.id);
            continue;
          }

          const currentPrice = result.price;
          let won = false;
          if (trade.type === "up" && currentPrice > trade.entryPrice) won = true;
          if (trade.type === "down" && currentPrice < trade.entryPrice) won = true;

          const payout = won
            ? trade.amount + (trade.amount * trade.payoutPercent) / 100
            : 0;
          const tradeStatus = won ? "won" : "lost";

          // --- ATOMIC RESOLUTION VIA RPC ---
          // This ensures only ONE resolver (across all tabs/backend) can settle this trade.
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('resolve_binary_trade', {
            p_trade_id: trade.id,
            p_new_status: tradeStatus,
            p_result_price: currentPrice,
            p_payout_amount: payout
          });

          if (rpcErr) {
            console.error(`[WalletContext] Atomic resolution failed for ${trade.id}:`, rpcErr);
            processingTradeIds.current.delete(trade.id);
            continue;
          }

          // rpcRes is the JSONB returned from the function: {success: boolean, message: string}
          if (rpcRes && rpcRes.success) {
            // SUCCESS: This was the first resolver to complete
            await refreshProfile();
            await loadData();

            // Trigger winner/loser modal
            window.dispatchEvent(
              new CustomEvent("binary-trade-result", {
                detail: {
                  won,
                  assetSymbol: trade.assetSymbol,
                  amount: trade.amount,
                  payout: won ? payout : 0,
                },
              }),
            );

            // Send win email notification (fire & forget)
            if (won && user && profile) {
              const durationMinutes = Math.round((trade.expiryTime - trade.startTime) / 60000);
              emailService.sendWinNotification({
                email: profile.email || user.email || '',
                userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
                amount: trade.amount,
                payout,
                assetSymbol: trade.assetSymbol,
                orderId: trade.id.slice(-4).toUpperCase(),
                direction: trade.type,
                durationMinutes,
                payoutPercent: trade.payoutPercent,
                lang: language,
              });
            }
          } else {
            // FAILED: Another tab or the backend already resolved this trade
            console.log(`[WalletContext] Trade ${trade.id} was already resolved by another process.`);
            await loadData(); // Refresh list to remove the trade
          }

        } catch (err) {
          console.error(`[WalletContext] Error resolving binary trade:`, err);
        } finally {
          processingTradeIds.current.delete(trade.id);
        }
      }
    }, 1000); // 1.0 seconds checking interval (was 10s)

    return () => clearInterval(interval);
  }, [activeBinaryTrades, user]);


  // --- Trade Handler ---
  const handleTrade = async (
    type: "buy" | "sell",
    asset: any,
    amountUSD: number,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Not authenticated" };

    // Use the latest balance from state (synced with profile)
    if (type === "buy" && amountUSD > balance)
      return { success: false, message: "Insufficient balance" };

    const units = amountUSD / asset.price;

    // console.log(`[WalletContext] Executing ${type} trade:`, asset.symbol, 'amount:', amountUSD);
    try {
      if (type === "buy") {
        const newBalance = balance - amountUSD;
        const newUnits = (portfolio[asset.symbol] || 0) + units;

        // 1. Update balance
        const { error: balErr } = await supabase
          .from("profiles")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (balErr) {
          console.error("[WalletContext] Balance update failed:", balErr);
          return {
            success: false,
            message: "Failed to update balance: " + balErr.message,
          };
        }

        // 2. Insert transaction
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "buy",
            asset_symbol: asset.symbol,
            amount: units,
            price: asset.price,
            total: amountUSD,
            status: "success",
          })
          .select()
          .single();
        if (txErr) {
          console.error("[WalletContext] Transaction insert failed:", txErr);
          return {
            success: false,
            message: "Failed to save transaction: " + txErr.message,
          };
        }

        // 3. Upsert portfolio
        const { error: portErr } = await supabase
          .from("portfolio")
          .upsert(
            {
              user_id: user.id,
              asset_symbol: asset.symbol,
              units: newUnits,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,asset_symbol" },
          );
        if (portErr) {
          console.error("[WalletContext] Portfolio upsert failed:", portErr);
        }

        // 4. Update local state
        setBalance(newBalance);
        setPortfolio((prev) => ({ ...prev, [asset.symbol]: newUnits }));
        if (txData) {
          setTransactions((prev) => [
            {
              id: txData.id,
              type: "buy",
              asset: asset.symbol,
              amount: units,
              price: asset.price,
              total: amountUSD,
              timestamp: txData.created_at,
              status: "success",
            },
            ...prev,
          ]);
        }
        await refreshProfile();
        // console.log('[WalletContext] Buy success:', units.toFixed(6), asset.symbol);
        return {
          success: true,
          message: `Bought ${units.toFixed(4)} ${asset.symbol}`,
        };
      } else {
        const held = portfolio[asset.symbol] || 0;
        if (units > held)
          return { success: false, message: "Insufficient assets" };

        const newBalance = balance + amountUSD;
        const newUnits = held - units;

        // 1. Update balance
        const { error: balErr } = await supabase
          .from("profiles")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (balErr) {
          console.error("[WalletContext] Balance update failed:", balErr);
          return {
            success: false,
            message: "Failed to update balance: " + balErr.message,
          };
        }

        // 2. Insert transaction
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "sell",
            asset_symbol: asset.symbol,
            amount: units,
            price: asset.price,
            total: amountUSD,
            status: "success",
          })
          .select()
          .single();
        if (txErr) {
          console.error("[WalletContext] Transaction insert failed:", txErr);
          return {
            success: false,
            message: "Failed to save transaction: " + txErr.message,
          };
        }

        // 3. Upsert portfolio
        const { error: portErr } = await supabase
          .from("portfolio")
          .upsert(
            {
              user_id: user.id,
              asset_symbol: asset.symbol,
              units: newUnits,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,asset_symbol" },
          );
        if (portErr) {
          console.error("[WalletContext] Portfolio upsert failed:", portErr);
        }

        // 4. Update local state
        setBalance(newBalance);
        setPortfolio((prev) => ({ ...prev, [asset.symbol]: newUnits }));
        if (txData) {
          setTransactions((prev) => [
            {
              id: txData.id,
              type: "sell",
              asset: asset.symbol,
              amount: units,
              price: asset.price,
              total: amountUSD,
              timestamp: txData.created_at,
              status: "success",
            },
            ...prev,
          ]);
        }
        await refreshProfile();
        // console.log('[WalletContext] Sell success:', units.toFixed(6), asset.symbol);
        return {
          success: true,
          message: `Sold ${units.toFixed(4)} ${asset.symbol}`,
        };
      }
    } catch (err) {
      console.error("[WalletContext] Trade execution unexpected error:", err);
      return { success: false, message: "Transaction failed unexpectedly" };
    }
  };


  const createBinaryTrade = async (
    type: "up" | "down",
    asset: any,
    amountUSD: number,
    durationMinutes: number,
    payoutPercent: number,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Not authenticated" };
    if (amountUSD > balance)
      return { success: false, message: "Insufficient balance" };

    try {
      const expiryTime = Date.now() + durationMinutes * 60 * 1000;
      
      // --- ATOMIC TRADE PLACEMENT VIA RPC ---
      // This handles: Balance check -> Deduction -> Entry Insertion -> Transaction Logging
      // All happen in one database transaction to ensure data integrity.
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('place_binary_trade', {
        p_user_id: user.id,
        p_type: type,
        p_asset_symbol: asset.symbol,
        p_amount: amountUSD,
        p_entry_price: asset.price,
        p_payout_percent: payoutPercent,
        p_expiry_time: expiryTime
      });

      if (rpcErr || !rpcRes?.success) {
        console.error("[WalletContext] Atomic trade placement failed:", rpcErr || rpcRes?.message);
        return { 
          success: false, 
          message: rpcRes?.message || "Server Error: Could not place trade" 
        };
      }

      // Success: Refresh all local data from the source of truth
      await refreshProfile();
      await loadData();
      
      // Re-fetch active trades to ensure local state is in sync
      const { data: activeData } = await supabase
        .from('binary_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (activeData) {
        setActiveBinaryTrades(activeData.map((t: any) => ({
          id: t.id,
          type: t.type,
          assetSymbol: t.asset_symbol,
          amount: Number(t.amount),
          entryPrice: Number(t.entry_price),
          payoutPercent: Number(t.payout_percent),
          startTime: new Date(t.created_at).getTime(),
          expiryTime: Number(t.expiry_time),
          status: t.status
        })));
      }

      return {
        success: true,
        message: `Binary Option Created: ${type.toUpperCase()} ${asset.symbol} for ${durationMinutes}m`,
      };

    } catch (err) {
      console.error("[WalletContext] createBinaryTrade error:", err);
      return { success: false, message: "Failed unexpectedly" };
    }
  };
  const deposit = async (amount: number) => {
    if (!user) return;
    const newBalance = balance + amount;
    const { error: balErr } = await supabase
      .from("profiles")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (balErr) {
      console.error("[WalletContext] Deposit balance update failed:", balErr);
      return;
    }
    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        asset_symbol: "USD",
        amount: amount,
        price: 1,
        total: amount,
        status: "success",
      })
      .select()
      .single();
    if (txErr) {
      console.error(
        "[WalletContext] Deposit transaction insert failed:",
        txErr,
      );
    }
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: txData?.id ?? Math.random().toString(36).slice(2),
        type: "deposit",
        asset: "USD",
        amount,
        price: 1,
        total: amount,
        timestamp: txData?.created_at ?? new Date().toISOString(),
        status: "success",
      },
      ...prev,
    ]);
    await refreshProfile();
  };

  // --- Withdraw ---
  const withdraw = async (amount: number): Promise<boolean> => {
    if (!user || amount > balance) return false;
    const newBalance = balance - amount;
    const { error: balErr } = await supabase
      .from("profiles")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (balErr) {
      console.error("[WalletContext] Withdraw balance update failed:", balErr);
      return false;
    }
    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdraw",
        asset_symbol: "USD",
        amount: amount,
        price: 1,
        total: amount,
        status: "success",
      })
      .select()
      .single();
    if (txErr) {
      console.error(
        "[WalletContext] Withdraw transaction insert failed:",
        txErr,
      );
    }
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: txData?.id ?? Math.random().toString(36).slice(2),
        type: "withdraw",
        asset: "USD",
        amount,
        price: 1,
        total: amount,
        timestamp: txData?.created_at ?? new Date().toISOString(),
        status: "success",
      },
      ...prev,
    ]);
    await refreshProfile();
    return true;
  };

  const contextValue = React.useMemo(() => ({
    balance,
    transactions,
    portfolio,
    loading,
    activeBinaryTrades,
    handleTrade,
    createBinaryTrade,
    deposit,
    withdraw,
    refreshWallet,
  }), [balance, transactions, portfolio, loading, activeBinaryTrades, handleTrade, createBinaryTrade, deposit, withdraw, refreshWallet]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined)
    throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
