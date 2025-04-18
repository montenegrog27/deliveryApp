"use client";
import { useState } from "react";

export default function AddressInput({ onSelect, setDireccionConfirmada }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInput = async (value) => {
    setQuery(value);
    if (value.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        }&autocomplete=true&country=AR&bbox=-58.87,-27.51,-58.775,-27.43&limit=5`
      );

      const data = await res.json();

      console.log(
        "📦 Mapbox features:",
        data.features.map((f) => f.place_name)
      );

      const filtered = data.features.filter((f) =>
        f.context?.some(
          (c) =>
            c.id.includes("place") &&
            (c.text === "Corrientes" || c.text === "Corrientes Capital")
        )
      );

      setResults(filtered);
    } catch (err) {
      console.error("❌ Error buscando dirección:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place) => {
    const hasStreetNumber = place.context?.some(
      (ctx) => ctx.id.startsWith("address") || ctx.id.startsWith("place")
    );

    // También podés verificar si `place.address` existe:
    const isValid = !!place.address || hasStreetNumber;

    setQuery(place.place_name);
    setResults([]);

    onSelect({
      address: place.place_name,
      lat: place.center[1],
      lng: place.center[0],
      isValidAddress: isValid, // 👈 lo usamos luego para validar en el checkout
    });

    if (setDireccionConfirmada) setDireccionConfirmada(true);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Ingresá tu dirección"
        value={query}
        onChange={(e) => {
          handleInput(e.target.value);
          setDireccionConfirmada(false); // pierde validez hasta que vuelva a seleccionar
        }}
        className="w-full border rounded-lg px-4 py-2 text-sm"
      />

      {loading && (
        <div className="absolute top-1 right-2 animate-pulse">
          <img
            src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744817613/Avatar_inicial_tbpnzy.svg"
            alt="Cargando..."
            className="w-6 h-6"
          />
        </div>
      )}

      {results.length > 0 && (
        <ul className="absolute bg-white border rounded-lg mt-1 shadow w-full z-10">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(r)}
            >
              {r.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
