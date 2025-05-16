"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const [status, setStatus] = useState("guardando");
  const router = useRouter();

  useEffect(() => {
    const guardarPedido = async () => {
      const pending = localStorage.getItem("pendingOrder");
      const alreadyCreated = localStorage.getItem("orderCreated");

      // Si ya se guardó antes, no volver a enviarlo
      if (!pending || alreadyCreated === "true") {
        setStatus("error");
        return;
      }

      let pedido;
      try {
        pedido = JSON.parse(pending);
      } catch (err) {
        console.error("❌ Error al parsear pedido:", err);
        setStatus("error");
        return;
      }

      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedido),
        });

        if (!res.ok) throw new Error(await res.text());

        // ✅ Marcamos como creado para evitar duplicación
        localStorage.setItem("orderCreated", "true");
        localStorage.removeItem("pendingOrder");

        setStatus("ok");

        setTimeout(() => {
          localStorage.removeItem("orderCreated");
          router.push("/");
        }, 4000);
      } catch (err) {
        console.error("❌ Error al guardar pedido pagado:", err);
        setStatus("error");
      }
    };

    guardarPedido();
  }, []);

  return (
    <div className="p-8 text-center">
      {status === "guardando" && <p>Guardando pedido...</p>}
      {status === "ok" && (
        <>
          <h1 className="text-2xl font-bold text-green-600">¡Pago confirmado!</h1>
          <p>Tu pedido fue registrado. Redirigiendo...</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p>No se pudo guardar el pedido. Contactanos por WhatsApp.</p>
        </>
      )}
    </div>
  );
}
