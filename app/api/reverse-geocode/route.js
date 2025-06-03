export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return new Response(
      JSON.stringify({ error: "Faltan lat/lng" }),
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await res.json();

    const result = data.results?.[0];
    if (!result) {
      return new Response(
        JSON.stringify({ error: "No se encontraron resultados" }),
        { status: 404 }
      );
    }

    const isCorrientes = result.address_components.some((comp) =>
      comp.long_name.includes("Corrientes")
    );

    if (!isCorrientes) {
      return new Response(
        JSON.stringify({
          error:
            "Por ahora solo entregamos en Corrientes Capital. Probá con otra ubicación dentro de la ciudad.",
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ address: result.formatted_address }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en reverse-geocode:", err);
    return new Response(
      JSON.stringify({ error: "Error en reverse-geocoding" }),
      { status: 500 }
    );
  }
}
