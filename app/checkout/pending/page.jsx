"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PendingPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const router = useRouter();

  useEffect(() => {
    if (ref) {
      // Aseguramos que no se borre el pedido si está pendiente
      const order = localStorage.getItem(`pendingOrder_${ref}`);
      if (order) {
        localStorage.setItem(`orderCreated_${ref}`, "pending");
      }
    }

    const timeout = setTimeout(() => {
      router.push("/");
    }, 15000); // te da 15 segs para leer el mensaje

    return () => clearTimeout(timeout);
  }, [ref]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-yellow-600">Pago pendiente</h1>
      <p className="mt-2 text-gray-700">
        El pago está en proceso. Cuando lo confirmemos, te prepararemos el pedido.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Si pagaste con un medio offline (Pago Fácil, Rapipago, etc.), recordá llevar el comprobante.
      </p>
      <p className="mt-4 text-sm text-gray-400">Redirigiendo al inicio...</p>
    </div>
  );
}
