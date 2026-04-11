import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { NewsHeader } from "../components/news/NewsHeader";
import { NewsAnalysis } from "../components/news/NewsAnalysis";
import { TechnicalAnalysisGrid } from "../components/news/TechnicalAnalysisGrid";
import { RecommendationCard } from "../components/news/RecommendationCard";
import { KeyFactors } from "../components/news/KeyFactors";

export const News: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
      <NewsHeader
        title="ข่าวสาร!"
        subtitle="บทวิเคราะห์และการประเมินสถานการณ์ตลาดล่าสุด"
        badgeText={t("news")}
      />

      <NewsAnalysis />

      <TechnicalAnalysisGrid />

      <RecommendationCard />

      <KeyFactors />

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-12 text-center"
      >
        <p className="text-cyan-500 font-black text-sm tracking-widest mb-1 italic">
          THANK YOU FOR READ
        </p>
        <p className="text-cyan-900 font-black text-xs tracking-widest uppercase">
          MetaBridge
        </p>
      </motion.div>
    </div>
  );
};
