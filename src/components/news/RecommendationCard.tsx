import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export const RecommendationCard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
    className="glass-card bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-yellow-500/30 p-8"
  >
    <h3 className="text-2xl font-black text-yellow-500 mb-6 flex items-center gap-2">
      <ShieldCheck size={28} />
      คำแนะนำ (Recommendation)
    </h3>
    <div className="space-y-4">
      <p className="text-white font-medium leading-relaxed">
        ราคาทองคำมีความผันผวนเพิ่มขึ้น โดยเมื่อราคามีการฟื้นตัวขึ้น
        ยังคงมีแรงขายทำกำไรสลับเข้ามาเป็นระยะๆ
        <span className="text-yellow-500 font-black px-1 underline underline-offset-4">
          แนะนำพิจารณาโซน 2,528-2,532 ดอลลาร์ต่อออนซ์
        </span>
        ในการเปิดสถานะขาย
      </p>
      <div className="flex flex-col md:flex-row gap-4 py-4 border-y border-white/5">
        <div className="flex-1 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-[10px] uppercase font-black text-green-500 tracking-widest mb-1">
            Take Profit Zone
          </p>
          <p className="text-xl font-black text-white">
            2,500 - 2,493{" "}
            <span className="text-xs text-slate-500 font-normal">USD</span>
          </p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-[10px] uppercase font-black text-red-500 tracking-widest mb-1">
            Stop Loss
          </p>
          <p className="text-xl font-black text-white">
            &gt; 2,532{" "}
            <span className="text-xs text-slate-500 font-normal">USD</span>
          </p>
        </div>
      </div>
      <p className="text-slate-400 text-sm">
        รอการปรับตัวเข้าใกล้แนวรับโซน 2,500-2,493 ดอลลาร์ต่อออนซ์
        หากยืนไม่ได้สามารถถือสถานะขายต่อ (ตัดขาดทุนหากราคาผ่าน 2,532
        ดอลลาร์ต่อออนซ์)
      </p>
    </div>
  </motion.div>
);
