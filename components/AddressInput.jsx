"use client";
import { useState } from "react";

export default function AddressInput({
  value,
  onSelect,
  onInputChange,
  setDireccionConfirmada,
  onChooseFromMap,
}) {
  const [results, setResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleInput = async (val) => {
    setDireccionConfirmada?.(false);
    if (val.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          val
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        }&autocomplete=true&country=AR&bbox=-58.87,-27.51,-58.775,-27.43&limit=5`
      );
      const data = await res.json();

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
    }
  };

  const confirmSelection = (place) => {
    setResults([]);
    setSelectedCandidate(null);
    onSelect(place);
    setDireccionConfirmada?.(true);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Ingresá tu dirección"
          value={value}
          onChange={(e) => {
            handleInput(e.target.value);
            onInputChange?.(e.target.value);
          }}
          className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-base pr-10"
        />

        {value?.length > 0 && (
          <button
            onClick={() => {
              onSelect({ address: "", lat: null, lng: null, isValidAddress: false });
              setResults([]);
              setSelectedCandidate(null);
              setDireccionConfirmada?.(false);
              onInputChange?.(""); // borra el input
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
          >
            ✕
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute border border-neutral-300 rounded-lg mt-1 shadow w-full z-10 bg-white">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b"
              onClick={() =>
                confirmSelection({
                  address: r.place_name,
                  lat: r.center[1],
                  lng: r.center[0],
                  isValidAddress: true,
                })
              }
            >
              {r.place_name}
            </li>
          ))}
          <li
            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer text-blue-600"
            onClick={() => {
              onChooseFromMap?.();
              setResults([]);
              setSelectedCandidate({ fromMap: true }); // solo si viene del mapa
            }}
          >
            📍 Elegir ubicación en el mapa
          </li>
        </ul>
      )}

    </div>
  );
}
