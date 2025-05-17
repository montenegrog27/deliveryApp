"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProcessingPage() {
  const [status, setStatus] = useState("verificando");
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = searchParams.get("ref");

  useEffect(() => {
    const verificarYCrear = async () => {
      if (!ref) {
        setStatus("error");
        return;
      }

      const pending = localStorage.getItem("pendingOrder_" + ref);
      if (!pending) {
        setStatus("error");
        return;
      }

      let pedido;
      try {
        pedido = JSON.parse(pending);
      } catch (err) {
        console.error("❌ Error al parsear pendingOrder:", err);
        setStatus("error");
        return;
      }

      // Validar si ya existe
      try {
        const existsRes = await fetch("/api/order-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: pedido.customer.phone, cart: pedido.cart }),
        });

        const existsData = await existsRes.json();
        if (existsData.exists) {
          localStorage.removeItem("pendingOrder_" + ref);
          setStatus("ok");
          setTimeout(() => router.push("/"), 3000);
          return;
        }
      } catch (err) {
        console.warn("⚠️ No se pudo verificar duplicado:", err);
      }

      // Crear si no existe
      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedido),
        });

        if (!res.ok) throw new Error(await res.text());

        localStorage.removeItem("pendingOrder_" + ref);
        setStatus("ok");
        setTimeout(() => router.push("/"), 4000);
      } catch (err) {
        console.error("❌ Error creando orden desde /processing:", err);
        setStatus("error");
      }
    };

    verificarYCrear();
  }, [ref]);

  return (
    <div className="p-8 text-center">
      {status === "verificando" && <p>Verificando tu pedido...</p>}
      {status === "ok" && (
        <>
          <h1 className="text-2xl font-bold text-green-600">¡Pedido registrado!</h1>
          <p>Estamos preparando tu orden. Redirigiendo...</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p>No pudimos registrar el pedido. Contactanos por WhatsApp.</p>
        </>
      )}
    </div>
  );
}
