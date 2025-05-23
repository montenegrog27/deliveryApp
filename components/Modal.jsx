"use client";
import { motion } from "framer-motion";
import localFont from "next/font/local";

const bricolage = localFont({ src: "../app/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../app/font/BricolageGrotesque-ExtraLight.ttf" });

export default function Modal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 overscroll-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#FFF9F5] rounded-2xl p-8 max-w-sm w-[90%] mx-auto text-center shadow-2xl border border-[#ED1C24]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
      >
        <h2 className={`${bricolage.className} text-3xl text-[#ED1C24] mb-4`}>
          ¡Listo! Ya estas participando, 
          ¡Nos vemos dentro de poco!
        </h2>
        <p className={`${bricolageLight.className} text-[#1A1A1A] mb-6`}>
          ¡Muchas gracias! :)
        </p>
        <button
          onClick={onClose}
          className="bg-[#ED1C24] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#d3131a] transition-colors text-base"
        >
          ¡Genial!
        </button>
      </motion.div>
    </motion.div>
  );
}


