import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
}) => (
  <div className="fixed top-24 right-4 z-50 flex flex-col gap-1.5 pointer-events-none max-w-[280px]">
    <AnimatePresence>
      {notifications.map((notif) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 10 }}
          className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-[10px] font-bold shadow-xl backdrop-blur-md pointer-events-auto ${
            notif.type === "success" 
              ? "bg-green-500/20 border-green-500/30 text-green-400" 
              : notif.type === "warning"
                ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                : notif.type === "info"
                  ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                  : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}
        >
          {notif.type === "success" ? (
            <CheckCircle2 size={12} className="shrink-0" />
          ) : notif.type === "info" ? (
            <CheckCircle2 size={12} className="shrink-0 text-indigo-400" />
          ) : notif.type === "warning" ? (
            <AlertCircle size={12} className="shrink-0 text-orange-400" />
          ) : (
            <AlertCircle size={12} className="shrink-0" />
          )}
          <span className="leading-tight">{notif.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
