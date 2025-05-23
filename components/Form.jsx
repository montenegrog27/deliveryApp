"use client";
import { useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import localFont from "next/font/local";

// Tipografías
const bricolage = localFont({ src: "../app/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../app/font/BricolageGrotesque-ExtraLight.ttf" });

export default function Form({ onSuccess }) {
  const [form, setForm] = useState({ nombre: "", telefono: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "");
      setForm({ ...form, [name]: soloNumeros });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.telefono)) {
      alert("Ingresá exactamente 10 dígitos (sin 0 ni 15).");
      return;
    }

    if (/^15/.test(form.telefono.slice(4))) {
      alert("No incluyas el prefijo 15. Solo el código de área y el número.");
      return;
    }

    const data = {
      nombre: form.nombre,
      telefono: `+54${form.telefono}`,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "leads"), data);
      onSuccess();
      setForm({ nombre: "", telefono: "" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 w-full max-w-md mx-auto  rounded-xl shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.input
        type="text"
        name="nombre"
        placeholder="Nombre y Apellido"
        required
        value={form.nombre}
        onChange={handleChange}
        className="text-base w-full px-4 py-3 border border-[#1A1A1A] rounded-lg placeholder-red-400 bg-red-100 focus:outline-none"
        whileFocus={{ scale: 1.01 }}
      />

      <div className="flex flex-col text-left w-full">
        <label className="text-sm font-semibold text-[#1A1A1A] mb-1">Celular</label>
        <div className="flex items-center border border-[#1A1A1A] rounded-lg overflow-hidden bg-red-100">
          <span className="bg-red-100 px-3 text-base text-red-600">+54</span>
          <input
            type="tel"
            name="telefono"
            placeholder="Ej: 3794123456"
            required
            maxLength={10}
            pattern="\d*"
            value={form.telefono}
            onChange={handleChange}
            className="text-base w-full px-3 py-3 focus:outline-none bg-red-100 placeholder-red-400"
          />
        </div>
        <p className="text-xs text-red-300 mt-1 ml-1">Ingresá 10 dígitos (sin 0 ni 15)</p>
      </div>

      <motion.button
        type="submit"
        className="text-base w-full py-3 rounded-lg bg-red-200 text-red-600 font-bold hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        ¡Quiero participar!
      </motion.button>
    </motion.form>
  );
}
