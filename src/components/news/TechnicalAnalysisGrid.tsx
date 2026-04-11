import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info } from "lucide-react";

export const TechnicalAnalysisGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card"
    >
      <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2">
        <TrendingUp size={20} />
        การวิเคราะห์ทางเทคนิค
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        ใช้อาจจะใช้เครื่องมือทางเทคนิคต่างๆ เช่น
        การวิเคราะห์กราฟและแผนภูมิราคาทองคำในช่วงเวลาที่แตกต่างกัน,
        การใช้เทคนิคทางเทคนิคในการทำนายราคา (เช่น การวิเคราะห์ที่เทคนิคเชิงเส้น,
        การใช้ Moving Averages, RSI, MACD, ฯลฯ),
        และการตรวจสอบแนวโน้มราคาทองคำในระยะยาวและระยะสั้น
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card border-slate-700/50"
    >
      <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2">
        <Info size={20} />
        การให้คำแนะนำในการลงทุน
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        ส่วนสำคัญของบทความวิเคราะห์ราคาทองคำคือการให้คำแนะนำในการลงทุนที่มีความสอดคล้องกับข้อมูลที่ได้รับ
        คำแนะนำเหล่านี้อาจจะเป็นการตัดสินใจที่เกี่ยวข้องกับการลงทุนในทองคำในสถานการณ์ที่แตกต่างกัน
        เพื่อให้ผู้อ่านสามารถใช้ข้อมูลที่ได้รับมาในการตัดสินใจการลงทุนที่ถูกต้อง
      </p>
    </motion.div>
  </div>
);
