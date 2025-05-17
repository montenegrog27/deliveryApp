"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FailurePage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const router = useRouter();

  useEffect(() => {
    if (ref) {
      localStorage.removeItem(`pendingOrder_${ref}`);
      localStorage.removeItem(`orderCreated_${ref}`);
    }

    // Redirigir a inicio después de unos segundos
    const timeout = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [ref]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Pago rechazado</h1>
      <p className="mt-2 text-gray-700">
        El pago no fue aprobado o fue cancelado. Podés intentarlo nuevamente.
      </p>
      <p className="mt-4 text-sm text-gray-500">Redirigiendo al inicio...</p>
    </div>
  );
}
