// "use client";
// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function SuccessPage() {
//   const [status, setStatus] = useState("guardando");
//   const [trackingId, setTrackingId] = useState(null);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const ref = searchParams.get("ref");
//   const [orderMode, setOrderMode] = useState("delivery");

//   useEffect(() => {
//     const confirmarPago = async () => {
//       if (!ref) {
//         console.error("❌ No se encontró 'ref' en la URL");
//         setStatus("error");
//         return;
//       }

//       const pendingKey = `pendingOrder_${ref}`;
//       const alreadyCreated = localStorage.getItem(`orderCreated_${ref}`);
//       const pendingData = localStorage.getItem(pendingKey);

//       let pedido = null;
//       try {
//         pedido = pendingData ? JSON.parse(pendingData) : null;
//         if (pedido?.orderMode) {
//           setOrderMode(pedido.orderMode);
//         }
//       } catch {
//         pedido = null;
//       }

//       const pagoConMP = pedido?.paymentMethod
//         ?.toLowerCase()
//         .includes("mercado");

//       if (alreadyCreated === "true" || !pagoConMP) {
//         try {
//           const res = await fetch("/api/order-exists", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ ref }),
//           });

//           const data = await res.json();
//           if (data.exists) {
//             setTrackingId(data.trackingId || null);
//           }

//           localStorage.setItem(`orderCreated_${ref}`, "true");
//           localStorage.removeItem(pendingKey);
//           setStatus("ok");
//           return;
//         } catch (err) {
//           console.error("⚠️ Error consultando trackingId:", err);
//           setStatus("ok");
//           return;
//         }
//       }

//       try {
//         const res = await fetch("/api/mark-paid", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ref }),
//         });

//         if (!res.ok) throw new Error(await res.text());

//         const data = await res.json();
//         setTrackingId(data.trackingId);

//         localStorage.setItem(`orderCreated_${ref}`, "true");
//         localStorage.removeItem(pendingKey);
//         setStatus("ok");
//       } catch (err) {
//         console.error("❌ Error al confirmar pago:", err);
//         setStatus("error");
//       }
//     };

//     confirmarPago();
//   }, [ref]);

//   useEffect(() => {
//     if (status === "ok") {
//       const timeout = setTimeout(() => {
//         router.push("/");
//       }, 5000);
//       return () => clearTimeout(timeout);
//     }
//   }, [status, router]);

//   return (
//     <div className="min-h-screen flex items-center justify-center px-6 bg-[#FFF9F5] text-center">
//       <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full space-y-4 text-[#1A1A1A]">
//         {status === "guardando" && (
//           <div className="text-sm text-gray-500 animate-pulse">
//             Guardando pedido...
//           </div>
//         )}

//         {status === "ok" && (
//           <>
//             <h1 className="text-2xl font-bold text-green-600">
//               ¡Pedido registrado!
//             </h1>
//             <p className="text-sm text-gray-600">
//               {orderMode === "takeaway"
//                 ? "Podés pasar a retirar tu pedido en unos minutos. Te vamos a avisar por WhatsApp cuando esté listo. 🍔"
//                 : "Te contactaremos por WhatsApp para confirmar la entrega. 📦"}
//             </p>

//             <p className="text-xs text-neutral-500 mt-4">
//               Serás redirigido automáticamente en 5 segundos...
//             </p>
//           </>
//         )}

//         {status === "error" && (
//           <>
//             <h1 className="text-2xl font-bold text-red-600">Error</h1>
//             <p className="text-gray-600">
//               No se pudo guardar el pedido. Por favor, contactanos por WhatsApp.
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const [status, setStatus] = useState("guardando");
  const [trackingId, setTrackingId] = useState(null);
  const [phone, setPhone] = useState(null);
  const [orderMode, setOrderMode] = useState("delivery");

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
        if (pedido?.orderMode) setOrderMode(pedido.orderMode);
        if (pedido?.customer?.phone) setPhone(pedido.customer.phone);
      } catch {
        pedido = null;
      }

      const pagoConMP = pedido?.paymentMethod?.toLowerCase().includes("mercado");

      if (alreadyCreated === "true" || !pagoConMP) {
        try {
          const res = await fetch("/api/order-exists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref }),
          });
          const data = await res.json();
          if (data.exists) {
            setTrackingId(data.trackingId || null);
          }
          localStorage.setItem(`orderCreated_${ref}`, "true");
          localStorage.removeItem(pendingKey);
          setStatus("ok");
          return;
        } catch (err) {
          console.error("⚠️ Error consultando trackingId:", err);
          setStatus("ok");
          return;
        }
      }

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
      } catch (err) {
        console.error("❌ Error al confirmar pago:", err);
        setStatus("error");
      }
    };

    confirmarPago();
  }, [ref]);

  useEffect(() => {
    if (status === "ok") {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  // Función para mostrar el teléfono sin prefijo 549
  const mostrarTelefono = (phone) => {
    if (!phone) return "";
    return phone.startsWith("549") ? phone.slice(3) : phone;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FFF6F0] text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4 text-[#1A1A1A] border-4 border-[#E00000]">
        {status === "guardando" && (
          <div className="text-base text-neutral-500 animate-pulse">
            Guardando tu pedido en Mordisco...
          </div>
        )}

        {status === "ok" && (
          <>
            <h1 className="text-3xl font-extrabold text-[#E00000]">¡Pedido registrado! 🍔</h1>

            {phone && (
              <p className="text-md text-neutral-600">
                Te enviaremos un WhatsApp al <strong>{mostrarTelefono(phone)}</strong>{" "}
                para confirmar y avisarte{" "}
                {orderMode === "takeaway"
                  ? "cuando el pedido esté listo."
                  : "cuando lo enviamos."}
              </p>
            )}

            <p className="text-xs text-neutral-400 mt-4">
              Serás redirigido automáticamente al inicio en unos segundos...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600">Error al guardar</h1>
            <p className="text-gray-700">
              No se pudo guardar el pedido. Por favor, contactanos por WhatsApp para ayudarte.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
