import React from "react";
import {
  Phone,
  MessageCircle,
  Send,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface SupportContactListProps {
  settings: {
    phone: string;
    line: string;
    telegram: string;
  };
}

export const SupportContactList: React.FC<SupportContactListProps> = ({ settings }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
        <Phone size={12} /> {t('contactSupport')}
      </p>
      {settings.phone && (
        <a
          href={`tel:${settings.phone}`}
          className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Call Support</p>
              <p className="text-slate-400 text-xs">{settings.phone}</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-500 group-hover:text-white transition-all"
          />
        </a>
      )}
      {settings.line && (
        <a
          href={`https://line.me/ti/p/${settings.line.replace("@", "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/30 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Line Official</p>
              <p className="text-slate-400 text-xs">{settings.line}</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-500 group-hover:text-white transition-all"
          />
        </a>
      )}
      {settings.telegram && (
        <a
          href={`https://t.me/${settings.telegram.replace("@", "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Send size={20} />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Telegram</p>
              <p className="text-slate-400 text-xs">{settings.telegram}</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-500 group-hover:text-white transition-all"
          />
        </a>
      )}
    </div>
  );
};
