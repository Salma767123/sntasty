"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, HelpCircle, AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}: ConfirmationModalProps) {
  const colors = {
    danger: {
      bg: "bg-red-50",
      icon: "text-red-500",
      button: "bg-red-500 hover:bg-red-600 shadow-red-100",
    },
    warning: {
      bg: "bg-orange-50",
      icon: "text-orange-500",
      button: "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
    },
    info: {
      bg: "bg-blue-50",
      icon: "text-blue-500",
      button: "bg-blue-500 hover:bg-blue-600 shadow-blue-100",
    },
  };

  const activeColor = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#234d1b]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`w-14 h-14 ${activeColor.bg} rounded-2xl flex items-center justify-center ${activeColor.icon}`}
                >
                  {type === "danger" && <AlertCircle size={28} />}
                  {type === "warning" && <AlertTriangle size={28} />}
                  {type === "info" && <Info size={28} />}
                  {!["danger", "warning", "info"].includes(type!) && (
                    <HelpCircle size={28} />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-2xl font-black text-[#234d1b] mb-2 tracking-tight">
                {title}
              </h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                {message}
              </p>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-all border border-gray-100"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-bold transition-all shadow-xl active:scale-95 ${activeColor.button}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
