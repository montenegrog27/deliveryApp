// "use client";
// import { useState } from "react";

// export default function AddressInput({ onSelect, setDireccionConfirmada }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
// const [showMap, setShowMap] = useState(false);

//   const handleInput = async (value) => {
//     setQuery(value);
//     if (value.length < 3) {
//       setResults([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
//           value
//         )}.json?access_token=${
//           process.env.NEXT_PUBLIC_MAPBOX_TOKEN
//         }&autocomplete=true&country=AR&bbox=-58.87,-27.51,-58.775,-27.43&limit=5`
//       );

//       const data = await res.json();

//       const filtered = data.features.filter((f) =>
//         f.context?.some(
//           (c) =>
//             c.id.includes("place") &&
//             (c.text === "Corrientes" || c.text === "Corrientes Capital")
//         )
//       );

//       setResults(filtered);
//     } catch (err) {
//       console.error("❌ Error buscando dirección:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelect = (place) => {
//     const hasStreetNumber = place.context?.some(
//       (ctx) => ctx.id.startsWith("address") || ctx.id.startsWith("place")
//     );

//     // También podés verificar si `place.address` existe:
//     const isValid = !!place.address || hasStreetNumber;

//     setQuery(place.place_name);
//     setResults([]);

//     onSelect({
//       address: place.place_name,
//       lat: place.center[1],
//       lng: place.center[0],
//       isValidAddress: isValid, // 👈 lo usamos luego para validar en el checkout
//     });

//     if (setDireccionConfirmada) setDireccionConfirmada(true);
//   };

//   return (
//     <div className="relative">
//       <input
//         type="text"
//         placeholder="Ingresá tu dirección"
//         value={query}
//         onChange={(e) => {
//           handleInput(e.target.value);
//           setDireccionConfirmada(false); // pierde validez hasta que vuelva a seleccionar
//         }}
//         className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-base"
//       />
//       <button
//   onClick={() => setShowMap(true)}
//   type="button"
//   className="mt-2 text-sm text-blue-600 underline"
// >
//   Elegir en el mapa
// </button>

// {showMap && (
//   <div className="mt-4">
//     <Map
//       initialViewState={{
//         longitude: -58.83,
//         latitude: -27.47,
//         zoom: 13,
//       }}
//       style={{ width: "100%", height: 300 }}
//       mapStyle="mapbox://styles/mapbox/streets-v11"
//       mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
//       onClick={(e) => {
//         const lng = e.lngLat.lng;
//         const lat = e.lngLat.lat;

//         // Usamos reverse geocoding para completar dirección (opcional)
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
//         )
//           .then((res) => res.json())
//           .then((data) => {
//             const place = data.features?.[0];
//             onSelect({
//               address: place?.place_name || "Ubicación seleccionada en mapa",
//               lat,
//               lng,
//               isValidAddress: true,
//             });
//           });

//         setShowMap(false);
//       }}
//     />
//     <p className="text-xs text-gray-500 mt-2">
//       Tocá sobre el mapa para indicar tu ubicación exacta
//     </p>
//   </div>
// )}

//       {loading && (
//         <div className="absolute top-1 right-2 animate-pulse">
//           <img
//             src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744817613/Avatar_inicial_tbpnzy.svg"
//             alt="Cargando..."
//             className="w-6 h-6"
//           />
//         </div>
//       )}

//       {results.length > 0 && (
//         <ul className="absolute  border-neutral-300 rounded-lg mt-1 shadow w-full z-10">
//           {results.map((r) => (
//             <li
//               key={r.id}
//               className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer border border-neutral-200 bg-[#FFF9F2]"
//               onClick={() => handleSelect(r)}
//             >
//               {r.place_name}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";

export default function AddressInput({
  value, // ✅ Recibe el valor desde el componente padre
  onSelect,
  setDireccionConfirmada,
  onChooseFromMap,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // ✅ Si el padre actualiza la dirección, actualizá también el input
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const handleInput = async (val) => {
    setQuery(val);
    setSelectedCandidate(null);
    if (val.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          val
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&country=AR&bbox=-58.87,-27.51,-58.775,-27.43&limit=5`
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
    setQuery(place.address);
    setResults([]);
    setSelectedCandidate(null);
    onSelect(place);
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
          setDireccionConfirmada(false);
        }}
        className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-base"
      />

      {results.length > 0 && (
        <ul className="absolute border border-neutral-300 rounded-lg mt-1 shadow w-full z-10 bg-white">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b"
              onClick={() =>
                setSelectedCandidate({
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
              setSelectedCandidate(null);
            }}
          >
            📍 Elegir ubicación en el mapa
          </li>
        </ul>
      )}

      {selectedCandidate && (
        <div className="mt-2 border p-3 rounded bg-[#FFF9F2] text-sm text-gray-800 space-y-2">
          <p>Dirección seleccionada:</p>
          <p className="font-semibold">{selectedCandidate.address}</p>
          <button
            onClick={() => confirmSelection(selectedCandidate)}
            className="bg-blue-600 text-white px-4 py-1 rounded text-sm"
          >
            Aceptar
          </button>
        </div>
      )}
    </div>
  );
}
