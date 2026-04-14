import { supabase } from '../lib/supabase';

export type ActivityType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'win' | 'loss' | 'login';

export interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: ActivityType;
  description: string;
  amount?: number;
  asset?: string;
  device?: string;
  ip?: string;
  createdAt: string;
  ticketId?: string;
}

export interface ActivityFilters {
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string;
  type?: ActivityType | 'all';
  userId?: string;
}

export const activityService = {
  async fetchActivities(filters: ActivityFilters = {}): Promise<ActivityItem[]> {
    const { startDate, endDate, type, userId } = filters;

    const startISO = startDate ? `${startDate}T00:00:00.000Z` : undefined;
    const endISO   = endDate   ? `${endDate}T23:59:59.999Z`   : undefined;

    const results: ActivityItem[] = [];

    // ─── 1. Transactions ───────────────────────────────────────
    const shouldFetchTx = !type || type === 'all' ||
      ['deposit', 'withdraw', 'buy', 'sell', 'win', 'loss'].includes(type);

    if (shouldFetchTx) {
      let txQuery = supabase
        .from('transactions')
        .select('id, user_id, type, asset_symbol, amount, total, status, binary_trade_id, created_at, profiles(username, email)')
        .order('created_at', { ascending: false });

      if (type && type !== 'all') txQuery = txQuery.eq('type', type);
      if (userId)   txQuery = txQuery.eq('user_id', userId);
      if (startISO) txQuery = txQuery.gte('created_at', startISO);
      if (endISO)   txQuery = txQuery.lte('created_at', endISO);

      const { data: txData } = await txQuery;

      if (txData) {
        txData.forEach((tx: any) => {
          const profile = Array.isArray(tx.profiles) ? tx.profiles[0] : tx.profiles;
          
          // Generate a user-friendly Ticket ID (Shortened UUID)
          const ticketId = tx.binary_trade_id 
            ? `${tx.binary_trade_id.split('-')[0].toUpperCase()}`
            : tx.id.split('-')[0].toUpperCase();

          results.push({
            id:          `tx-${tx.id}`,
            userId:      tx.user_id,
            username:    profile?.username ?? '—',
            email:       profile?.email    ?? '—',
            type:        tx.type as ActivityType,
            description: buildTxDescription(tx.type, tx.asset_symbol, tx.total),
            amount:      tx.total,
            asset:       tx.asset_symbol,
            createdAt:   tx.created_at,
            ticketId:    ticketId
          });
        });
      }
    }

    // ─── 2. Login History ──────────────────────────────────────
    const shouldFetchLogin = !type || type === 'all' || type === 'login';

    if (shouldFetchLogin) {
      let lhQuery = supabase
        .from('user_login_history')
        .select('id, user_id, device_name, browser_name, os_name, ip_address, created_at, profiles(username, email)')
        .order('created_at', { ascending: false });

      if (userId)   lhQuery = lhQuery.eq('user_id', userId);
      if (startISO) lhQuery = lhQuery.gte('created_at', startISO);
      if (endISO)   lhQuery = lhQuery.lte('created_at', endISO);

      const { data: lhData } = await lhQuery;

      if (lhData) {
        lhData.forEach((lh: any) => {
          const profile = Array.isArray(lh.profiles) ? lh.profiles[0] : lh.profiles;
          results.push({
            id:          `lh-${lh.id}`,
            userId:      lh.user_id,
            username:    profile?.username ?? '—',
            email:       profile?.email    ?? '—',
            type:        'login',
            description: `เข้าสู่ระบบ`,
            device:      [lh.browser_name, lh.os_name, lh.device_name].filter(Boolean).join(' · '),
            ip:          lh.ip_address ?? '—',
            createdAt:   lh.created_at,
          });
        });
      }
    }

    // ─── Sort by time descending ───────────────────────────────
    results.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return results;
  },

  async fetchUserList(): Promise<{ id: string; username: string; email: string }[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('is_admin', false)
      .order('username');
    return data ?? [];
  },
};

function buildTxDescription(type: string, asset: string, total: number): string {
  const amt = `$${Number(total).toLocaleString()}`;
  switch (type) {
    case 'deposit':  return `ฝากเงิน ${amt}`;
    case 'withdraw': return `ถอนเงิน ${amt}`;
    case 'buy':      return `ซื้อ ${asset} ${amt}`;
    case 'sell':     return `ขาย ${asset} ${amt}`;
    case 'win':      return `ชนะเทรด ${asset} +${amt}`;
    case 'loss':     return `แพ้เทรด ${asset} -${amt}`;
    default:         return `${type} ${amt}`;
  }
}
