"use client";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import AddressInput from "@/components/AddressInput";
import * as turf from "@turf/turf";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });
  const [direccionConfirmada, setDireccionConfirmada] = useState(false);
  const [pedidoNotas, setPedidoNotas] = useState("");
  const [zones, setZones] = useState([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [selectedKitchenId, setSelectedKitchenId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [distanciaSucursal, setDistanciaSucursal] = useState(null);

  const fetchBranches = async () => {
    const res = await fetch("/api/branches");
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch("/api/payment-methods");
        const data = await res.json();
        const activos = data.filter((m) => m.active);
        setPaymentMethods(activos);
        if (activos.length > 0) setSelectedPaymentMethod(activos[0].name);
      } catch (err) {
        console.error("Error al traer métodos de pago:", err);
      }
    };

    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch("/api/zones");
        if (!res.ok) throw new Error("Error al obtener zonas");

        const text = await res.text();
        if (!text) return;

        const data = JSON.parse(text);
        setZones(data);
      } catch (err) {
        console.error("❌ Error al traer zonas:", err);
      }
    };

    fetchZones();
  }, []);

const calcularEnvio = async (customCustomer = customer) => {
  if (!customCustomer.lat || !customCustomer.lng || !zones.length) return;

  const point = turf.point([customCustomer.lng, customCustomer.lat]);

  // 🔍 Buscar zona que contenga el punto
  const zona = zones.find((z) => {
    if (!z.enabled) return false;
    try {
      const geometry = JSON.parse(z.geometry);
      return turf.booleanPointInPolygon(point, geometry);
    } catch (e) {
      console.warn("Geometría inválida en zona", z.name, e);
      return false;
    }
  });

  if (zona) {
    // ✅ Si está dentro de una zona, usar esa sucursal y costo fijo
    setSelectedKitchenId(zona.branchId || zona.cocinaId); // por compatibilidad
    setShippingCost(Number(zona.cost || 0));
    setError(null);
  } else {
    // ❌ Fuera de zona
    setSelectedKitchenId(null);
    setShippingCost(0);
    setError("Lo sentimos, estás fuera de nuestras zonas de entrega");
  }
};

  const subtotal = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );
  const total = subtotal + shippingCost;

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  setSuccess(false);

  if (!direccionConfirmada || !customer.isValidAddress) {
    setError("Por favor seleccioná una dirección válida que incluya calle y altura (número).");
    setLoading(false);
    return;
  }

  const ref = `${customer.phone}-${Date.now()}`;

  const orderPayload = {
    customer,
    cart: cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.attributes.price,
      discountPrice: item.discountPrice || item.attributes.price,
    })),
    shippingCost,
    kitchenId: selectedKitchenId,
    paymentMethod: selectedPaymentMethod,
    paid: false,
    notes: pedidoNotas || "",
    ref,
  };

  try {
    // Crear orden en Firestore con paid: false
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) throw new Error(await res.text());

    // Guardar localmente por si vuelve desde MP
    localStorage.setItem("pendingOrder_" + ref, JSON.stringify(orderPayload));

    // Si paga con MercadoPago, generar preferencia y redirigir
    if (selectedPaymentMethod.toLowerCase().includes("mercado")) {
      const mpRes = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!mpRes.ok) throw new Error("Error al crear preferencia de pago");

      const { init_point } = await mpRes.json();

      router.push(`${init_point}&ref=${ref}`);
      return;
    }

    // Si es otro método, ir directo a success
    clearCart();
    router.push(`/checkout/success?ref=${ref}`);
  } catch (err) {
    console.error("❌ Error al confirmar pedido:", err);
    setError("Error al confirmar pedido. Intentalo nuevamente.");
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto font-inter">
      <h1 className="text-3xl font-bold mb-8">🧾 Confirmá tu pedido</h1>

      {cart.length === 0 ? (
        <p className="text-gray-500">El carrito está vacío</p>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border p-3 rounded-lg"
              >
                <div>
                  <div className="font-semibold">{item.attributes.name}</div>
                  <div className="text-sm text-gray-600">
                    x{item.quantity} • ${item.attributes.price}
                  </div>
                </div>
                <div className="font-bold text-right">
                  ${item.attributes.price * item.quantity}
                </div>
              </div>
            ))}
            <textarea
              placeholder="Observaciones del pedido"
              value={pedidoNotas}
              onChange={(e) => setPedidoNotas(e.target.value)}
              className="w-full border px-4 py-2 rounded-md text-sm"
              rows={2}
            />

            <div className="text-right text-sm text-gray-500">
              Envío: ${shippingCost}
            </div>
            <div className="text-right font-semibold text-lg">
              Total: ${total}
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={customer.name}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, name: e.target.value }))
              }
              className="w-full border px-4 py-2 rounded-md"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={customer.phone}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, phone: e.target.value }))
              }
              className="w-full border px-4 py-2 rounded-md"
            />

