import React, { useState } from "react";
import { Loader2, Copy, Edit2, Eye, EyeOff } from "lucide-react";
import type { Profile } from "../../types";
import { decryptPassword } from "../../utils/security";

interface UserTableProps {
  profiles: Profile[];
  loading: boolean;
  onEdit: (profile: Profile) => void;
  onToggleRole: (profile: Profile) => void;
  emptyMessage: string;
}

const PasswordCell: React.FC<{ password?: string }> = ({ password }) => {
  const [show, setShow] = useState(false);
  if (!password) return <span className="text-slate-600">---</span>;

  return (
    <div className="flex items-center gap-2 group/pass">
      <div className="text-xs opacity-50 font-mono truncate max-w-[120px]">
        {show ? decryptPassword(password) : "••••••••"}
      </div>
      <button
        onClick={() => setShow(!show)}
        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all opacity-0 group-hover/pass:opacity-100"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

export const UserTable: React.FC<UserTableProps> = ({
  profiles,
  loading,
  onEdit,
  onToggleRole,
  emptyMessage,
}) => (
  <div className="glass-card overflow-hidden p-0">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <th className="px-6 py-4">ผู้ใช้งาน</th>
            <th className="px-6 py-4">รหัส</th>
            <th className="px-6 py-4">อีเมลและรหัสผ่าน</th>
            <th className="px-6 py-4 text-right">ยอดเงิน</th>
            <th className="px-6 py-4">สถานะ</th>
            <th className="px-6 py-4 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-slate-500 text-sm"
              >
                <Loader2 className="animate-spin inline-block mr-2" />
                กำลังโหลด...
              </td>
            </tr>
          ) : profiles.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-slate-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            profiles.map((profile) => (
              <tr
                key={profile.id}
                className="group hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-black text-white shrink-0">
                      {profile.first_name?.[0]}
                      {profile.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {profile.first_name} {profile.last_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{profile.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-primary font-bold whitespace-nowrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.code || "");
                      const btn = document.getElementById(
                        `copy-btn-${profile.id}`,
                      );
                      if (btn) {
                        btn.classList.add("text-green-500");
                        setTimeout(
                          () => btn.classList.remove("text-primary"),
                          2000,
                        );
                      }
                    }}
                    id={`copy-btn-${profile.id}`}
                    className="flex items-center gap-2 hover:text-white transition-all active:scale-95 group"
                    title="Copy to clipboard"
                  >
                    {profile.code}
                    <Copy
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm min-w-[220px]">
                  <div className="truncate max-w-[200px] mb-1">{profile.email}</div>
                  <PasswordCell password={profile.password} />
                </td>
                <td className="px-6 py-4 text-right text-white font-bold font-mono whitespace-nowrap">
                  $
                  {profile.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleRole(profile)}
                    className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all active:scale-95 ${profile.is_admin ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                  >
                    {profile.is_admin ? "แอดมิน" : "ผู้ใช้"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(profile)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

