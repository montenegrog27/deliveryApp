"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import localFont from "next/font/local";

const bricolage = localFont({ src: "../../public/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../../public/font/BricolageGrotesque-ExtraLight.ttf" });

export default function CustomerFeedbackWizard() {
  const [step, setStep] = useState(0);
  const totalSteps = 6;
  const [form, setForm] = useState({
    experiencia: "",
    problema: "",
    volveria: "",
    comentario: "",
    nombre: "",
    telefono: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleOption = (key, value) => {
    setForm({ ...form, [key]: value });
    setStep(step + 1);
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

    const data = {
      ...form,
      telefono: form.telefono ? `+54${form.telefono}` : "",
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "feedback_clientes"), data);
      setShowCode(true);
      setStep(step + 1);
    } catch (err) {
      console.error("Error al guardar el feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ProgressIndicator = () => (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i <= step ? "bg-red-500" : "bg-gray-300"}`}
        ></div>
      ))}
    </div>
  );

  return (
    <motion.div
      className="w-full max-w-lg mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg bg-white text-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <ProgressIndicator />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="experiencia" className="space-y-6 text-center">
            <h2 className={`${bricolage.className} text-xl sm:text-2xl`}>¿Cómo fue tu experiencia general?</h2>
            {["Excelente", "Buena", "Regular", "Mala"].map((op) => (
              <button
                key={op}
                onClick={() => handleOption("experiencia", op)}
                className="w-full py-3 bg-red-100 rounded-xl hover:bg-red-200 text-base"
              >
                {op}
              </button>
            ))}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="problema" className="space-y-6 text-center">
            <h2 className={`${bricolage.className} text-xl sm:text-2xl`}>¿Qué fue lo que menos te gustó?</h2>
            {["El sabor", "El tiempo de entrega", "Poca variedad", "El precio", "La atención", "Otro"].map((op) => (
              <button
                key={op}
                onClick={() => handleOption("problema", op)}
                className="w-full py-3 bg-red-100 rounded-xl hover:bg-red-200 text-base"
              >
                {op}
              </button>
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="volveria" className="space-y-6 text-center">
            <h2 className={`${bricolage.className} text-xl sm:text-2xl`}>¿Qué te haría volver a comprar?</h2>
            {["Mejores precios", "Promociones", "Nuevos productos", "Mejor atención", "Nada, no volvería"].map((op) => (
              <button
                key={op}
                onClick={() => handleOption("volveria", op)}
                className="w-full py-3 bg-red-100 rounded-xl hover:bg-red-200 text-base"
              >
                {op}
              </button>
            ))}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="comentario" className="space-y-4">
            <label className={`${bricolageLight.className} text-base sm:text-lg`}>
              ¿Querés dejarnos un comentario adicional?
            </label>
            <textarea
              name="comentario"
              value={form.comentario}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border rounded-lg bg-red-100 text-sm sm:text-base"
              placeholder="Escribí aquí..."
            />
            <button
              onClick={() => setStep(4)}
              className="w-full bg-red-300 text-base py-3 rounded-lg hover:bg-red-400"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.form
            key="datos"
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <input
              type="text"
              name="nombre"
              placeholder="Nombre (opcional)"
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg bg-red-100 text-base"
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono (sin 0 ni 15) — opcional"
              maxLength={10}
              value={form.telefono}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg bg-red-100 text-base"
            />
            <input
              type="email"
              name="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg bg-red-100 text-base"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-red-200 rounded-lg hover:bg-red-300 text-base"
            >
              {isSubmitting ? "Enviando..." : "Finalizar y ver mi código"}
            </button>
          </motion.form>
        )}

        {showCode && step === 5 && (
          <motion.div
            key="gracias"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-4"
          >
            <h2 className={`${bricolage.className} text-3xl text-[#ED1C24]`}>¡Gracias por tu feedback!</h2>
            <p className={`${bricolageLight.className} text-[#1A1A1A] text-base sm:text-lg`}>Tu código de descuento es:</p>
            <div className="bg-red-100 border border-red-300 text-red-600 font-mono px-4 py-2 rounded-xl inline-block">
              NOSENCANTAESCUCHARTE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