<AddressInput
  onSelect={(loc) => {
    if (!loc || !loc.lat || !loc.lng) return;

    const updatedCustomer = {
      ...customer,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      isValidAddress: loc.isValidAddress,
    };

    setCustomer(updatedCustomer);
    setDireccionConfirmada(true);

    calcularEnvio(updatedCustomer);
  }}
  setDireccionConfirmada={setDireccionConfirmada} // ✅ Asegurate de agregar esta línea
/>


          </div>
{selectedKitchenId && distanciaSucursal !== null && (
  <div className="mt-3 text-sm">
    {shippingCost === 0 ? (
      <p className="text-green-600">
        Envío gratuito — Estás dentro de la zona de cobertura de{" "}
        <strong>{selectedKitchenId}</strong>.
      </p>
    ) : distanciaSucursal > 10 ? (
      <p className="text-yellow-600">
        Estás dentro de la zona de cobertura pero a{" "}
        <strong>{distanciaSucursal.toFixed(1)}km</strong>. Se aplica un costo adicional.
      </p>
    ) : (
      <p className="text-blue-600">
        Estás dentro de la zona de cobertura de{" "}
        <strong>{selectedKitchenId}</strong> (a{" "}
        {distanciaSucursal.toFixed(1)}km).
      </p>
    )}
  </div>
)}


          {shippingCost === 0 && selectedKitchenId ? (
            <p className="mt-2 text-sm text-green-700">
              Envío gratuito — Sucursal: <strong>{selectedKitchenId}</strong>
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-700">
              Envío: ${shippingCost} — Sucursal:{" "}
              <strong>{selectedKitchenId}</strong>
            </p>
          )}

{error && (
  <p className="mt-4 text-center text-red-600 text-sm">
    {error.includes("zona") ? (
      <>
        😔 Lo sentimos, no llegamos a tu ubicación todavía.<br />
        Probá con otra dirección cercana.
      </>
    ) : (
      error
    )}
  </p>
)}
          {success && (
            <p className="text-green-600 text-sm mt-2">
              ¡Pedido confirmado con éxito!
            </p>
          )}
          <textarea
            placeholder="Observaciones de dirección (dpto, casa, piso, etc.)"
            value={customer.observaciones || ""}
            onChange={(e) =>
              setCustomer((c) => ({ ...c, observaciones: e.target.value }))
            }
            className="w-full border px-4 py-2 rounded-md text-sm"
            rows={2}
          />

          <label className="block text-sm font-medium text-gray-700 mt-4">
            Método de pago
          </label>
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full border px-4 py-2 rounded-md"
          >
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
            className="mt-6 w-full bg-[#E00000] text-white py-2 rounded-xl font-semibold disabled:bg-gray-400"
          >
            {loading ? "Enviando pedido..." : "Confirmar y enviar"}
          </button>
        </>
      )}
    </div>
  );
}
