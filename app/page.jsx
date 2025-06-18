"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone, Mail, MapPin, MessageCircle, LucideMail } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaMailchimp,
  FaWhatsapp,
} from "react-icons/fa6";

export default function HomePage() {
  const { addItem, toggleCart, cart } = useCart();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [note, setNote] = useState("");
  const [selectedDrinkId, setSelectedDrinkId] = useState("");
  const [includeFries, setIncludeFries] = useState(false);
  const [showDrinkDropdown, setShowDrinkDropdown] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [mensajeHorario, setMensajeHorario] = useState("");
  const [newsMessage, setNewsMessage] = useState("");
  const [webClosed, setWebClosed] = useState(false);
const [showPromo, setShowPromo] = useState(false);

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  useEffect(() => {
    const checkHorario = async () => {
      


      try {
        const now = new Date();
        const hora = now.getHours();
        const minutos = now.getMinutes();
        const totalMinutos = hora * 60 + minutos;

        const dias = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dayIndex = now.getDay();
        const day = dias[dayIndex];
        const prevDay = dias[(dayIndex + 6) % 7];

        const settingsRef = doc(db, "settings", "businessHours");
        const snap = await getDoc(settingsRef);
        const rawData = snap.data();
        console.log("rawData:", rawData);
console.log("rawData.homePromo:", rawData?.homePromo);
        setShowPromo(rawData.homePromo === true);
        if (rawData.homePromo) {
  document.body.classList.add("show-promo");
} else {
  document.body.classList.remove("show-promo");
}

              if (isLocalhost) {
        setIsOpen(true);
        setMensajeHorario("⚠️ Modo desarrollo (ignorado horario)");
        return;
      }



        if (rawData.showNews) {
          setNewsMessage(rawData.news);
        } else {
          setNewsMessage(""); // limpiar si no hay que mostrar
        }
        const configHoy = rawData.businessHours[day];
        const configAyer = rawData.businessHours[prevDay];

        const parseHora = (str) => {
          const [h, m] = str.split(":").map(Number);
          return h * 60 + (m || 0);
        };

        // ⛔ Si webClose está activado, desactivamos todo
        if (rawData.webClose === true) {
          setWebClosed(true);
          setIsOpen(false);
          setMensajeHorario("Actualmente cerrado por mantenimiento.");
          return;
        }
        setWebClosed(false);

        // ⚠️ Verificamos si seguimos abiertos por el horario del día anterior
        if (
          configAyer?.open &&
          configAyer.from &&
          configAyer.to &&
          parseHora(configAyer.to) < parseHora(configAyer.from) &&
          totalMinutos < parseHora(configAyer.to)
        ) {
          setIsOpen(true);
          setMensajeHorario("");
          return;
        }

        // ⚠️ Verificamos si abrimos hoy
        if (!configHoy || !configHoy.open) {
          setIsOpen(false);
          setMensajeHorario(
            rawData.showNews
              ? rawData.news
              : "Hoy no abrimos. Nos vemos mañana!"
          );
          return;
        }

        const apertura = parseHora(configHoy.from);
        const cierre = parseHora(configHoy.to);
        const cruzaMedianoche = cierre < apertura;

        const abierto = cruzaMedianoche
          ? totalMinutos >= apertura || totalMinutos < cierre
          : totalMinutos >= apertura && totalMinutos < cierre;

        setIsOpen(abierto);

        if (abierto) {
          setMensajeHorario("");
        } else {
          if (rawData.showNews) {
            setMensajeHorario(rawData.news);
          } else if (totalMinutos < apertura) {
            setMensajeHorario(`Cerrado, abrimos a las ${configHoy.from} hs.`);
          } else {
            setMensajeHorario("Ya cerramos. Nos vemos mañana!");
          }
        }
      } catch (err) {
        console.error("❌ Error al verificar horario:", err);
        setIsOpen(false);
        setMensajeHorario("⚠️ No pudimos verificar el horario.");
      }
    };

    checkHorario();
    const intervalo = setInterval(checkHorario, 60000); // chequear cada minuto
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const drinksCategory = menu.find((cat) => cat.name === "Bebidas");
  const friesProduct = menu.find((cat) => cat.name === "Papas fritas")
    ?.items?.[0];
  const selectedDrink =
    drinksCategory?.items.find((item) => item.id === selectedDrinkId) || null;

  const finalPrice =
    (selectedItem?.attributes.discountPrice ||
      selectedItem?.attributes.price ||
      0) +
    (selectedDrink?.attributes?.price || 0) +
    (includeFries ? friesProduct?.attributes?.price || 0 : 0);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FFF9F5] font-inter text-[#1A1A1A]">
      {/* HEADER */}
<header
  className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b ${
    showPromo ? "bg-[#E00000]" : "bg-[#FFF9F5]/90 backdrop-blur-md"
  }`}
>
  <img
    src={
      showPromo
        ? "https://res.cloudinary.com/dsbrnqc5z/image/upload/v1747913968/Versi%C3%B3n_principal_2_d3jz2q.png"
        : "https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744755147/Versi%C3%B3n_principal_xer7zs.svg"
    }
    alt="MORDISCO"
    className="h-8"
  />

  <button
    onClick={toggleCart}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-bold transition hover:scale-105 ${
      showPromo
        ? "bg-white text-[#E00000]"
        : "bg-[#E00000] text-white"
    }`}
  >
    <span>Mi pedido</span>
    {totalItems > 0 && (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
          showPromo ? "bg-[#E00000] text-white" : "bg-white text-[#E00000]"
        }`}
      >
        {totalItems}
      </span>
    )}
  </button>
</header>

{showPromo && (
  <section
    className="relative bg-[#E00000] -mt-16 text-white px-6 py-8 flex items-center justify-between rounded-br-3xl rounded-bl-[25%]"
    style={{ height: "50vh" }}
  >
    <div className="max-w-md space-y-2">
      <h1 className="text-3xl font-extrabold leading-tight">
        ¡Hasta 20% OFF!
      </h1>
      <p className="text-sm text-white/90">
        Por tiempo limitado!.
      </p>

    </div>
    <img
      src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1749238288/DSC03746_1_-removebg-preview_hzef4r.png"
      alt="Hamburguesa promo"
      className="w-[550px] ml-10 sm:w-52 lg:w-64 drop-shadow-xl"
    />
  </section>
)}


      {/* CONTENIDO */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-50">
            <motion.img
              src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744757019/Recurso_40_zti0fq.svg"
              alt="MORDISCO"
              className="h-36 w-auto"
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 2,
              }}
            />
          </div>
        ) : (
          <>
            {menu
              .slice()
              .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
              .map((cat) => {
                const availableItems =
                  cat.items?.filter((item) => item.attributes?.available) || [];
                if (availableItems.length === 0) return null;

                return (
                  <section key={cat.id} className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#E00000] font-[BricolageExtraBold]">
                      {cat.name}
                    </h2>
                    <ul className="space-y-4">
                      {availableItems.map((item) => (
                        <li
                          key={item.id}
                          onClick={() =>
                            isOpen && !webClosed ? setSelectedItem(item) : null
                          }
                          className={`flex gap-4 items-center p-2 rounded-lg transition cursor-pointer hover:bg-neutral-100 ${
                            !isOpen || webClosed
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <div className="relative w-[96px] h-[96px] rounded-lg overflow-hidden bg-neutral-100">
                            {item.attributes.image ? (
                              <img
                                src={item.attributes.image}
                                alt={item.attributes.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-sm text-neutral-400">
                                Sin imagen
                              </div>
                            )}
                            {item.attributes.hasDiscount && (
                              <div className="absolute top-1 right-1 bg-green-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                -{item.attributes.discountPercent}%
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            <h3 className="text-base font-bold text-[#1A1A1A] truncate">
                              {item.attributes.name}
                            </h3>
                            {item.attributes.description && (
                              <p className="text-sm text-neutral-600 line-clamp-2">
                                {item.attributes.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-col">
                                {item.attributes.hasDiscount ? (
                                  <>
                                    <span className="text-[#E00000] font-bold text-sm">
                                      ${item.attributes.discountPrice}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      ${item.attributes.price}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[#E00000] font-bold text-sm">
                                    ${item.attributes.price}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOpen && !webClosed)
                                    setSelectedItem(item);
                                }}
                                disabled={!isOpen || webClosed}
                                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all
    ${
      isOpen
        ? "bg-[#E00000] hover:bg-[#C40000] text-white"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }
  `}
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

            <footer className="bg-[#FFF9F5] border-t border-neutral-200 mt-16 px-6 py-10 text-sm text-neutral-600">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 text-neutral-700" />
                  <div>
                    <p>Santa Fe 1583, Corrientes Capital, Argentina</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LucideMail className="w-5 h-5 mt-1 text-neutral-700" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      Email
                    </p>
                    <p>consultas@mordiscoburgers.com.ar</p>
                  </div>
                </div>

                <div className="flex items-center justify-start gap-6 mt-4">
                  <a
                    href="https://wa.me/5493794055152"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
                  </a>
                  <a
                    href="https://instagram.com/mordisco.arg"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="w-5 h-5 text-[#E1306C]" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61575119946351"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <FaFacebook className="w-5 h-5 text-[#1877F2]" />
                  </a>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {isOpen && <CartSidebar />}
      {/* MODAL DE EXTRAS */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="add-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl space-y-4 text-left"
            >
              <h3 className="text-xl font-bold text-[#1A1A1A]">
                {selectedItem.attributes.name}
              </h3>

              {selectedItem.attributes.description && (
                <p className="text-sm text-neutral-600">
                  {selectedItem.attributes.description}
                </p>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium mt-5 mb-1 text-[#1A1A1A]">
                  Observaciones
                </label>
                <textarea
                  className="w-full border rounded p-2 text-base"
                  placeholder="Ej: sin lechuga, sin tomate.."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Total */}
              <div className="text-right text-sm font-semibold text-[#1A1A1A]">
                Total: ${finalPrice}
              </div>

              {/* Botones */}
              <div className="space-y-2">
                <div className="w-full flex justify-center items-center">
                  <button
                    onClick={() => {
                      const extras = {
                        drink: selectedDrink
                          ? {
                              id: selectedDrink.id,
                              name: selectedDrink.attributes.name,
                              price: selectedDrink.attributes.price,
                            }
                          : null,
                        fries: includeFries,
                      };
                      addItem({
                        ...selectedItem,
                        attributes: {
                          ...selectedItem.attributes,
                          price: finalPrice,
                          note,
                          extras,
                        },
                      });
                      setSelectedItem(null);
                      setNote("");
                      setSelectedDrinkId("");
                      setIncludeFries(false);
                      setShowDrinkDropdown(false);
                    }}
                    className="w-[50%] bg-[#E00000] hover:bg-[#C40000] text-white py-3 rounded-full font-bold text-sm"
                  >
                    Agregar al pedido
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setNote("");
                    setSelectedDrinkId("");
                    setIncludeFries(false);
                    setShowDrinkDropdown(false);
                  }}
                  className="w-full text-sm text-neutral-500 text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
