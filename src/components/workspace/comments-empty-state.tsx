"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";

export function CommentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex size-12 items-center justify-center rounded-xl border border-hub-espresso/10 bg-white shadow-sm"
        >
          <MessageSquarePlus className="size-5 text-hub-accent" aria-hidden />
        </motion.div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="absolute -right-1 -top-1 size-2.5 rounded-full bg-hub-accent"
          aria-hidden
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-3 font-display text-sm font-bold text-hub-espresso"
      >
        Add a comment
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="mt-1 max-w-[12rem] text-xs leading-relaxed text-hub-espresso/50"
      >
        Share feedback or type @ to mention a teammate
      </motion.p>
    </div>
  );
}
