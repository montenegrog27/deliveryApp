"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const [status, setStatus] = useState("guardando");
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    const guardarPedido = async () => {
      if (!ref) {
        console.error("❌ No se encontró 'ref' en la URL");
        setStatus("error");
        return;
      }

      const pendingKey = `pendingOrder_${ref}`;
      const pending = localStorage.getItem(pendingKey);
      const alreadyCreated = localStorage.getItem(`orderCreated_${ref}`);

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
        const existsRes = await fetch("/api/order-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: pedido.customer.phone, cart: pedido.cart }),
        });

        const existsData = await existsRes.json();
        if (existsData.exists) {
          console.warn("⚠️ El pedido ya fue registrado");
          localStorage.removeItem(pendingKey);
          setStatus("ok");
          setTimeout(() => router.push("/"), 3000);
          return;
        }
      } catch (err) {
        console.error("⚠️ Error verificando duplicados:", err);
      }

      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedido),
        });

        if (!res.ok) throw new Error(await res.text());

        localStorage.setItem(`orderCreated_${ref}`, "true");
        localStorage.removeItem(pendingKey);

        setStatus("ok");
        setTimeout(() => {
          localStorage.removeItem(`orderCreated_${ref}`);
          router.push("/");
        }, 4000);
      } catch (err) {
        console.error("❌ Error al guardar pedido pagado:", err);
        setStatus("error");
      }
    };

    guardarPedido();
  }, [ref]);

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
