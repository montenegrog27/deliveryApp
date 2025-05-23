"use client";
import { useEffect, useState } from "react";
import gsap from "gsap";

export default function Counter() {
  const [text, setText] = useState("");

  useEffect(() => {
    const targetDate = new Date("2025-06-06T20:30:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setText("¡Ya abrimos!");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const format = (n) => String(n).padStart(2, "0");

      setText(`${format(days)}d ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`);
      gsap.fromTo("#counter", { scale: 1.1 }, { scale: 1, duration: 0.5 });
    };

    updateCountdown(); // Mostrar inmediatamente
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="counter" className="text-2xl md:text-3xl font-bold my-4 text-blackm text-gray-50">
      Abrimos en {text}
    </div>
  );
}
