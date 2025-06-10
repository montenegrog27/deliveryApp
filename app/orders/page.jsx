"use client";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone, Mail, MapPin, MessageCircle, LucideMail } from "lucide-react";
import { FaFacebook, FaInstagram, FaMailchimp, FaWhatsapp } from "react-icons/fa6";

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

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  useEffect(() => {
    const checkHorario = async () => {
      if (isLocalhost) {
        setIsOpen(true);
        setMensajeHorario("⚠️ Modo desarrollo (ignorado horario)");
        return;
      }
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
        console.log(rawData);
        const configHoy = rawData.businessHours[day];
        const configAyer = rawData.businessHours[prevDay];

        const parseHora = (str) => {
          const [h, m] = str.split(":").map(Number);
          return h * 60 + (m || 0);
        };

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
          setMensajeHorario("Hoy no abrimos. Nos vemos mañana!");
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
          if (totalMinutos < apertura) {
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
   
    </div>
  );
}
