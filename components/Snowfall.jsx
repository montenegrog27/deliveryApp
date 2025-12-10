"use client";

import { useEffect } from "react";

export default function Snowfall() {
  useEffect(() => {
    const snowflakes = [];

    for (let i = 0; i < 50; i++) {
      const flake = document.createElement("div");
      flake.className = "snowflake";
      flake.style.left = Math.random() * 100 + "vw";
      flake.style.animationDuration = 5 + Math.random() * 5 + "s";
      flake.style.opacity = Math.random();
      flake.style.fontSize = 12 + Math.random() * 24 + "px";
      document.body.appendChild(flake);
      snowflakes.push(flake);
    }

    return () => {
      snowflakes.forEach((flake) => document.body.removeChild(flake));
    };
  }, []);

  return null;
}
