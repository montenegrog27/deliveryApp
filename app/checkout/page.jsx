"use client";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import AddressInput from "@/components/AddressInput";
import { point, distance } from "@turf/turf";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { Marker } from "react-map-gl/mapbox";
import { FaLocationDot } from "react-icons/fa6";

// Map importado solo del lado cliente, con fallback de carga
const Map = dynamic(
  () => import("react-map-gl/mapbox").then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Cargando mapa...</p>
      </div>
    ),
  }
);

export default function CheckoutPage() {
  const debounceTimeout = useRef(null);

  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
    floor: "",
    apartment: "",
  });
  const [direccionConfirmada, setDireccionConfirmada] = useState(false);
  // const [zones, setZones] = useState([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [selectedKitchenId, setSelectedKitchenId] = useState(null);
  const [selectedKitchenName, setSelectedKitchenName] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [distanciaSucursal, setDistanciaSucursal] = useState(null);

  const [tieneCupon, setTieneCupon] = useState(false);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponValido, setCuponValido] = useState(null);
  const [cuponError, setCuponError] = useState(null);
  const [cuponDescuento, setCuponDescuento] = useState(0);
  const [cuponData, setCuponData] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -27.47, lng: -58.83 });
  const [mapCandidate, setMapCandidate] = useState(null);
  const [branches, setBranches] = useState([]);
  const [orderMode, setOrderMode] = useState("delivery");
  const [cuponMensaje, setCuponMensaje] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/settings/branches");
        const data = await res.json();
        setBranches(data.branches);
      } catch (err) {
        console.error("Error al traer sucursales:", err);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    if (orderMode === "takeaway") {
      setShippingCost(0);
      setSelectedKitchenId(null); // si querés que seleccione manualmente
      setSelectedKitchenName(null);
      setDireccionConfirmada(false);
      setDistanciaSucursal(null);
    } else {
      // Si vuelve a delivery y ya había dirección, recalculamos
      if (customer.lat && customer.lng) {
        calcularEnvio(customer);
      }
    }
  }, [orderMode]);

  useEffect(() => {
    if (
      orderMode === "delivery" &&
      customer.lat &&
      customer.lng &&
      customer.isValidAddress
    ) {
      calcularEnvio(customer);
    }
  }, [customer.lat, customer.lng]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch("/api/payment-methods");
        const data = await res.json();
        const activos = data.filter((m) => m.active);
        setPaymentMethods(activos);
        if (activos.length > 0) setSelectedPaymentMethod(activos[0].type);
      } catch (err) {
        console.error("Error al traer métodos de pago:", err);
      }
    };

    fetchPaymentMethods();
  }, []);

  const calcularEnvio = async (customCustomer = customer) => {
    const sucursalesDisponibles = branches.filter((b) => b.delivery);
    if (!customCustomer.lat || !customCustomer.lng || branches.length === 0)
      return;

    try {
      const configRes = await fetch("/api/settings/delivery");
      const {
        baseDeliveryCost,
        pricePerKm,
        maxDistanceKm,
        freeShippingRadius,
      } = await configRes.json();

      const puntoCliente = point([customCustomer.lng, customCustomer.lat]);

      let mejorSucursal = null;
      let menorDistancia = Infinity;

      for (const branch of sucursalesDisponibles) {
        const puntoSucursal = point([branch.lng, branch.lat]);
        const distanciaKm = distance(puntoCliente, puntoSucursal, {
          units: "kilometers",
        });

        if (distanciaKm < menorDistancia) {
          menorDistancia = distanciaKm;
          mejorSucursal = { ...branch, distancia: distanciaKm };
        }
      }

      if (!mejorSucursal || menorDistancia > maxDistanceKm) {
        setSelectedKitchenId(null);
        setShippingCost(0);
        setError("No hay sucursales disponibles para delivery en tu zona.");
        return;
      }

      let costoEnvio = baseDeliveryCost;
      if (menorDistancia > freeShippingRadius) {
        const extraKm = Math.ceil(menorDistancia - freeShippingRadius);
        costoEnvio += extraKm * pricePerKm;
      } else {
        costoEnvio = 0;
      }

      setSelectedKitchenId(mejorSucursal.id);
      setSelectedKitchenName(mejorSucursal.name); // si necesitás mostrarlo
      setShippingCost(costoEnvio);
      setDistanciaSucursal(menorDistancia);
      setError(null);
    } catch (err) {
      console.error("❌ Error al calcular envío:", err);
      setError("No se pudo calcular el costo de envío.");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.attributes.price * item.quantity,
    0
  );

  let descuentoAplicado = 0;

  if (cuponData?.discountType === "amount") {
    descuentoAplicado = Math.min(cuponDescuento, subtotal); // nunca mayor al subtotal
  } else if (cuponData?.discountType === "percent") {
    descuentoAplicado = (subtotal * cuponDescuento) / 100;
  }

  // Total = subtotal - descuento + envío (envío no se descuenta)
  const descuentoFinal = Math.round(descuentoAplicado); // redondeo limpio
  const total = Math.max(0, subtotal - descuentoFinal + shippingCost);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (orderMode === "delivery") {
      if (!direccionConfirmada || !customer.isValidAddress) {
        setError("Por favor seleccioná una dirección válida...");
        setLoading(false);
        return;
      }

      if (!customer.phone || customer.phone.length < 10) {
        setError("Ingresá un número válido (sin el +54)");
        setLoading(false);
        return;
      }
    }

    if (!customer.name) {
      setError("Por favor ingresá tu nombre y apellido.");
      setLoading(false);
      return;
    }

    const formattedPhone = `549${customer.phone}`;
    const ref = `${formattedPhone}-${Date.now()}`;

    if (orderMode === "takeaway") {
      if (!selectedKitchenId) {
        setError("Por favor seleccioná una sucursal para retirar.");
        setLoading(false);
        return;
      }
    }
    const orderPayload = {
      customer: {
        ...customer,
        phone: formattedPhone,
      },
      cart: cart.map((item) => ({
        id: item.id,
        name: item.attributes.name, // ✅ nombre del producto
        quantity: item.quantity,
        price: item.attributes.price,
        discountPrice: item.discountPrice || item.attributes.price,
        note: item.attributes.note || "", // ✅ incluir observaciones
        extras: item.attributes.extras || null, //
      })),
      shippingCost,
      kitchenId: selectedKitchenId,
      paymentMethod: selectedPaymentMethod,
      paid: false,
      ref,
      coupon: cuponData?.code || null,
      couponDiscount: descuentoFinal,
      discountType: cuponData?.discountType || "amount", // importante!
      orderMode,
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
      console.log("orderPayload.cart[0].price", orderPayload.cart[0].price);

      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          trackingId: ref,
          customerName: customer.name,
          templateName: "confirmar_pedido",
          branchName: "Santa Fe 1583",
          totalAmount: total,
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
      if (!customer.phone) {
        throw new Error("Ingresá tu número antes de validar el cupón.");
      }

      const res = await fetch(`/api/coupons?code=${cuponInput}`);
      if (!res.ok) throw new Error("Cupón no encontrado");
      const cupon = await res.json();

      const hoy = new Date();
      const usosCliente =
        cupon.usedBy?.filter((u) => u.phone === `549${customer.phone}`) || [];

      // 🔐 Validar teléfono
      if (cupon.phoneRequired && cupon.phone !== `549${customer.phone}`) {
        throw new Error("Este cupón es exclusivo para otro número.");
      }

      // ⏳ Validar fechas
      const fechaInicio = cupon.startDate ? new Date(cupon.startDate) : null;
      const fechaFin = cupon.endDate ? new Date(cupon.endDate) : null;

      if (fechaInicio && hoy < fechaInicio) {
        throw new Error("El cupón aún no está activo.");
      }

      if (!cupon.noExpiry && fechaFin && hoy > fechaFin) {
        throw new Error("El cupón ha expirado.");
      }

      // 🔁 Validar uso según tipo
      switch (cupon.usageLimit) {
        case "once":
          if (usosCliente.length > 0) {
            throw new Error("Este cupón ya fue usado.");
          }
          break;

        case "once_per_week":
          const usadoEstaSemana = usosCliente.some((u) => {
            const fechaUso = new Date(u.date);
            const diasDesdeUso = (hoy - fechaUso) / (1000 * 60 * 60 * 24);
            return diasDesdeUso < 7;
          });
          if (usadoEstaSemana) {
            throw new Error("Este cupón ya fue usado esta semana.");
          }
          break;

        case "date_limit":
          // Ya validado con fechaFin arriba
          break;

        case "no_limit":
        default:
          // Sin restricciones
          break;
      }

      // ✅ Si pasó todas  validaciones
      setCuponDescuento(Number(cupon.discount || 0));
      setCuponData(cupon);
      if (cupon.phoneRequired && cupon.name) {
        setCuponMensaje(`Hola ${cupon.name}, tu cupón es válido! 😉`);
      } else {
        setCuponMensaje("Cupón válido");
      }

      setCuponValido(true);
    } catch (err) {
      setCuponDescuento(0);
      setCuponData(null);
      setCuponValido(false);
      setCuponError(err.message || "Cupón inválido");
    }
  };

  // const sucursalesTakeaway = branches.filter((b) => b.takeaway);

  const sucursalesTakeaway = Array.isArray(branches)
    ? branches.filter((b) => b.takeaway)
    : [];

  return (
    <div className="min-h-screen bg-[#FFF9F5] px-4 py-6 max-w-2xl mx-auto text-[#1A1A1A] font-inter space-y-8">
      <h1 className="text-3xl font-bold mb-8"> Confirmá tu pedido</h1>

      {cart.length === 0 ? (
        <p className="text-gray-500">El carrito está vacío</p>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setOrderMode("takeaway")}
                className={`flex-1 py-2 rounded-full font-bold text-sm ${
                  orderMode === "takeaway"
                    ? "text-red-100 bg-[#E00000] shadow-inner"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                Para retirar
              </button>

              <button
                type="button"
                onClick={() => setOrderMode("delivery")}
                className={`flex-1 py-2 rounded-full font-bold text-sm ${
                  orderMode === "delivery"
                    ? " text-red-100 bg-[#E00000] shadow-inner"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                Delivery
              </button>
            </div>

            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
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
                className="pl-12 w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
                value={customer.phone}
                onChange={(e) => {
                  // Eliminá cualquier carácter que no sea número
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setCustomer((prev) => ({ ...prev, phone: cleaned }));
                }}
              />
            </div>
            {orderMode === "takeaway" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccioná la sucursal para retirar:
                </label>
                <select
                  className="w-full border border-neutral-300 bg-white px-4 py-2 rounded-md text-sm"
                  value={selectedKitchenId || ""}
                  onChange={(e) => {
                    const branch = branches.find(
                      (b) => b.id === e.target.value
                    );
                    setSelectedKitchenId(branch?.id || null);
                    setSelectedKitchenName(branch?.name || null);
                  }}
                >
                  <option value="">Seleccioná una sucursal</option>
                  {sucursalesTakeaway.map((suc) => (
                    <option key={suc.id} value={suc.id}>
                      {suc.name} - {suc.address}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {orderMode === "delivery" && (
              <>
                <AddressInput
                  value={customer.address}
                  onInputChange={(val) =>
                    setCustomer((prev) => ({ ...prev, address: val }))
                  }
                  onSelect={(loc) => {
                    if (!loc || !loc.lat || !loc.lng) return;
                    const updatedCustomer = {
                      ...customer,
                      address: loc.address,
                      lat: loc.lat,
                      lng: loc.lng,
                      isValidAddress: loc.isValidAddress,
                    };
                    setCustomer((prev) => ({
                      ...prev,
                      address: loc.address,
                      lat: loc.lat,
                      lng: loc.lng,
                      isValidAddress: loc.isValidAddress,
                    }));

                    setDireccionConfirmada(true);
                    // calcularEnvio(updatedCustomer);
                  }}
                  onChooseFromMap={() => setShowMapModal(true)}
                  setDireccionConfirmada={setDireccionConfirmada}
                />
                {showMapModal && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] relative">
                      <button
                        onClick={() => setShowMapModal(false)}
                        className="absolute top-3 right-4 text-gray-600 text-xl z-10"
                      >
                        ✕
                      </button>
                      <div className="relative w-full px-4 pb-4 pt-2">
                        <div className="h-[400px] w-full rounded-lg overflow-hidden relative">
                          <Map
                            initialViewState={{
                              longitude: mapCenter.lng,
                              latitude: mapCenter.lat,
                              zoom: 13,
                            }}
                            mapStyle="mapbox://styles/mapbox/light-v10"
                            mapboxAccessToken={
                              process.env.NEXT_PUBLIC_MAPBOX_TOKEN
                            }
                            onMoveEnd={(e) => {
                              const center = e.viewState;
                              const lat = center.latitude;
                              const lng = center.longitude;
                              setMapCenter({ lat, lng });

                              clearTimeout(debounceTimeout.current);
                              debounceTimeout.current = setTimeout(() => {
                                fetch(
                                  `/api/reverse-geocode?lat=${lat}&lng=${lng}`
                                )
                                  .then(async (res) => {
                                    const data = await res.json();
                                    if (!res.ok)
                                      throw new Error(
                                        data.error || "Error desconocido"
                                      );

                                    setMapCandidate({
                                      address: data.address,
                                      lat,
                                      lng,
                                      isValidAddress: true,
                                    });
                                  })
                                  .catch((err) => {
                                    console.error(
                                      "❌ Error en reverse geocoding:",
                                      err.message
                                    );
                                    setMapCandidate(null);
                                    setError(
                                      err.message.includes("Corrientes")
                                        ? "Por ahora solo entregamos en Corrientes Capital. Probá con otra ubicación dentro de la ciudad."
                                        : "No pudimos obtener una dirección válida. Intentá mover el mapa."
                                    );
                                  });
                              }, 600);
                            }}
                          >
                            <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full pointer-events-none h-10 w-10 animate-bounce-soft">
                              <FaLocationDot className="h-10 w-10 text-red-500" />
                            </div>

                            {/* 🏢 Sucursales */}
                            {branches
                              .filter((b) => b.delivery) // ✅ solo las sucursales que tienen delivery habilitado
                              .map((branch) => {
                                const isCercana =
                                  branch.id === selectedKitchenId;
                                return (
                                  <Marker
                                    key={branch.id}
                                    longitude={branch.lng}
                                    latitude={branch.lat}
                                    anchor="bottom"
                                  >
                                    <img
                                      src="/pinn(3).png"
                                      alt="Pin"
                                      className="w-8 h-8"
                                    />
                                  </Marker>
                                );
                              })}
                          </Map>
                        </div>
                      </div>

                      <div className="p-4">
                        {mapCandidate ? (
                          <>
                            <p className="text-sm text-gray-700 mb-2">
                              Dirección seleccionada:
                              <br />
                              <strong>{mapCandidate.address}</strong>
                            </p>

                            <button
                              onClick={() => {
                                const loc = mapCandidate;
                                const updatedCustomer = {
                                  ...customer,
                                  address: loc.address,
                                  lat: loc.lat,
                                  lng: loc.lng,
                                  isValidAddress: loc.isValidAddress,
                                };
                                setCustomer(updatedCustomer);
                                setDireccionConfirmada(true);
                                setShowMapModal(false);
                                calcularEnvio(updatedCustomer);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                            >
                              Aceptar
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 mb-2">
                              Dirección seleccionada:
                              <br />
                              <span className="text-gray-500">
                                Marque en el mapa
                              </span>
                            </p>
                            <button
                              disabled
                              className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                            >
                              Aceptar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-2">
                  <input
                    type="text"
                    placeholder="Piso"
                    value={customer.floor}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        floor: e.target.value,
                      }))
                    }
                    className="w-1/2 border border-neutral-300 px-4 py-2 rounded-md text-base"
                  />
                  <input
                    type="text"
                    placeholder="Dpto"
                    value={customer.apartment}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        apartment: e.target.value,
                      }))
                    }
                    className="w-1/2 border border-neutral-300 px-4 py-2 rounded-md text-base"
                  />
                </div>
                {selectedKitchenId && distanciaSucursal !== null && (
                  <div className="mt-3 text-sm">
                    {shippingCost === 0 ? (
                      <p className="text-green-600">
                        Envío gratuito — Estás a{" "}
                        <strong>{distanciaSucursal.toFixed(1)}km</strong> de
                        nuestro local.
                      </p>
                    ) : (
                      <p className="text-blue-600">
                        Estás a{" "}
                        <strong>{distanciaSucursal.toFixed(1)}km</strong> del
                        local. Se aplica un costo de envío de{" "}
                        <strong>${shippingCost}</strong>.
                      </p>
                    )}
                  </div>
                )}
                {shippingCost === 0 && selectedKitchenId ? (
                  <p className="mt-2 text-sm text-green-700">Envío gratuito</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-700">
                    Envío: ${shippingCost}
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
              </>
            )}
          </div>

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
              <div className="mt-2 space-y-2 ">
                <input
                  type="text"
                  placeholder="Código de cupón"
                  value={cuponInput}
                  onChange={(e) => setCuponInput(e.target.value.toLowerCase())}
                  className="w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
                />
                <button
                  onClick={validarCupon}
                  type="button"
                  className="w-full bg-blue-600 text-white py-2 rounded-md text-sm"
                >
                  Validar cupón
                </button>

                {cuponValido && (
                  <p className="text-black text-sm">✅ {cuponMensaje}</p>
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
            className="w-full border border-neutral-300 px-4 py-2 rounded-md text-sm"
            rows={2}
          />

          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.uid} className="flex justify-between items-start">
                <div className="text-sm leading-tight">
                  <p className="font-bold">{item.attributes.name}</p>
                  <p className="text-neutral-600 text-xs">
                    x{item.quantity} • ${item.attributes.price}
                  </p>
                </div>
                <div className="font-bold text-sm">
                  `${item.attributes.price * item.quantity}`
                </div>
              </div>
            ))}

            <p className="text-right text-sm text-neutral-600">
              Envío: ${shippingCost}
            </p>
            {descuentoFinal > 0 && (
              <p className="text-right text-sm text-green-700">
                Cupón aplicado: -${descuentoFinal}
              </p>
            )}
            <p className="text-right font-bold text-lg">Total: ${total}</p>
          </div>

          <label className="block text-sm font-medium text-gray-700 mt-4">
            Método de pago
          </label>
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full border border-neutral-300 bg-white px-4 py-2 rounded-md text-sm"
          >
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.type}>
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
