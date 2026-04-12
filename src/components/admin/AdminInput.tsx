import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AdminInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: string;
  step?: string;
  disabled?: boolean;
}

export const AdminInput: React.FC<AdminInputProps> = ({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = "text",
  step,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group/input">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          step={step}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 ${icon ? "pl-12" : "px-4"} ${isPassword ? "pr-12" : "pr-4"} text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-700 ${disabled ? "opacity-50 cursor-not-allowed bg-slate-900/80" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
