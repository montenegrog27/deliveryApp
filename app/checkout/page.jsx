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
    email: "",
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

  // ✅ Traer zonas desde la API al montar el componente
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch("/api/zones");
        if (!res.ok) throw new Error("Error al obtener zonas");

        const text = await res.text();
        if (!text) {
          console.warn("⚠️ La respuesta está vacía");
          return;
        }

        const data = JSON.parse(text);
        console.log("📦 Zonas traídas desde Firebase:", data); // 👈 Ver en consola
        setZones(data);
      } catch (err) {
        console.error("❌ Error al traer zonas:", err);
      }
    };

    fetchZones();
  }, []);

  // ✅ Cálculo único de envío según zona y configuración
  useEffect(() => {
    if (customer.lat && customer.lng && zones.length && deliveryConfig) {
      const point = turf.point([customer.lng, customer.lat]);

      const zonaGratis = zones.find((zona) => {
        try {
          const parsedGeometry = JSON.parse(zona.geometry);
          return turf.booleanPointInPolygon(point, parsedGeometry);
        } catch (err) {
          console.warn("❌ Error en geometría:", err);
          return false;
        }
      });

      if (zonaGratis) {
        setShippingCost(0);
        setSelectedKitchenId("1"); // por ejemplo, cocina central
        setError(null);
      } else {
        const cocinaCentro = turf.point([-58.8344, -27.4748]); // Cocina central
        const cocinaGodoy = turf.point([-58.8226, -27.4725]); // Cocina godoycruz

        const distanciaCentro = turf.distance(point, cocinaCentro, {
          units: "kilometers",
        });

        const distanciaGodoy = turf.distance(point, cocinaGodoy, {
          units: "kilometers",
        });

        const cocinaElegida = distanciaCentro <= distanciaGodoy ? "1" : "3";
        setSelectedKitchenId(cocinaElegida);

        const distanciaMenor = Math.min(distanciaCentro, distanciaGodoy);
        const costo = Math.ceil(
          deliveryConfig.baseDeliveryCost +
            distanciaMenor * deliveryConfig.pricePerKm
        );

        setShippingCost(costo);
        setError(
          `Tu ubicación está fuera de nuestra zona de entrega gratis. El costo del envío es de $${costo}.`
        );
      }
    }
  }, [customer, zones, deliveryConfig]);

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
      setError(
        "Por favor seleccioná una dirección válida que incluya calle y altura (número)."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
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
      console.error(err);
      setError("Error al confirmar pedido.");
    } finally {
      setLoading(false);
    }
  };

  const contieneNumero = /\d/.test(customer.address);

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
            <input
              type="email"
              placeholder="Email"
              value={customer.email}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, email: e.target.value }))
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

          <button
            onClick={()=>{
              handleSubmit();
              router.push("/");
            }}
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
