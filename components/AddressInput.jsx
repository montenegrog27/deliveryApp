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
import { useState } from "react";
import { Marker, Map } from "react-map-gl/mapbox";

export default function AddressInput({ onSelect, setDireccionConfirmada }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapSelectedPoint, setMapSelectedPoint] = useState(null);
  const [mapCandidate, setMapCandidate] = useState(null);

  const handleInput = async (value) => {
    setQuery(value);
    setSelectedCandidate(null);
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

  const confirmSelection = (place) => {
    setQuery(place.address);
    setResults([]);
    setSelectedCandidate(null);
    onSelect(place);
    if (setDireccionConfirmada) setDireccionConfirmada(true);
  };

  const handleMapClick = async (e) => {
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    setMapSelectedPoint({ lat, lng });

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await res.json();
      const place = data.features?.[0];

      setMapCandidate({
        address: place?.place_name || "Ubicación seleccionada en el mapa",
        lat,
        lng,
        isValidAddress: true,
      });
    } catch (err) {
      console.error("❌ Error con reverse geocoding:", err);
    }
  };

  const confirmMapCandidate = () => {
    if (!mapCandidate) return;
    confirmSelection(mapCandidate);
    setMapModalOpen(false);
    setMapCandidate(null);
    setMapSelectedPoint(null);
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
        <ul className="absolute border-neutral-300 rounded-lg mt-1 shadow w-full z-10 bg-white">
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
              setMapModalOpen(true);
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

      {/* MODAL CON MAPA */}
      {mapModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] relative">
            <button
              onClick={() => setMapModalOpen(false)}
              className="absolute top-3 right-4 text-gray-600 text-xl"
            >
              ✕
            </button>
            <div className="h-[400px] w-full">
<Map
  key={mapModalOpen ? "map-visible" : "map-hidden"} // 👈 fuerza remount
  initialViewState={{
    longitude: mapSelectedPoint?.lng || -58.83,
    latitude: mapSelectedPoint?.lat || -27.47,
    zoom: 13,
  }}
  mapStyle="mapbox://styles/mapbox/light-v10"
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  onClick={handleMapClick}
>
{mapSelectedPoint?.lng && mapSelectedPoint?.lat && (
  <Marker
    longitude={mapSelectedPoint.lng}
    latitude={mapSelectedPoint.lat}
    anchor="bottom"
  >
    <img
      src="/pin.png"
      alt="Ubicación"
      className="w-10 h-10 object-contain pointer-events-none border border-black bg-white rounded-full"
    />
  </Marker>
)}

              </Map>
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
                    onClick={confirmMapCandidate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                  >
                    Aceptar
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Tocá sobre el mapa para seleccionar una ubicación
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
