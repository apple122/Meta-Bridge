import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";

interface Tab {
  id: string;
  labelKey: string;
  icon?: React.ReactNode;
}

interface AdminTabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: any) => void;
  pendingIssuesCount: number;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ 
  tabs, 
  activeTab, 
  setActiveTab, 
  pendingIssuesCount 
}) => {
  const { t } = useLanguage();

  return (
    <div className="hidden lg:flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 w-full lg:w-auto gap-1 mb-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 lg:flex-none lg:px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === tab.id
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {tab.icon}
          {t(tab.labelKey)}
          {tab.id === "issues" && pendingIssuesCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black animate-pulse">
              {pendingIssuesCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
