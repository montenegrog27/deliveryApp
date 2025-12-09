"use client";

import { FaInstagram, FaWhatsapp, FaShoppingCart } from "react-icons/fa";
import { FaClipboardCheck } from "react-icons/fa6";

export default function BioPageMordisco() {
  return (
    <div className="min-h-screen bg-[#E00000] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center">
        {/* Avatar/logo */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden borde  shadow-md">
          <img
            src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744817613/Avatar_inicial_tbpnzy.svg"
            alt="Mordisco Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Título y descripción */}
        <h1 className="text-2xl font-bold text-[#E00000] mb-1">
          @mordisco.hamburguesas
        </h1>
        <p className="text-sm text-gray-700 mb-6">
          Abierto todos los días de 20:30 a 00:15
        </p>

        {/* Botones */}
        <div className="flex flex-col gap-4">
          {/* Pedido Web */}
          <a
            href="https://mordiscoburgers.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#E00000] text-white font-semibold py-3 rounded-xl hover:bg-[#c60000] transition"
          >
            <FaShoppingCart className="w-5 h-5" />
            Pedido Web
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/5493794054555"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full border border-[#E00000] text-[#E00000] font-semibold py-3 rounded-xl hover:bg-[#E00000]/10 transition"
          >
            <FaWhatsapp className="w-5 h-5" />
            Whatsapp de consultas y reclamos
          </a>

          {/* Instagram
          <a
            href="https://mordiscoburgers.com.ar/encuestaBio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-[#E00000] text-[#E00000] font-semibold py-3 rounded-xl hover:bg-[#E00000]/10 transition"
          > 
            <FaClipboardCheck  className="w-5 h-5" />
            Encuesta (Te regalamos un cupón!)
          </a> */}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-xs text-gray-300 text-center">
          Powered by <strong>Kablam</strong>
        </footer>
      </div>
    </div>
  );
}
