

"use client";

import { useEffect, useRef } from "react";

export default function AddressInput({
  value,
  onInputChange,
  onSelect,
  setDireccionConfirmada,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const sessionTokenRef = useRef(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
 autocompleteRef.current = new window.google.maps.places.Autocomplete(
  inputRef.current,
  {
    componentRestrictions: { country: "ar" },
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(-27.5300, -58.8700), // sudoeste
      new google.maps.LatLng(-27.4200, -58.7500)  // noreste
    ),
    strictBounds: true,
    fields: ["formatted_address", "geometry"],
    types: ["address"],
  }
);


    autocompleteRef.current.setOptions({ sessionToken: sessionTokenRef.current });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const location = place.geometry.location;
      const selected = {
        address: place.formatted_address,
        lat: location.lat(),
        lng: location.lng(),
        isValidAddress: true,
      };

      onSelect(selected);
      setDireccionConfirmada?.(true);

      // Nuevo token para próxima búsqueda
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    });
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Ingresá tu dirección"
        value={value}
        onChange={(e) => {
          onInputChange?.(e.target.value);
          setDireccionConfirmada?.(false);
        }}
        className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-base"
      />
    </div>
  );
}
