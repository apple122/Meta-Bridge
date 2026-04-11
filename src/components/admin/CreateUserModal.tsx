import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminInput } from "./AdminInput";
import { hashPassword } from "../../utils/security";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const hashedPassword = await hashPassword(formData.password);
      const { data: _data, error: registerError } = await supabase
        .from("profiles")
        .insert([{
          id: crypto.randomUUID(),
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: hashedPassword,
          is_verified: true,
          balance: 0,
          is_admin: false,
          updated_at: new Date().toISOString(),
        }])
        .select().single();

      if (registerError) throw registerError;
      console.log("[DEBUG] Admin-Created User Success:", _data);

      alert(`สร้างผู้ใช้งาน ${formData.username} สำเร็จแล้ว!`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-xl relative z-10 p-5 md:p-8 max-h-[90vh] md:max-h-[95vh] overflow-y-auto scrollbar-hide mb-16 md:mb-0"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-black text-white">
              ลงทะเบียนผู้ใช้งานใหม่
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs md:text-sm font-bold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminInput
              label="ชื่อ"
              value={formData.first_name}
              onChange={(v) => setFormData({ ...formData, first_name: v })}
              placeholder="สมชาย"
            />
            <AdminInput
              label="นามสกุล"
              value={formData.last_name}
              onChange={(v) => setFormData({ ...formData, last_name: v })}
              placeholder="ใจดี"
            />
          </div>
          <AdminInput
            label="ชื่อผู้ใช้ (Username)"
            value={formData.username}
            onChange={(v) => setFormData({ ...formData, username: v })}
            placeholder="somchai123"
          />
          <AdminInput
            label="อีเมล"
            type="email"
            value={formData.email}
            onChange={(v) => setFormData({ ...formData, email: v })}
            placeholder="somchai@example.com"
          />
          <AdminInput
            label="รหัสผ่าน"
            type="password"
            value={formData.password}
            onChange={(v) => setFormData({ ...formData, password: v })}
            placeholder="••••••••"
          />

          <div className="pt-4 flex gap-3 text-xs text-slate-500 leading-relaxed italic">
            <Shield size={24} className="shrink-0 text-slate-700" />
            <p>
              การสร้างผู้ใช้งานผ่านฟอร์มนี้ ข้อมูลจะถูกบันทึกเข้าสู่ระบบโดยตรง 
              และผู้ใช้งานจะสามารถเข้าสู่ระบบได้ทันทีโดยไม่ต้องยืนยัน OTP
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-[2] bg-primary text-white flex items-center justify-center gap-2 text-sm md:text-base font-bold rounded-xl py-4 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
            >
              สร้างผู้ใช้งาน
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
