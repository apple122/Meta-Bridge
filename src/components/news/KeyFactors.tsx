import React from "react";
import { motion } from "framer-motion";
import { Info, TrendingDown } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export const KeyFactors: React.FC = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card"
    >
      <h3 className="text-xl font-black text-cyan-400 mb-6 flex items-center gap-2">
        <Info size={20} />
        {t("keyFactors")}
      </h3>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <TrendingDown size={24} />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {t("keyFactorsDesc1")}
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("keyFactorsDesc2")}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
