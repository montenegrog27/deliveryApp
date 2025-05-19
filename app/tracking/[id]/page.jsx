"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Marker, NavigationControl } from "react-map-gl/mapbox";

const Map = dynamic(
  () => import("react-map-gl/mapbox").then((mod) => mod.default),
  { ssr: false }
);

export default function TrackingPage() {
  const { id: trackingId } = useParams();
  const ws = useRef(null);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("preparing"); // default fallback

  useEffect(() => {
    if (!trackingId) return;

    ws.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: "join", trackingId }));
    };

    ws.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "update" && data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng });
        }

        if (data.type === "status" && data.status) {
          setStatus(data.status);
        }
      } catch (err) {
        console.error("❌ Error al parsear mensaje del WebSocket:", err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [trackingId]);

  const renderMessage = () => {
    switch (status) {
      case "preparing":
        return "Estamos preparando tu pedido...";
      case "ready_to_send":
        return "Tu pedido ya está listo y esperando un rider...";
      case "sent":
        return null; // mapa activo
      case "delivered":
        return "✅ Pedido entregado con éxito. ¡Que lo disfrutes!";
      default:
        return "Procesando estado de tu pedido...";
    }
  };

  return (
    <div className="w-full h-screen bg-gray-950 text-white flex flex-col">
      {status !== "sent" ? (
        <div className="flex items-center justify-center h-full text-center px-6">
          <div className="text-xl font-medium text-gray-300">
            {renderMessage()}
          </div>
        </div>
      ) : location ? (
        <Map
          initialViewState={{
            latitude: location.lat,
            longitude: location.lng,
            zoom: 15,
          }}
          mapStyle="mapbox://styles/mapbox/navigation-night-v1"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
        >
          <Marker longitude={location.lng} latitude={location.lat}>
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-xl animate-ping" />
          </Marker>
          <NavigationControl position="top-left" />
        </Map>
      ) : (
        <div className="text-center mt-10 text-gray-400">
          Esperando ubicación del repartidor...
        </div>
      )}
    </div>
  );
}
