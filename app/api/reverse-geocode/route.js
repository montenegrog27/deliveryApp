export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: "Faltan lat/lng" }), {
      status: 400,
    });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // sin NEXT_PUBLIC

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron resultados" }),
        { status: 404 }
      );
    }

    const result = data.results[0];
    const address = result.formatted_address;
    const components = result.address_components;

    const ciudad = components.find((c) =>
      c.types.includes("locality") || c.types.includes("administrative_area_level_2")
    )?.long_name;

    const pais = components.find((c) => c.types.includes("country"))?.short_name;

    if (ciudad?.toLowerCase() !== "corrientes" || pais !== "AR") {
      return new Response(
        JSON.stringify({
          error: "Solo entregamos en Corrientes Capital",
        }),
        { status: 400 }
      );
    }

    return new Response(JSON.stringify({ address }));
  } catch (err) {
    console.error("Error en reverse-geocode:", err);
    return new Response(
      JSON.stringify({ error: "Error en reverse-geocoding" }),
      { status: 500 }
    );
  }
}
