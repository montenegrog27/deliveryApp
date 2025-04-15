let token = null;
let expiration = null;

export async function getFudoToken() {
  const now = Math.floor(Date.now() / 1000);

  if (token && expiration && now < expiration - 300) {
    return token;
  }

  const res = await fetch(process.env.FUDO_AUTH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey: process.env.FUDO_API_KEY,
      apiSecret: process.env.FUDO_API_SECRET,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Error en auth Fudo:", error);
    throw new Error("Fudo auth failed");
  }

  const data = await res.json();
  token = data.token;
  expiration = data.exp;

  return token;
}
