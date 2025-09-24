"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, CirclePlus } from "lucide-react";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone, Mail, MapPin, MessageCircle, LucideMail } from "lucide-react";
import {
  FaCirclePlus,
  FaFacebook,
  FaInstagram,
  FaMailchimp,
  FaWhatsapp,
} from "react-icons/fa6";
import CategoryNav from "@/components/CategoryNav";
import CategoryCards from "@/components/CategoryCards";
import IngredientNotes from "@/components/IngredientNotes";


  const Toast = ({ show, message }) => (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 0.9, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          // className="fixed bottom-1/5 left-1/2 transform -translate-x-1/2 bg-[#E00000] text-white font-bold text-sm flex items-center gap-3 py-3 px-5 rounded-2xl shadow-2xl z-50"
  className="fixed bottom-1/5 left-1/2 transform -translate-x-1/2 
             w-[90%] max-w-[600px] bg-[#E00000] text-white 
             py-3 px-5 rounded-2xl shadow-2xl z-50
             flex items-center justify-center gap-3 text-center"
>
  <CheckCircle className="w-6 h-6 text-white" />
  <span className="text-sm font-bold">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );


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
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [timeDiscountPercent, setTimeDiscountPercent] = useState(0);
  const [activeTimeDiscountName, setActiveTimeDiscountName] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(
    "Producto agregado al carrito"
  );
  const [selectedFixedExtras, setSelectedFixedExtras] = useState([]);

  const cardsRef = useRef(null);
  const sectionRefs = useRef({});



  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyNav(!entry.isIntersecting);
      },
      {
        rootMargin: "-80px 0px 0px 0px", // ajusta según alto de tu header
        threshold: 0,
      }
    );

    const node = cardsRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

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
          setMensajeHorario("Actualmente cerrado por demoras, volvemos en 15 min.");
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
        try {
          const q = query(
            collection(db, "timeDiscounts"),
            where("active", "==", true)
          );
          const snap = await getDocs(q);
          const now = new Date();

          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const start = data.startTime.toDate();
            const end = data.endTime.toDate();

            if (now >= start && now <= end) {
              if (data.percentage > 0) {
                setTimeDiscountPercent(data.percentage);
                setActiveTimeDiscountName(data.name); // 👈 nombre visible
                const diff = end - now;
                updateTimeLeft(diff);
                startCountdown(end); // 👈 inicia cuenta regresiva
                break;
              }
            }
          }
        } catch (err) {
          console.error("❌ Error al verificar descuentos por horario:", err);
        }
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);
  function updateTimeLeft(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setTimeLeft(`${minutes}m ${seconds}s`);
  }
  function startCountdown(endTime) {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("Finalizado");
        setActiveTimeDiscountName("");
        clearInterval(interval);
      } else {
        updateTimeLeft(diff);
      }
    }, 1000);
  }

  const drinksCategory = menu.find((cat) => cat.name === "Bebidas");
  const friesProduct = menu.find((cat) => cat.name === "Papas fritas")
    ?.items?.[0];
  const selectedDrink =
    drinksCategory?.items.find((item) => item.id === selectedDrinkId) || null;

  // const finalPrice =
  //   (selectedItem?.attributes.discountPrice ||
  //     selectedItem?.attributes.price ||
  //     0) +
  //   (selectedDrink?.attributes?.price || 0) +
  //   (includeFries ? friesProduct?.attributes?.price || 0 : 0);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const basePrice = selectedItem?.attributes.price || 0;

  const discountPrice = selectedItem?.attributes.hasDiscount
    ? selectedItem.attributes.discountPrice
    : timeDiscountPercent > 0
    ? Math.round(basePrice * (1 - timeDiscountPercent / 100))
    : basePrice;

  // const finalPrice =
  //   discountPrice +
  //   (selectedDrink?.attributes?.price || 0) +
  //   (includeFries ? friesProduct?.attributes?.price || 0 : 0);

  const fixedExtrasTotal = selectedFixedExtras.reduce(
    (acc, extra) => acc + (extra?.price || 0),
    0
  );

  const finalPrice =
    discountPrice +
    (selectedDrink?.attributes?.price || 0) +
    (includeFries ? friesProduct?.attributes?.price || 0 : 0) +
    fixedExtrasTotal;

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
            showPromo ? "bg-white text-[#E00000]" : "bg-[#E00000] text-white"
          }`}
        >
          <span>Mi pedido</span>
          {totalItems > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                showPromo
                  ? "bg-[#E00000] text-white"
                  : "bg-white text-[#E00000]"
              }`}
            >
              {totalItems}
            </span>
          )}
        </button>
      </header>
      {activeTimeDiscountName && timeLeft && (
        <div className="bg-green-100 text-green-800 text-center py-2 px-4 font-semibold text-sm">
          🕒 <span className="font-bold">{activeTimeDiscountName}</span> Termina
          en {timeLeft}
        </div>
      )}

      {newsMessage && (
        <div className="bg-blue-100 text-blue-800 text-center py-2 px-4">
          {newsMessage}
        </div>
      )}
      {mensajeHorario && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 px-4">
          {mensajeHorario}
        </div>
      )}
      {showPromo && (
        <section
          className="relative bg-[#E00000] -mt-25 text-white px-6 py-8 flex items-center justify-between rounded-br-3xl rounded-bl-[25%]"
          style={{ height: "50vh" }}
        >
          <div className="max-w-md min-w-[200px] -mr-15  space-y-2 ">
            <h1 className="text-3xl font-extrabold leading-tight font-[BricolageExtraBold]">
              MES APERTURA
            </h1>
            <p className="text-sm text-white/90">¡Sorpresas todos los días!</p>
          </div>
          <img
            src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1749238288/DSC03746_1_-removebg-preview_hzef4r.png"
            alt="Hamburguesa promo"
            className="w-[550px] ml-10 sm:w-52 lg:w-64 drop-shadow-xls"
          />
        </section>
      )}
      <Toast show={showToast} message={toastMessage} />

      {/* CONTENIDO */}
      <main className="max-w-3xl mx-auto px-4 pb-8 pt-3 space-y-16">
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
            <section className="sticky bg-[#FFF9F5] w-screen -ml-4 z-90  top-[60px] z- mb-1 pb-1">
              <CategoryCards
                categories={menu}
                onSelect={(id) => {
                  const ref = sectionRefs.current[id];
                  if (ref) {
                    const yOffset = -120; // puede ser -70 o lo que mida tu sticky header
                    const y =
                      ref.getBoundingClientRect().top +
                      window.pageYOffset +
                      yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
              />
            </section>
            {showStickyNav && (
              <CategoryNav categories={menu} sectionRefs={sectionRefs} />
            )}{" "}
            {/* {menu
              .slice()
              .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
              .map((cat) => {
                const availableItems =
                  cat.items?.filter((item) => item.attributes?.available) || [];
                if (availableItems.length === 0) return null;

                return (
                  <section
                    key={cat.id}
                    ref={(el) => {
                      sectionRefs.current[cat.id] = el;
                    }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-[#E00000] font-[BricolageExtraBold]">
                      {cat.name}
                    </h2>
                    <ul className="space-y-4">
                      {availableItems.map((item) => ( */}
            {menu
              .slice()
              .sort((a, b) => (a.inOrder ?? 0) - (b.inOrder ?? 0))
              .map((cat, index) => {
                const availableItems =
                  cat.items?.filter((item) => item.attributes?.available) || [];
                if (availableItems.length === 0) return null;

                return (
                  <section
                    key={cat.id}
                    ref={(el) => {
                      sectionRefs.current[cat.id] = el;
                    }}
                    className={`space-y-6 ${
                      index === 0
                        ? "bg-[#E00000] text-white rounded-xl -mx-1 p-4 my-2"
                        : "mt-4"
                    }`}
                  >
                    <h2
                      className={`text-2xl font-bold font-[BricolageExtraBold] ${
                        index === 0 ? "text-white" : "text-[#E00000]"
                      }`}
                    >
                      {cat.name}
                    </h2>

                    <ul className="space-y-1">
                      {availableItems.map((item) => (
                        <li
                          key={item.id}
                          onClick={() =>
                            isOpen && !webClosed ? setSelectedItem(item) : null
                          }
                          className={`flex  p-1 gap-4 items-center bg-neutral-100 p- rounded-lg transition cursor-pointer hover:bg-neutral-100 ${
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
                            {(item.attributes.hasDiscount ||
                              timeDiscountPercent > 0) && (
                              <div className="absolute top-1 right-1 bg-green-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                -
                                {item.attributes.hasDiscount
                                  ? item.attributes.discountPercent
                                  : timeDiscountPercent}
                                %
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            {/* 🔴 Nombre: blanco si es la primera categoría */}
                            <h3
                              className={`text-base font-bold truncate ${
                                index === 0 ? "text-black" : "text-[#1A1A1A]"
                              }`}
                            >
                              {item.attributes.name}
                            </h3>

                            {/* 🔴 Descripción: blanco opaco si es la primera categoría */}
                            {item.attributes.description && (
                              <p
                                className={`text-sm line-clamp-2 ${
                                  index === 0
                                    ? "text-neutral-800"
                                    : "text-neutral-600"
                                }`}
                              >
                                {item.attributes.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-col">
                                {item.attributes.hasDiscount ? (
                                  <>
                                    <span
                                      className={`font-bold text-sm ${
                                        index === 0
                                          ? "text-black"
                                          : "text-[#E00000]"
                                      }`}
                                    >
                                      ${item.attributes.discountPrice}
                                    </span>
                                    <span
                                      className={`text-xs line-through ${
                                        index === 0
                                          ? "text-neutral-800"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      ${item.attributes.price}
                                    </span>
                                  </>
                                ) : timeDiscountPercent > 0 ? (
                                  <>
                                    <span
                                      className={`font-bold text-sm ${
                                        index === 0
                                          ? "text-neutral-800"
                                          : "text-[#E00000]"
                                      }`}
                                    >
                                      $
                                      {Math.round(
                                        item.attributes.price *
                                          (1 - timeDiscountPercent / 100)
                                      )}
                                    </span>
                                    <span
                                      className={`text-xs line-through ${
                                        index === 0
                                          ? "text-white/80"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      ${item.attributes.price}
                                    </span>
                                  </>
                                ) : (
                                  <span
                                    className={`font-bold text-md ${
                                      index === 0
                                        ? "text-[#E00000]"
                                        : "text-[#E00000]"
                                    }`}
                                  >
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
                                className={`text-sm font-semibold px- py- rounded-full transition-all
            ${
              isOpen
                ? "  text-white font-bold"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
                              >
                                <FaCirclePlus
                                  className={`w-6 h-6 ${
                                    index === 0
                                      ? "text-[#E00000]"
                                      : "text-[#E00000]"
                                  }`}
                                />
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
                <p className="text-transparent">unmordiscopls@gmail.com</p>

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
            className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center px-4"
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

              <div>
                <label className="block text-sm font-medium mt-5 mb-1 text-[#1A1A1A]">
                  Observaciones
                </label>
                <textarea
                  className="w-full border rounded p-2 text-base"
                  placeholder="Ej: sin lechuga, sin tomate..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {selectedItem && (
                  <IngredientNotes
                    productId={selectedItem.id}
                    currentNote={note}
                    onAddNote={(newNote) => {
                      setNote((prev) => {
                        const notes = prev.split(", ").filter(Boolean);
                        if (notes.includes(newNote)) {
                          return notes.filter((n) => n !== newNote).join(", ");
                        } else {
                          return [...notes, newNote].join(", ");
                        }
                      });
                    }}
                    onExtrasChange={(extras) => setSelectedFixedExtras(extras)}
                  />
                )}
              </div>

              {/* Total */}
              <div className="text-right text-sm font-semibold text-[#1A1A1A]">
                Total: ${finalPrice}
              </div>

              {/* Botones */}
              <div className="space-y-2">
                <div className="w-full flex justify-center items-center">
                  <button
                    // onClick={() => {
                    //   const extras = {
                    //     drink: selectedDrink
                    //       ? {
                    //           id: selectedDrink.id,
                    //           name: selectedDrink.attributes.name,
                    //           price: selectedDrink.attributes.price,
                    //         }
                    //       : null,
                    //     fries: includeFries,
                    //       additions: selectedFixedExtras, // 👈 esto faltaba
                    //   };
                    //   const extrasObservacion = selectedFixedExtras
                    //     .map((e) => `+ ${e.name}`)
                    //     .join(", ");
                    //   const notaFinal = [note.trim(), extrasObservacion]
                    //     .filter(Boolean)
                    //     .join(" | ");

                    //   addItem({
                    //     ...selectedItem,
                    //     attributes: {
                    //       ...selectedItem.attributes,
                    //       price: finalPrice,
                    //       note: notaFinal, // 👈 aquí usamos la nota combinada
                    //       extras,
                    //     },
                    //   });
                    //   setToastMessage("Producto agregado al carrito");
                    //   setShowToast(true);
                    //   setTimeout(() => setShowToast(false), 2000);

                    //   setSelectedItem(null);
                    //   setNote("");
                    //   setSelectedDrinkId("");
                    //   setIncludeFries(false);
                    //   setShowDrinkDropdown(false);
                    // }}
                    onClick={async () => {
  try {
    const productSnap = await getDoc(doc(db, "products", selectedItem.id));
    if (!productSnap.exists()) throw new Error("Producto no encontrado");

    const productData = productSnap.data();

    let comboItems = [];

    if (productData.isCombo && Array.isArray(productData.comboItems)) {
      for (const sub of productData.comboItems) {
        const subSnap = await getDoc(doc(db, "products", sub.productId));
        if (!subSnap.exists()) continue;

        const subData = subSnap.data();

        comboItems.push({
          id: sub.productId,
          name: subData.name,
          quantity: sub.quantity,
          medallones: subData.medallones || 0,
          isBurger: subData.isBurger || false,
          size: subData.size || "",
          productType: subData.productType || "",
        });
      }
    }

    const extras = {
      drink: selectedDrink
        ? {
            id: selectedDrink.id,
            name: selectedDrink.attributes.name,
            price: selectedDrink.attributes.price,
          }
        : null,
      fries: includeFries,
      additions: selectedFixedExtras,
    };

    const extrasObservacion = selectedFixedExtras
      .map((e) => `+ ${e.name}`)
      .join(", ");

    const notaFinal = [note.trim(), extrasObservacion]
      .filter(Boolean)
      .join(" | ");

    addItem({
      ...selectedItem,
      attributes: {
        ...selectedItem.attributes,
        price: finalPrice,
        note: notaFinal,
        extras,
        isBurger: productData.isBurger || false,
        medallones: productData.medallones || 0,
        size: productData.size || "",
        productType: productData.productType || "",
        isCombo: productData.isCombo || false,
        comboItems: comboItems.length > 0 ? comboItems : undefined,
      },
    });

    setToastMessage("Producto agregado al carrito");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    setSelectedItem(null);
    setNote("");
    setSelectedDrinkId("");
    setIncludeFries(false);
    setShowDrinkDropdown(false);
  } catch (err) {
    console.error("❌ Error al agregar producto al carrito:", err);
    setToastMessage("Error al agregar el producto");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }
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
