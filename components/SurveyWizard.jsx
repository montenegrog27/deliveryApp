"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import localFont from "next/font/local";

// Tipografías
const bricolage = localFont({ src: "../public/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../public/font/BricolageGrotesque-ExtraLight.ttf" });

const preguntas = [
  {
    nombre: "frecuencia",
    texto: "¿Con qué frecuencia comés hamburguesas?",
    opciones: ["Una vez por semana", "Varias veces por semana", "Muy ocasionalmente"],
  },
  {
    nombre: "valor",
    texto: "¿Qué valorás más de una hamburguesa?",
    opciones: ["Sabor", "Tamaño", "Rapidez", "Precio"],
  },
];

export default function SurveyWizard({ onSuccess }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    frecuencia: "",
    valor: "",
    nombre: "",
    telefono: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOption = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setStep((prev) => prev + 1);
  };

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
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!/^\d{10}$/.test(form.telefono)) {
      alert("Ingresá exactamente 10 dígitos (sin 0 ni 15).");
      setIsSubmitting(false);
      return;
    }

    const data = {
      ...form,
      telefono: `+54${form.telefono}`,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "encuestas"), data);
      onSuccess(); // abre modal
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-6 p-6 w-full max-w-md mx-auto rounded-xl shadow-md bg-white text-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {step < preguntas.length ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h2 className={`${bricolage.className} text-2xl`}>
              {preguntas[step].texto}
            </h2>
            <div className="grid gap-3">
              {preguntas[step].opciones.map((opcion) => (
                <button
                  key={opcion}
                  className="bg-red-100 border border-red-500 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200"
                  onClick={() => handleOption(preguntas[step].nombre, opcion)}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <input
              type="text"
              name="nombre"
              placeholder="Nombre y Apellido"
              required
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-400 rounded-lg placeholder-red-400 bg-red-100"
            />

            <div className="flex flex-col text-left">
              <label className="text-sm font-semibold text-[#1A1A1A] mb-1">
                Celular
              </label>
              <div className="flex items-center border border-gray-400 rounded-lg bg-red-100 overflow-hidden">
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
                  className="w-full px-3 py-3 bg-red-100 placeholder-red-400"
                />
              </div>
              <p className="text-xs text-red-400 mt-1 ml-1">
                Ingresá 10 dígitos (sin 0 ni 15)
              </p>
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-400 rounded-lg placeholder-red-400 bg-red-100"
            />

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-bold ${
                isSubmitting
                  ? "bg-gray-300 text-gray-600"
                  : "bg-red-200 text-red-600 hover:scale-105"
              } transition-transform`}
              whileHover={!isSubmitting ? { scale: 1.05 } : {}}
              whileTap={!isSubmitting ? { scale: 0.97 } : {}}
            >
              {isSubmitting ? "Enviando..." : "Finalizar"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
