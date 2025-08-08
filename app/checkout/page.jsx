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
import { ArrowLeft, ArrowLeftFromLine } from "lucide-react";
import {
  Description,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Switch,
  SwitchDescription,
} from "@headlessui/react";

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

  const [branches, setBranches] = useState([]);
  const [orderMode, setOrderMode] = useState(null);
  const [cuponMensaje, setCuponMensaje] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

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
      const sucursalesTakeaway = branches.filter((b) => b.takeaway);
      if (sucursalesTakeaway.length === 1) {
        const unica = sucursalesTakeaway[0];
        setSelectedKitchenId(unica.id);
        setSelectedKitchenName(unica.name);
      }
      setShippingCost(0);
      setDireccionConfirmada(false);
      setDistanciaSucursal(null);
    } else {
      if (customer.lat && customer.lng) {
        calcularEnvio(customer);
      }
    }
  }, [orderMode, branches]);

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
        setError(
          "Te pedimos disculpas, la dirección ingresada está fuera de nuestra zona de envíos."
        );
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

    if (
      orderMode === "takeaway" &&
      (!customer.phone || customer.phone.length < 10)
    ) {
      setWarningMessage(
        "Por favor ingresá tu número para que te avisemos cuando esté listo el pedido."
      );
      setShowWarningModal(true);
      setLoading(false);
      return;
    }

    if (!customer.name || customer.name.trim().length === 0) {
      setWarningMessage("Por favor ingresá tu nombre y apellido.");
      setShowWarningModal(true);
      setLoading(false);
      return;
    }

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
    if (!selectedKitchenId) {
      setError("No hay sucursales disponibles para delivery en tu zona.");
      setLoading(false);
      return;
    }
    if (
      orderMode === "takeaway" &&
      (!customer.phone || customer.phone.length < 10)
    ) {
      alert(
        "Por favor ingresá tu número para que te avisemos cuando esté listo el pedido."
      );
      setLoading(false);
      return;
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
      // cart: cart.map((item) => ({
      //   id: item.id,
      //   name: item.attributes.name, // ✅ nombre del producto
      //   quantity: item.quantity,
      //   price: item.attributes.price,
      //   discountPrice: item.discountPrice || item.attributes.price,
      //   note: item.attributes.note || "", // ✅ incluir observaciones
      //   extras: item.attributes.extras || null, //
      //   medallones: item.attributes.medallones || 0,
      //   isBurger: item.attributes.isBurger || false,
      //   size: item.attributes.size || "",
      //   productType: item.attributes.productType || "",
      // })),

      cart: cart.map((item) => {
    const base = {
      id: item.id,
      name: item.attributes.name,
      quantity: item.quantity,
      price: item.attributes.price,
      discountPrice: item.discountPrice || item.attributes.price,
      note: item.attributes.note || "",
      extras: item.attributes.extras || null,

      // <- estos campos para productos “simples”
      medallones: item.attributes.medallones || 0,
      isBurger: item.attributes.isBurger || false,
      size: item.attributes.size || "",
      productType: item.attributes.productType || "",
    };

    // <- conservar estructura de combo
    if (item.attributes.isCombo) {
      base.isCombo = true;
      base.comboItems = (item.attributes.comboItems || []).map((ci) => ({
        productId: ci.id || ci.productId,
        name: ci.name || "",
        quantity: ci.quantity || 1,
        isBurger: !!ci.isBurger,
        medallones: ci.medallones || 0,
        size: ci.size || "",
        productType: ci.productType || "",
      }));
    }

    return base;
  }),
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
      <h1 className="text-3xl font-bold mb-8">Confirmá tu pedido</h1>
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4">Atención</h2>
            <p className="text-sm text-gray-700 mb-4">{warningMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="bg-red-600 text-white py-2 px-6 rounded-full font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {orderMode === null ? (
        <div className="space-y-4 text-center">
          <div className="w-full flex justify-start">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="py-3 px-6 rounded-full font-bold text-sm bg-[#E00000] text-white"
            >
              <ArrowLeft />
            </button>
          </div>
          <p className="text-gray-600 text-lg font-medium mb-10">
            ¿Cómo querés recibir tu pedido?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setOrderMode("takeaway")}
              className="py-3 px-6 w-48 rounded-full font-bold text-sm bg-[#E00000] text-white"
            >
              Para retirar
            </button>
            <button
              type="button"
              onClick={() => setOrderMode("delivery")}
              className="py-3 px-6 w-48 rounded-full font-bold text-sm bg-[#E00000] text-white"
            >
              Delivery
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setOrderMode(null)}
              className="text-sm text-white font-bold bg-[#E00000] rounded-xl py-2 px-3 row flex gap-2 justify-center items-center"
            >
              <ArrowLeftFromLine /> Cambiar a{" "}
              {orderMode === "delivery" ? "takeaway" : "Delivery"}
            </button>
            <h2 className="text-xl font-semibold">
              {orderMode === "delivery" ? "Delivery" : "Takeaway"}
            </h2>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500">El carrito está vacío</p>
          ) : (
            <>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-500 text-sm">
                    +54
                  </span>
                  <input
                    type="tel"
                    placeholder="Ej: 3794123456"
                    className="pl-12 w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
                    value={customer.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      setCustomer((prev) => ({ ...prev, phone: cleaned }));
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 ml-2 -mt-3">
                  (Ingresá tu número sin 0 ni 15)
                </p>

                {orderMode === "takeaway" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seleccioná la sucursal para retirar:
                    </label>
                    <Listbox
                      value={selectedKitchenId}
                      onChange={setSelectedKitchenId}
                    >
                      <div className="relative">
                        <ListboxButton className="w-full  border border-neutral-300 rounded-md px-4 py-2 text-left">
                          {selectedKitchenName || "Seleccioná una sucursal"}
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 w-full rounded-md bg-white shadow-lg z-10">
                          {branches
                            .filter((b) => b.takeaway)
                            .map((branch) => (
                              <ListboxOption
                                key={branch.id}
                                value={branch.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {branch.name} - {branch.address}
                              </ListboxOption>
                            ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
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
                        setCustomer((prev) => ({
                          ...prev,
                          address: loc.address,
                          lat: loc.lat,
                          lng: loc.lng,
                          isValidAddress: loc.isValidAddress,
                        }));
                        setDireccionConfirmada(true);
                      }}
                      onChooseFromMap={() => setShowMapModal(true)}
                      setDireccionConfirmada={setDireccionConfirmada}
                    />
                    {error && (
                      <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm mt-3">
                        {error}
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
                            <strong>{distanciaSucursal.toFixed(1)}km</strong>{" "}
                            del local. Se aplica un costo de envío de{" "}
                            <strong>${shippingCost}</strong>.
                          </p>
                        )}
                      </div>
                    )}
                    {shippingCost === 0 && selectedKitchenId ? (
                      <p className="mt-2 text-sm text-green-700">
                        Envío gratuito
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-700">
                        Envío: ${shippingCost}
                      </p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">
                    ¿Tenés un cupón?
                  </span>
                  <Switch
                    checked={tieneCupon}
                    onChange={setTieneCupon}
                    className={`${tieneCupon ? "bg-red-600" : "bg-gray-300"}
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                  >
                    <span
                      className={`${
                        tieneCupon ? "translate-x-6" : "translate-x-1"
                      }
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>

                {tieneCupon && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Código de cupón"
                      value={cuponInput}
                      onChange={(e) =>
                        setCuponInput(e.target.value.toLowerCase())
                      }
                      className="w-full border border-neutral-300 px-4 py-2 rounded-md text-base"
                    />
                    <button
                      onClick={validarCupon}
                      type="button"
                      className="w-full bg-[#E00000] text-white py-2 rounded-md text-sm"
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

                <textarea
                  placeholder="Observaciones de dirección (dpto, casa, piso, etc.)"
                  value={customer.observaciones || ""}
                  onChange={(e) =>
                    setCustomer((c) => ({
                      ...c,
                      observaciones: e.target.value,
                    }))
                  }
                  className="w-full border border-neutral-300 px-4 py-2 rounded-md text-sm"
                  rows={2}
                />

                <div className="space-y-4 mb-8">
                  {cart.map((item) => (
                    <div
                      key={item.uid}
                      className="flex justify-between items-start"
                    >
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
                  <p className="text-right text-sm text-neutral-600">
                    Envío: ${shippingCost}
                  </p>
                  {descuentoFinal > 0 && (
                    <p className="text-right text-sm text-green-700">
                      Cupón aplicado: -${descuentoFinal}
                    </p>
                  )}
                  <p className="text-right font-bold text-lg">
                    Total: ${total}
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">
                  Método de pago
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="bg-transparent w-full border border-neutral-300  px-4 py-2.5 rounded-md text-base font-inter"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.type}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSubmit}
                  disabled={loading || cart.length === 0 || !!error}
                  className="w-full bg-[#E00000] hover:bg-[#C40000] text-white py-3 rounded-full font-bold mt-4 disabled:bg-gray-300 transition"
                >
                  {loading ? "Enviando pedido..." : "Confirmar y enviar"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
