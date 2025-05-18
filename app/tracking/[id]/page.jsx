// app/tracking/[id]/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Marker, NavigationControl } from "react-map-gl/mapbox";

const Map = dynamic(() => import("react-map-gl/mapbox").then((mod) => mod.default), { ssr: false });

export default function TrackingPage() {
  const { id: trackingId } = useParams();
  const ws = useRef(null);
  const [location, setLocation] = useState(null);

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
      } catch (err) {
        console.error("❌ Error al parsear mensaje del WebSocket:", err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [trackingId]);

  return (
    <div className="w-full h-screen">
      {location ? (
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
            <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-md" />
          </Marker>
          <NavigationControl position="top-left" />
        </Map>
      ) : (
        <div className="text-center mt-10 text-gray-500">
          Esperando ubicación del repartidor...
        </div>
      )}
    </div>
  );
}
