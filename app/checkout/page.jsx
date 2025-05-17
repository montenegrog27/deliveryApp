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
  const [deliveryConfig, setDeliveryConfig] = useState({
    baseDeliveryCost: 0,
    pricePerKm: 0,
  });
  const [selectedKitchenId, setSelectedKitchenId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

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
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/delivery-config");
        const data = await res.json();
        setDeliveryConfig(data);
      } catch (err) {
        console.error("❌ Error al obtener configuración de delivery", err);
      }
    };

    fetchConfig();
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

  const calcularEnvio = async () => {
    if (!customer.lat || !customer.lng || !deliveryConfig) return;

    const point = turf.point([customer.lng, customer.lat]);

    const zona = zones.find((z) => {
      if (!z.enabled) return false;
      try {
        const geometry = JSON.parse(z.geometry);
        return turf.booleanPointInPolygon(point, geometry);
      } catch {
        return false;
      }
    });

    if (zona) {
      setShippingCost(zona.cost ?? 0);
      setSelectedKitchenId(zona.cocinaId);
      setError(zona.cost === 0 ? null : `Costo de envío: $${zona.cost}`);
      return;
    }

    try {
      const branches = await fetchBranches();
      if (!branches.length) {
        setError("No hay sucursales disponibles para calcular envío");
        return;
      }

      const distances = branches.map((b) => ({
        id: b.id,
        dist: turf.distance(point, turf.point([b.lng, b.lat]), {
          units: "kilometers",
        }),
      }));

      const branchMasCercana = distances.sort((a, b) => a.dist - b.dist)[0];
      setSelectedKitchenId(branchMasCercana.id);
      const costo = Math.ceil(
        deliveryConfig.baseDeliveryCost + branchMasCercana.dist * deliveryConfig.pricePerKm
      );
      setShippingCost(costo);
      setError(`Fuera de zona. Costo de envío: $${costo}`);
    } catch (err) {
      setError("Hubo un problema calculando el envío.");
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

    const uniqueRef = `${customer.phone}-${Date.now()}`;

    if (selectedPaymentMethod.toLowerCase().includes("mercado")) {
      try {
        const response = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            cart: cart.map((item) => ({
              id: item.id,
              name: item.attributes.name,
              quantity: item.quantity,
              price: item.attributes.price,
            })),
            shippingCost,
            kitchenId: selectedKitchenId,
            paymentMethodId: selectedPaymentMethod,
            notes: pedidoNotas,
            ref: uniqueRef,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`MercadoPago Error: ${text}`);
        }

        const { init_point } = await response.json();

        localStorage.setItem(
          "pendingOrder_" + uniqueRef,
          JSON.stringify({
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
            paid: true,
            notes: pedidoNotas || "",
          })
        );

        router.push(`${init_point}&ref=${uniqueRef}`);
        return;
      } catch (err) {
        setError("No se pudo iniciar el pago con Mercado Pago.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          paid: false,
          shippingCost,
          notes: pedidoNotas,
          kitchenId: selectedKitchenId,
          cart: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setSuccess(true);
      clearCart();
    } catch (err) {
      setError("Error al confirmar pedido.");
    } finally {
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
                setCustomer((c) => ({
                  ...c,
                  address: loc.address,
                  lat: loc.lat,
                  lng: loc.lng,
                  isValidAddress: loc.isValidAddress, // ✅ usamos esto para validar si tiene altura
                }));
              }}
              setDireccionConfirmada={setDireccionConfirmada}
            />
          </div>
          <button
            onClick={calcularEnvio}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl mt-4"
          >
            Calcular envío
          </button>

          {shippingCost > 0 && (
            <p className="mt-2 text-sm text-gray-700">
              Envío: ${shippingCost} — Sucursal:{" "}
              <strong>{selectedKitchenId}</strong>
            </p>
          )}
          {shippingCost === 0 && selectedKitchenId && (
            <p className="mt-2 text-sm text-green-700">
              Envío gratuito — Sucursal: <strong>{selectedKitchenId}</strong>
            </p>
          )}

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
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
