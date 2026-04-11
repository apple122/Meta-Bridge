import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export const NewsAnalysis: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="glass-card p-8 border-l-4 border-l-primary"
  >
    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
      <Star size={24} fill="currentColor" />
      วิเคราะห์ราคาทองคำ
    </h2>
    <p className="text-slate-300 leading-relaxed">
      การวิเคราะห์ราคาทองคำเป็นหนึ่งในการวิเคราะห์ทางเทคนิคที่น่าสนใจ
      เนื่องจากทองคำมีบทบาทสำคัญในตลาดการเงินและการลงทุนของโลก
      การวิเคราะห์ราคาทองคำมีความสำคัญอย่างมากในการประมาณการแนวโน้มของตลาดและการตัดสินใจในการลงทุนที่ถูกต้อง
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          การวิเคราะห์โดยรวมของตลาด
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          การวิเคราะห์ราคาทองคำมักจะรวมถึงการสำรวจและวิเคราะห์โดยรวมของสภาวะตลาดทองคำ
          ซึ่งรวมถึงปัจจัยต่างๆ เช่น สภาวะเศรษฐกิจโลก, ความสัมพันธ์ของสกุลเงิน,
          การเคลื่อนไหวของตลาดหุ้น และตลาดทรัพย์สินอื่นๆ
          รวมถึงปัจจัยทางเศรษฐกิจที่ส่งผลต่อการตัดสินใจในการลงทุนในทองคำ
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          ปัจจัยที่มีผลต่อราคาทองคำ
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          บทความวิเคราะห์ราคาทองคำยังจะเน้นการสำรวจปัจจัยที่มีผลต่อราคาทองคำ เช่น
          ความต้องการใช้งานจริงและการใช้ทองคำในอุตสาหกรรม,
          การผลิตและผลตอบแทนที่มาจากการทำเหมือง,
          ความสัมพันธ์ระหว่างประเทศที่ส่งผลต่อการค้าทองคำ,
          และปัจจัยทางเทคนิคที่มีผลต่อการทำนายราคา
        </p>
      </div>
    </div>
  </motion.div>
);
