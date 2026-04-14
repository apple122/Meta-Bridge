import React, {
  useState, useMemo, useCallback, useTransition, memo,
  useEffect,
} from 'react';
import {
  Search, Filter, RefreshCw, Calendar, ChevronDown,
  ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown,
  Trophy, XCircle, LogIn, User, Monitor, Wifi, DollarSign,
  Info, X, Hash,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { activityService } from '../../services/activityService';
import type { ActivityItem, ActivityType, ActivityFilters } from '../../services/activityService';
import { useLanguage } from '../../contexts/LanguageContext';

/* ─── Constants ────────────────────────────────────────── */
const TYPE_OPTIONS: { value: ActivityType | 'all'; labelTH: string; labelEN: string }[] = [
  { value: 'all', labelTH: 'ทั้งหมด', labelEN: 'All' },
  { value: 'deposit', labelTH: 'ฝากเงิน', labelEN: 'Deposit' },
  { value: 'withdraw', labelTH: 'ถอนเงิน', labelEN: 'Withdraw' },
  { value: 'buy', labelTH: 'ซื้อ', labelEN: 'Buy' },
  { value: 'win', labelTH: 'ชนะ', labelEN: 'Win' },
  { value: 'loss', labelTH: 'แพ้', labelEN: 'Loss' },
  { value: 'login', labelTH: 'Login', labelEN: 'Login' },
];

const PAGE_SIZE = 50;

function getTypeInfo(type: ActivityType) {
  switch (type) {
    case 'deposit': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', accent: 'border-l-emerald-500', icon: <ArrowDownCircle size={13} /> };
    case 'withdraw': return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', accent: 'border-l-rose-500', icon: <ArrowUpCircle size={13} /> };
    case 'buy': return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', accent: 'border-l-blue-500', icon: <TrendingUp size={13} /> };
    case 'sell': return { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', accent: 'border-l-orange-500', icon: <TrendingDown size={13} /> };
    case 'win': return { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', accent: 'border-l-yellow-500', icon: <Trophy size={13} /> };
    case 'loss': return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', accent: 'border-l-slate-500', icon: <XCircle size={13} /> };
    case 'login': return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', accent: 'border-l-purple-500', icon: <LogIn size={13} /> };
  }
}

function labelType(type: ActivityType, lang: string) {
  return lang === 'th'
    ? TYPE_OPTIONS.find(o => o.value === type)?.labelTH ?? type
    : TYPE_OPTIONS.find(o => o.value === type)?.labelEN ?? type;
}

function fmtDate(iso: string, lang: string) {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
    compact: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { month: 'numeric', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
  };
}

/* ─── Memoized Row Components ─────────────────────────── */
const ExpandedDetail = memo(({ item, isth }: { item: ActivityItem; isth: boolean }) => {
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (item.asset) rows.push({ label: isth ? 'สินทรัพย์' : 'Asset', value: <span className="font-mono text-sky-400">{item.asset}</span> });
  if (item.amount != null) rows.push({ label: isth ? 'มูลค่า' : 'Value', value: <span className="font-black font-mono text-emerald-400">${Number(item.amount).toLocaleString()}</span> });
  if (item.device) rows.push({ label: isth ? 'อุปกรณ์' : 'Device', value: <span className="flex items-center gap-1.5"><Monitor size={11} className="text-slate-500 shrink-0" />{item.device}</span> });
  if (item.ip) rows.push({ label: 'IP', value: <span className="flex items-center gap-1.5 font-mono"><Wifi size={11} className="text-slate-500 shrink-0" />{item.ip}</span> });
  rows.push({ label: 'User ID', value: <span className="font-mono text-slate-500 text-[10px] break-all">{item.userId}</span> });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {rows.map(({ label, value }) => (
        <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block mb-1">{label}</span>
          <span className="text-xs text-slate-300">{value}</span>
        </div>
      ))}
    </div>
  );
});

const DesktopRow = memo(({
  item, language, isExpanded, onToggle,
}: {
  item: ActivityItem;
  language: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  const info = getTypeInfo(item.type);
  const { date, time } = fmtDate(item.createdAt, language);
  const isth = language === 'th';
  return (
    <React.Fragment>
      <tr
        onClick={() => onToggle(item.id)}
        className={`cursor-pointer transition-colors duration-100 group ${isExpanded ? 'bg-slate-800/70' : 'bg-slate-900/20 hover:bg-slate-800/30'}`}
      >
        <td className="px-5 py-2.5 align-middle w-[150px]">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${info.color}`}>
            {info.icon}
            {labelType(item.type, language)}
          </span>
        </td>
        <td className="px-4 py-2.5 align-middle">
          <span className="text-white text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {item.description}
          </span>
        </td>
        <td className="px-4 py-2.5 align-middle w-[170px]">
          <p className="text-slate-300 text-[11px] font-bold truncate">{item.username}</p>
          <p className="text-slate-600 text-[10px] font-mono truncate">{item.email}</p>
        </td>
        <td className="px-4 py-2.5 align-middle w-[150px]">
          {item.type === 'login' ? (
            <span className="text-slate-500 text-[10px] line-clamp-1">{item.device}</span>
          ) : item.amount != null ? (
            <span className={`text-xs font-black font-mono ${['win', 'deposit'].includes(item.type) ? 'text-emerald-400' : ['withdraw', 'loss'].includes(item.type) ? 'text-rose-400' : 'text-slate-300'}`}>
              {['win', 'deposit'].includes(item.type) ? '+' : ['withdraw', 'loss'].includes(item.type) ? '-' : ''}
              ${Number(item.amount).toLocaleString()}
            </span>
          ) : <span className="text-slate-700">—</span>}
        </td>
        <td className="px-4 py-2.5 align-middle w-[110px]">
          <p className="text-slate-500 text-[10px] font-mono whitespace-nowrap">{date}</p>
          <p className="text-slate-700 text-[10px] tabular-nums">{time}</p>
        </td>
        <td className="pr-4 py-2.5 align-middle text-center w-10">
          <ChevronDown size={13} className={`text-slate-600 transition-transform duration-200 mx-auto ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-900/70 border-b border-primary/10">
          <td colSpan={6} className="px-6 py-4">
            <ExpandedDetail item={item} isth={isth} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

const MobileCard = memo(({
  item, language, isExpanded, onToggle,
}: {
  item: ActivityItem;
  language: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  const info = getTypeInfo(item.type);
  const { compact } = fmtDate(item.createdAt, language);
  const isth = language === 'th';
  return (
    <div
      onClick={() => onToggle(item.id)}
      className={`border-l-[3px] ${info.accent} rounded-r-xl cursor-pointer transition-colors duration-100 ${isExpanded ? 'bg-slate-800/80' : 'bg-slate-900/60 hover:bg-slate-800/50'}`}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <div className={`p-1.5 rounded-lg border shrink-0 ${info.color}`}>{info.icon}</div>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none shrink-0 whitespace-nowrap ${info.color}`}>
            {labelType(item.type, language)}
          </span>
          <div className="flex-1" />
          <span className="text-slate-600 text-[9px] font-mono whitespace-nowrap shrink-0 tabular-nums">{compact}</span>
          <ChevronDown size={12} className={`text-slate-600 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
        </div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-white text-[13px] font-semibold leading-snug">{item.description}</p>
          {item.amount != null && (
            <span className={`text-xs font-black font-mono shrink-0 ${['win', 'deposit'].includes(item.type) ? 'text-emerald-400' : ['withdraw', 'loss'].includes(item.type) ? 'text-rose-400' : 'text-slate-300'}`}>
              {['win', 'deposit'].includes(item.type) ? '+' : ['withdraw', 'loss'].includes(item.type) ? '-' : ''}${Number(item.amount).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <User size={9} className="text-slate-600 shrink-0" />
          <span className="text-[10px] text-slate-400 font-bold truncate">{item.username}</span>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-slate-600 font-mono truncate">{item.email}</span>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <ExpandedDetail item={item} isth={isth} />
          </div>
        )}
      </div>
    </div>
  );
});

/* ─── Main Component ───────────────────────────────────── */
export const UserActivityLog: React.FC = () => {
  const { language } = useLanguage();
  const isth = language === 'th';
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [userIdFilter, setUserIdFilter] = useState('');

  const [codeInput, setCodeInput] = useState('');
  const [codeUser, setCodeUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Code lookup ─────────────────────────────────────── */
  /* ── Code lookup (resolve only, no auto-search) ──── */
  const lookupCode = useCallback(async (): Promise<string | null> => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return null;
    setCodeStatus('loading');
    const { data } = await supabase.from('profiles').select('id, username, email').eq('code', code).single();
    if (data) {
      setCodeUser(data);
      setUserIdFilter(data.id);
      setCodeStatus('found');
      return data.id;
    } else {
      setCodeUser(null);
      setUserIdFilter('');
      setCodeStatus('notfound');
      return null;
    }
  }, [codeInput]);

  const clearCode = useCallback(() => {
    setCodeInput('');
    setCodeUser(null);
    setUserIdFilter('');
    setCodeStatus('idle');
  }, []);

  /* ── Main Search ────────────────────────────── */
  const fetchData = useCallback(async () => {
    // If code typed but not yet resolved, resolve first
    let resolvedUserId = userIdFilter;
    if (codeInput.trim() && !codeUser) {
      resolvedUserId = (await lookupCode()) ?? '';
    }
    setLoading(true);
    setSearched(true);
    setPage(1);
    setExpandedId(null);

    const filters: ActivityFilters = {
      startDate,
      endDate,
      type: typeFilter,
      userId: resolvedUserId || undefined,
    };
    const data = await activityService.fetchActivities(filters);
    setActivities(data);
    setLoading(false);
  }, [startDate, endDate, typeFilter, userIdFilter, codeInput, codeUser, lookupCode]);

  const clearAll = useCallback(() => {
    setStartDate(weekAgo);
    setEndDate(today);
    setTypeFilter('all');
    clearCode();
    setActivities([]);
    setSearched(false);
    setPage(1);
  }, [clearCode, today, weekAgo]);

  /* ── Toggle expand (stable ref = no row re-renders) ─── */
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  /* ── Pagination (50 per page) ─────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const paginated = useMemo(
    () => activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [activities, page]
  );
  const filtered = activities; // kept for empty-state check

  /* ── Type chip handler (non-urgent) ───────────────────── */
  const handleTypeFilter = useCallback((val: ActivityType | 'all') => {
    startTransition(() => setTypeFilter(val));
  }, []);

  /* ── Table header cells ──────────────────────────────── */
  const th = isth
    ? ['ประเภท', 'รายละเอียด', 'ผู้ใช้งาน', 'เพิ่มเติม', 'เวลา', '']
    : ['Type', 'Description', 'User', 'Detail', 'Time', ''];

  useEffect(() => {
    // ฟังก์ชันนี้จะทำงานทุกครั้งที่ค่า page เปลี่ยนแปลง
    // และทำงานหลังจากที่ React ทำการ DOM update เรียบร้อยแล้ว
    window.scrollTo({
      top: 150,
      behavior: 'smooth'
    });
  }, [page])

  return (
    <div className="space-y-5">
      {/* ── Filter Card ─────────────────────────────────── */}
      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-white/5 p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-primary" />
          <h2 className="text-white text-sm font-bold">{isth ? 'กรองข้อมูล' : 'Filter Activity'}</h2>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={10} /> {isth ? 'วันเริ่มต้น' : 'Start Date'}
            </label>
            <input type="date" value={startDate} max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:dark]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={10} /> {isth ? 'วันสิ้นสุด' : 'End Date'}
            </label>
            <input type="date" value={endDate} min={startDate} max={today}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:dark]" />
          </div>
        </div>

        {/* Code search — input + paste button */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Hash size={10} /> {isth ? 'ค้นหาด้วยรหัสลูกค้า' : 'Search by Code'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeStatus('idle'); if (!e.target.value) clearCode(); }}
                placeholder={isth ? 'เช่น ABC123...' : 'e.g. ABC123...'}
                maxLength={8}
                className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
              />
              {codeUser && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-[9px] text-emerald-400 font-bold truncate max-w-[100px]">{codeUser.username}</span>
                  <button onClick={clearCode} className="text-slate-600 hover:text-rose-400 transition-colors shrink-0"><X size={12} /></button>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  const code = text.trim().toUpperCase().slice(0, 8);
                  setCodeInput(code);
                  setCodeStatus('idle');
                  setCodeUser(null);
                  setUserIdFilter('');
                } catch { /* clipboard denied */ }
              }}
              title={isth ? 'วาง' : 'Paste'}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-colors shrink-0 border border-white/5"
            >
              {isth ? 'วาง' : 'Paste'}
            </button>
          </div>
          {codeStatus === 'found' && codeUser && (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <User size={10} /> {codeUser.username} · {codeUser.email}
            </p>
          )}
          {codeStatus === 'notfound' && (
            <p className="text-[10px] text-rose-400">{isth ? 'ไม่พบรหัสนี้' : 'Code not found'}</p>
          )}
        </div>

        {/* Type chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isth ? 'ประเภท' : 'Type'}</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => handleTypeFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors duration-100 ${typeFilter === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-300'
                  }`}>
                {isth ? opt.labelTH : opt.labelEN}
              </button>
            ))}
          </div>
        </div>

        {/* Search / Clear */}
        <div className="flex gap-3">
          <button onClick={fetchData} disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors active:scale-95 shadow-lg shadow-primary/20">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isth ? 'ค้นหา' : 'Search'}
          </button>
          {searched && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors">
              <X size={13} /> {isth ? 'ล้าง' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            {isth ? 'กำลังโหลด...' : 'Loading...'}
          </p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────── */}
      {!loading && searched && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-bold">
              {isth ? 'พบ' : 'Found'} <span className="text-primary">{activities.length.toLocaleString()}</span> {isth ? 'รายการ' : 'records'}
            </span>
            {isPending && <RefreshCw size={12} className="text-slate-600 animate-spin" />}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border-2 border-white/5 border-dashed">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                <Info className="text-slate-600" size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium">{isth ? 'ไม่พบรายการ' : 'No activity found'}</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900/95 border-b border-white/5">
                      {th.map((h, i) => (
                        <th key={i} className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest last:w-10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {paginated.map(item => (
                      <DesktopRow
                        key={item.id}
                        item={item}
                        language={language}
                        isExpanded={expandedId === item.id}
                        onToggle={toggleExpand}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-2">
                {paginated.map(item => (
                  <MobileCard
                    key={item.id}
                    item={item}
                    language={language}
                    isExpanded={expandedId === item.id}
                    onToggle={toggleExpand}
                  />
                ))}
              </div>

              {/* Pagination: Prev / Next */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    disabled={page === 1}
                    onClick={() => startTransition(() => {
                      setPage(p => p - 1);
                      setExpandedId(null);
                    })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/5">
                    {isth ? '← ก่อนหน้า' : '← Prev'}
                  </button>
                  <span className="text-slate-400 text-xs font-mono">
                    {isth ? `หน้า ${page} / ${totalPages}` : `Page ${page} / ${totalPages}`}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => startTransition(() => {
                      setPage(p => p + 1);
                      setExpandedId(null);
                    })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/5">
                    {isth ? 'ถัดไป →' : 'Next →'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Placeholder ─────────────────────────────────── */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 bg-slate-900/60 rounded-3xl flex items-center justify-center border border-white/5">
            <DollarSign size={36} className="text-slate-700" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {isth ? 'เลือกวันที่แล้วกด "ค้นหา"' : 'Select date range and press Search'}
          </p>
        </div>
      )}
    </div>
  );
};
