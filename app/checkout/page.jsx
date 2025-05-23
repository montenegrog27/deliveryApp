"use client";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import AddressInput from "@/components/AddressInput";
import * as turf from "@turf/turf";
import { useRouter } from "next/navigation";

function formatOrderSummary(cart) {
  const lines = cart.map(
    (item) => `${item.quantity} ${item.attributes.name}`
  );
  const total = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );
  return lines.join("\n") + `\nTotal: $${total}`;
}

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

  const [tieneCupon, setTieneCupon] = useState(false);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponValido, setCuponValido] = useState(null);
  const [cuponError, setCuponError] = useState(null);
  const [cuponDescuento, setCuponDescuento] = useState(0);
  const [cuponData, setCuponData] = useState(null);

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
      setSelectedKitchenId(zona.branchId || zona.cocinaId);
      setShippingCost(Number(zona.cost || 0));
      setError(null);
    } else {
      setSelectedKitchenId(null);
      setShippingCost(0);
      setError("Lo sentimos, estás fuera de nuestras zonas de entrega");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );

  const descuentoAplicado = (subtotal * cuponDescuento) / 100;
  const total = subtotal + shippingCost - descuentoAplicado;

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

    if (!customer.phone || customer.phone.length < 10) {
      setError(
        "Por favor ingresá un número válido (sin el +54, solo el número)."
      );
      setLoading(false);
      return;
    }

    const formattedPhone = `54${customer.phone}`;
    const ref = `${formattedPhone}-${Date.now()}`;

    const orderPayload = {
      customer: {
        ...customer,
        phone: formattedPhone,
      },
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
      coupon: cuponData?.code || null,
      couponDiscount: cuponDescuento,
    };

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error(await res.text());

      localStorage.setItem("pendingOrder_" + ref, JSON.stringify(orderPayload));

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

      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          trackingId: ref,
          customerName: customer.name,
          templateName: "confirmar_pedido",
          branchName: "Santa Fe 1583",
        }),
      });

      console.log("📦 Enviando WhatsApp con:", {
        phone: formattedPhone,
        trackingId: ref,
        customerName: customer.name,
      });
      clearCart();
      router.push(`/checkout/success?ref=${ref}`);
    } catch (err) {
      console.error("❌ Error al confirmar pedido:", err);
      setError("Error al confirmar pedido. Intentalo nuevamente.");
      setLoading(false);
    }
  };


  const validarCupon = async () => {
    setCuponError(null);
    setCuponValido(null);

    try {
      const res = await fetch(`/api/coupons?code=${cuponInput}`);
      if (!res.ok) throw new Error("Cupón no encontrado");
      const cupon = await res.json();

      const hoy = new Date();
      const fechaInicio = cupon.startDate ? new Date(cupon.startDate) : null;
      const fechaFin = cupon.endDate ? new Date(cupon.endDate) : null;

      if (fechaInicio && hoy < fechaInicio) {
        throw new Error("El cupón aún no está activo.");
      }

      if (fechaFin && !cupon.noExpiry && hoy > fechaFin) {
        throw new Error("El cupón ha expirado.");
      }

      if (cupon.phoneRequired && cupon.phone !== customer.phone) {
        throw new Error("Este cupón es exclusivo para otro número.");
      }

      setCuponDescuento(Number(cupon.discount || 0));
      setCuponData(cupon);
      setCuponValido(true);
    } catch (err) {
      setCuponDescuento(0);
      setCuponValido(false);
      setCuponData(null);
      setCuponError(err.message || "Cupón inválido");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] px-4 py-6 max-w-2xl mx-auto text-[#1A1A1A] font-inter space-y-8">
      <h1 className="text-3xl font-bold mb-8">🧾 Confirmá tu pedido</h1>

      {cart.length === 0 ? (
        <p className="text-gray-500">El carrito está vacío</p>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="text-sm leading-tight">
                  <p className="font-bold">{item.attributes.name}</p>
                  <p className="text-neutral-600 text-xs">
                    x{item.quantity} • ${item.attributes.price}
                  </p>
                </div>
                <div className="font-bold text-sm">
                  ${item.attributes.price * item.quantity}
                </div>
              </div>
            ))}

            <textarea
              placeholder="Observaciones del pedido"
              value={pedidoNotas}
              onChange={(e) => setPedidoNotas(e.target.value)}
              className="w-full bg-white border border-neutral-300 px-4 py-2 text-sm rounded-md"
            />

            <p className="text-right text-sm text-neutral-600">
              Envío: ${shippingCost}
            </p>
            <p className="text-right font-bold text-lg">Total: ${total}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full bg-white border border-neutral-300 px-4 py-2 rounded-md text-sm"
              value={customer.name}
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                +54
              </span>
              <input
                type="tel"
                placeholder="Ej: 3794123456"
                className="pl-12 w-full bg-white border border-neutral-300 px-4 py-2 rounded-md text-sm"
                value={customer.phone}
                onChange={(e) => {
                  // Eliminá cualquier carácter que no sea número
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setCustomer((prev) => ({ ...prev, phone: cleaned }));
                }}
              />
            </div>

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
                  <strong>{distanciaSucursal.toFixed(1)}km</strong>. Se aplica
                  un costo adicional.
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
                  😔 Lo sentimos, no llegamos a tu ubicación todavía.
                  <br />
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

          <div className="mt-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={tieneCupon}
                onChange={(e) => setTieneCupon(e.target.checked)}
              />
              <span>Tengo un cupón</span>
            </label>

            {tieneCupon && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Código de cupón"
                  value={cuponInput}
                  onChange={(e) => setCuponInput(e.target.value.toLowerCase())}
                  className="w-full border px-4 py-2 rounded-md"
                />
                <button
                  onClick={validarCupon}
                  type="button"
                  className="w-full bg-blue-600 text-white py-2 rounded-md text-sm"
                >
                  Validar cupón
                </button>

                {cuponValido && (
                  <p className="text-green-600 text-sm">✅ Cupón válido</p>
                )}
                {cuponError && (
                  <p className="text-red-600 text-sm">{cuponError}</p>
                )}
              </div>
            )}
          </div>

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
            className="w-full border border-neutral-300 bg-white px-4 py-2 rounded-md text-sm"
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
            className="w-full bg-[#E00000] hover:bg-[#C40000] text-white py-3 rounded-full font-bold mt-4 disabled:bg-gray-300 transition"
          >
            {loading ? "Enviando pedido..." : "Confirmar y enviar"}
          </button>
        </>
      )}
    </div>
  );
}
