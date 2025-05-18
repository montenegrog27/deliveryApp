"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const [status, setStatus] = useState("guardando");
  const [trackingId, setTrackingId] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    const confirmarPago = async () => {
      if (!ref) {
        console.error("❌ No se encontró 'ref' en la URL");
        setStatus("error");
        return;
      }

      const pendingKey = `pendingOrder_${ref}`;
      const alreadyCreated = localStorage.getItem(`orderCreated_${ref}`);
      const pendingData = localStorage.getItem(pendingKey);

      let pedido = null;
      try {
        pedido = pendingData ? JSON.parse(pendingData) : null;
      } catch {
        pedido = null;
      }

      const pagoConMP = pedido?.paymentMethod?.toLowerCase().includes("mercado");

      if (alreadyCreated === "true") {
        try {
          const res = await fetch("/api/order-exists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref }),
          });

          const data = await res.json();
          if (data.exists && data.trackingId) {
            setTrackingId(data.trackingId);
            setStatus("ok");
            return;
          }
        } catch (err) {
          console.error("⚠️ Error consultando trackingId:", err);
        }

        setStatus("ok");
        return;
      }

      if (pagoConMP) {
        try {
          const res = await fetch("/api/mark-paid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref }),
          });

          if (!res.ok) throw new Error(await res.text());

          const data = await res.json();
          setTrackingId(data.trackingId);

          localStorage.setItem(`orderCreated_${ref}`, "true");
          localStorage.removeItem(pendingKey);
          setStatus("ok");
          return;
        } catch (err) {
          console.error("❌ Error al confirmar pago:", err);
          setStatus("error");
          return;
        }
      }

      localStorage.setItem(`orderCreated_${ref}`, "true");
      localStorage.removeItem(pendingKey);
      setStatus("ok");
    };

    confirmarPago();
  }, [ref]);

  return (
    <div className="p-8 text-center">
      {status === "guardando" && <p>Guardando pedido...</p>}

      {status === "ok" && (
        <>
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Pedido confirmado!</h1>
          <p className="mb-4">Tu pedido fue registrado con éxito.</p>
          {trackingId && (
            <a
              href={`/tracking/${trackingId}`}
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
            >
              Ver seguimiento en tiempo real
            </a>
          )}
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

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
