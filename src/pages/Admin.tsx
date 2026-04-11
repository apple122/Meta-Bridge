import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Search,
  Edit2,
  Save,
  X,
  Loader2,
  TrendingUp,
  Shield,
  Phone,
  MessageCircle,
  Send,
  UserPlus,
} from "lucide-react";
import type { Profile, GlobalSettings } from "../types";
import { UserTable } from "../components/admin/UserTable";
import { AdminInput } from "../components/admin/AdminInput";
import { CreateUserModal } from "../components/admin/CreateUserModal";
import { TopUpModal } from "../components/admin/TopUpModal";
import { hashPassword, isHashed } from "../utils/security";

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "settings">("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Settings State
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    contact_phone: "",
    contact_line: "",
    contact_telegram: "",
  });

  useEffect(() => {
    fetchProfiles();
    fetchSettings();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("*")
      .eq("id", "main")
      .single();

    if (!error && data) {
      setGlobalSettings({
        contact_phone: data.contact_phone || "",
        contact_line: data.contact_line || "",
        contact_telegram: data.contact_telegram || "",
      });
    }
  };

  const handleUpdateProfile = async (profile: Profile) => {
    setIsSaving(true);
    const updateData: any = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone_number: profile.phone_number,
      balance: profile.balance,
    };

    // Only hash and update password if it's not already hashed (meaning it was changed to plaintext by the admin)
    if (profile.password && !isHashed(profile.password)) {
      updateData.password = await hashPassword(profile.password);
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? profile : p)),
      );
      setEditingProfile(null);
    }
    setIsSaving(false);
  };

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("global_settings")
      .update(globalSettings)
      .eq("id", "main");

    if (!error) {
      alert("Settings updated successfully!");
    }
    setIsSaving(false);
  };

  const handleToggleRole = async (profile: Profile) => {
    const newRole = !profile.is_admin ? "แอดมิน" : "ผู้ใช้งาน";
    const confirm = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนบทบาทของ ${profile.first_name} เป็น ${newRole}?`,
    );

    if (confirm) {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !profile.is_admin })
        .eq("id", profile.id);

      if (!error) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p,
          ),
        );
      } else {
        alert("Error updating role: " + error.message);
      }
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            จัดการผู้ใช้งาน, ยอดเงินคงเหลือ และการตั้งค่าพื้นฐานของระบบ
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 lg:px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "users" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 lg:px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "settings" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"}`}
          >
            Setting
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" ? (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, ชื่อผู้ใช้ หรือรหัสส่วนตัว..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm md:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all active:scale-95 whitespace-nowrap"
                >
                  <TrendingUp size={18} />
                  เติมเงิน
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
                >
                  <UserPlus size={18} />
                  สร้างบัญชีใหม่
                </button>
              </div>
            </div>

            {/* Users Table Sections */}
            <div className="space-y-12">
              {/* Admin Accounts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-primary" />
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    บัญชีผู้ดูแลระบบ
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase">
                    {filteredProfiles.filter((p) => p.is_admin).length} แอดมิน
                  </span>
                </div>
                <UserTable
                  profiles={filteredProfiles.filter((p) => p.is_admin)}
                  loading={loading}
                  onEdit={setEditingProfile}
                  onToggleRole={handleToggleRole}
                  emptyMessage="ไม่พบบัญชีผู้ดูแลระบบ"
                />
              </div>

              {/* Regular User Accounts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-accent" />
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    บัญชีผู้ใช้งานทั่วไป
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-black uppercase">
                    {filteredProfiles.filter((p) => !p.is_admin).length}{" "}
                    ผู้ใช้งาน
                  </span>
                </div>
                <UserTable
                  profiles={filteredProfiles.filter((p) => !p.is_admin)}
                  loading={loading}
                  onEdit={setEditingProfile}
                  onToggleRole={handleToggleRole}
                  emptyMessage="ไม่พบข้อมูลผู้ใช้งาน"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl"
          >
            <div className="glass-card space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    ช่องทางติดต่อฝ่ายสนับสนุน
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">
                    ข้อมูลเหล่านี้จะแสดงให้ผู้ใช้งานเห็นเมื่อพบปัญหาในการใช้งาน
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <AdminInput
                  label="เบอร์โทรศัพท์ติดต่อ"
                  icon={<Phone size={18} />}
                  value={globalSettings.contact_phone}
                  onChange={(val) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      contact_phone: val,
                    }))
                  }
                  placeholder="+66 8x xxx xxxx"
                />
                <AdminInput
                  label="Line ID"
                  icon={<MessageCircle size={18} />}
                  value={globalSettings.contact_line}
                  onChange={(val) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      contact_line: val,
                    }))
                  }
                  placeholder="@yourlineid"
                />
                <AdminInput
                  label="Telegram ID"
                  icon={<Send size={18} />}
                  value={globalSettings.contact_telegram}
                  onChange={(val) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      contact_telegram: val,
                    }))
                  }
                  placeholder="@yourtelegramid"
                />
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={isSaving}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-sm md:text-base font-bold"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                บันทึกการตั้งค่าทั้งหมด
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProfile(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-xl relative z-10 p-5 md:p-8 max-h-[90vh] md:max-h-[95vh] overflow-y-auto scrollbar-hide mb-16 md:mb-0"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <Edit2 className="text-primary" size={24} />
                  แก้ไขผู้ใช้งาน: {editingProfile.first_name}
                </h3>
                <button
                  onClick={() => setEditingProfile(null)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <AdminInput
                  label="ชื่อ"
                  value={editingProfile.first_name}
                  onChange={(val) =>
                    setEditingProfile({ ...editingProfile, first_name: val })
                  }
                />
                <AdminInput
                  label="นามสกุล"
                  value={editingProfile.last_name}
                  onChange={(val) =>
                    setEditingProfile({ ...editingProfile, last_name: val })
                  }
                />
                <div className="md:col-span-2">
                  <AdminInput
                    label="อีเมล"
                    value={editingProfile.email}
                    onChange={(val) =>
                      setEditingProfile({ ...editingProfile, email: val })
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <AdminInput
                    label="รหัสผ่าน"
                    type="password"
                    value={editingProfile.password || ""}
                    onChange={(val) =>
                      setEditingProfile({ ...editingProfile, password: val })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <AdminInput
                    label="เบอร์โทรศัพท์"
                    value={editingProfile.phone_number}
                    onChange={(val) =>
                      setEditingProfile({
                        ...editingProfile,
                        phone_number: val,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2 p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/20">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                    แก้ไขยอดเงินในวอลเล็ท ($)
                  </label>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="text-primary" size={24} />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editingProfile.balance}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          balance: parseFloat(e.target.value) || 0,
                        })
                      }
                      readOnly
                      className="bg-transparent border-none text-xl md:text-2xl font-black text-white focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 px-6 py-4 rounded-xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all text-sm"
                >
                  ยกเลิกการเปลี่ยนแปลง
                </button>
                <button
                  onClick={() => handleUpdateProfile(editingProfile)}
                  disabled={isSaving}
                  className="flex-[2] btn-primary flex items-center justify-center gap-2 text-sm md:text-base font-bold"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  อัปเดตโปรไฟล์
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchProfiles();
            }}
          />
        )}
      </AnimatePresence>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <TopUpModal
            onClose={() => setShowTopUpModal(false)}
            onSuccess={() => {
              setShowTopUpModal(false);
              fetchProfiles();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
