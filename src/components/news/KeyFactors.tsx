import React from "react";
import { motion } from "framer-motion";
import { Info, TrendingDown } from "lucide-react";

export const KeyFactors: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="glass-card"
  >
    <h3 className="text-xl font-black text-cyan-400 mb-6 flex items-center gap-2">
      <Info size={20} />
      ปัจจัยสำคัญ (Key Factors)
    </h3>
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
          <TrendingDown size={24} />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          เมื่อวานนี้ ราคาทองคำพลิกกลับปิดลบ{" "}
          <span className="text-red-500 font-bold">4.60 ดอลลาร์ต่อออนซ์</span>{" "}
          โดยราคาในช่วงแรกมีแรงซื้อดันขึ้นทำ High ที่ระดับ 2,528 ดอลลาร์ต่อออนซ์
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white/5 space-y-4">
        <p className="text-sm text-slate-400 leading-relaxed">
          รับแรงซื้อในช่วงดีเบตเลือกตั้งสหรัฐฯ ที่คะแนนนิยมผันผวน ประกอบกับ
          แรงซื้อเก็งกำไรว่าดัชนี CPI y/y สหรัฐฯ จะลดลงสู่ระดับ 2.5%
          ซึ่งภายหลังจากเปิดเผยตัวเลขเงินเฟ้อดังกล่าว ส่วนใหญ่ออกมาตามคาดการณ์
          และมีดัชนี CPI m/m อยู่ที่ 0.3% สูงกว่าคาดการณ์ ทองคำจึงมีแรงขายทำกำไร
          ทำ Low ที่ระดับ 2,500 ดอลลาร์ต่อออนซ์
        </p>
      </div>
    </div>
  </motion.div>
);
