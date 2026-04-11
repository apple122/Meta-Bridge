import React from "react";

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
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>
      )}
      <input
        type={type}
        step={step}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 ${icon ? "pl-12" : "px-4"} pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-700 ${disabled ? "opacity-50 cursor-not-allowed bg-slate-900/80" : ""}`}
      />
    </div>
  </div>
);
