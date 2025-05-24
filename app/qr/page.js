// app/page.jsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Form from "@/components/Form";
import Modal from "@/components/Modal"; // lo separamos también
import Counter from "@/components/Counter";
import localFont from "next/font/local";


// Tipografías
const bricolage = localFont({ src: "../../public/font/BricolageGrotesque-ExtraBold.ttf" });
const bricolageLight = localFont({ src: "../../public/font/BricolageGrotesque-ExtraLight.ttf" });
const bricolageBold = localFont({ src: "../../public/font/BricolageGrotesque-SemiBold.ttf" });

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // animación inicial
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-start items-center text-center bg-offwhite font-sans text-blackm bg-red-500">



      {/* HEADER + HERO */}
      <div className="counter w-full bg-gray-950">
        <Counter />
      </div>

      <img
        src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1747913968/Versi%C3%B3n_principal_2_d3jz2q.png"
        alt="MORDISCO"
        className="h-15 my-10 logo z-10"
      />

      <h1 className={`${bricolage.className} headline text-5xl md:text-6xl text-redm mb-6`}>
        ¡REGALAMOS $300.000!
      </h1>

      <p className={`${bricolageBold.className} text-2xl md:text-4xl mb-4`}>
        ¡En hamburguesas y papas!
      </p>
      <p className={`${bricolageLight.className} text-xl md:text-3xl`}>
        Rellená el formulario y obtené tu regalo.
      </p>

      {/* FORM */}
      <div className="form w-full max-w-md mb-10">
        <Form onSuccess={() => setShowModal(true)} />
      </div>

      {/* FOOTER TRAMA */}
      <footer className="mt-auto w-full">
        <img
          src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1747914223/Trama_2_evoaof.png"
          alt="Trama"
          className="w-full"
        />
      </footer>

      {/* MODAL GLOBAL */}
      <AnimatePresence>
        {showModal && <Modal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </main>
  );
}
