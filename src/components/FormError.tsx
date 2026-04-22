"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          data-form-error
          className="text-red-500 text-xs font-semibold mt-1.5 ml-1"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
