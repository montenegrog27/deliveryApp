"use client";
import { motion } from "framer-motion";
import localFont from "next/font/local";

const bricolage = localFont({ src: "../public/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../public/font/BricolageGrotesque-ExtraLight.ttf" });

export default function Modal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
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
          ¡Gracias por participar!
        </h2>
        <p className={`${bricolageLight.className} text-[#1A1A1A] mb-4`}>
          Tu código de descuento es:
        </p>
        <div className="bg-red-100 border border-red-400 rounded-lg py-2 px-4 text-xl font-mono text-red-600 mb-6">
          NOSENCANTAESCUCHARTE
        </div>
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
