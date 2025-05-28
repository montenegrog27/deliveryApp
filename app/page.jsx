// app/page.js
export default function Home() {
  return (
    <main className="min-h-screen bg-[#fff9f5] flex flex-col items-center justify-center px-6 py-12 text-neutral-800 text-center font-sans">
      {/* Logo o Nombre destacado */}
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3  text-[#fff9f5] ">
        Mordisco burgers
      </h1>
          <img
          src="https://res.cloudinary.com/dsbrnqc5z/image/upload/v1744755147/Versi%C3%B3n_principal_xer7zs.svg"
          alt="MORDISCO"
          className="h-8"
        />
      <p className="text-lg text-neutral-600 font-medium mb-6">
        Corrientes Capital, Argentina 🍔
      </p>

      {/* Mensaje principal */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md max-w-xl w-full mb-8 border border-neutral-200">
        <h2 className="text-2xl font-bold mb-2">Sitio en construcción</h2>
        <p className="text-base text-neutral-700 mb-4">
          Muy pronto vas a poder hacer tu pedido online y disfrutar nuestras burgers desde casa.
        </p>
        <button
          disabled
          className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold cursor-not-allowed"
        >
          Pedidos Online - Próximamente
        </button>
      </div>

      {/* Información obligatoria para Meta */}
      <div className="text-left text-sm md:text-base space-y-4 text-neutral-700 max-w-md w-full">
        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">📍 Dirección comercial</h3>
          <p>Calle Santa Fe 1583, Corrientes Capital, Argentina</p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">📞 Contacto</h3>
          <p>WhatsApp: +54 9 379 405-5152</p>
          <p>Email: unmordiscopls@gmail.com</p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">📲 Redes Sociales</h3>
          <a
            href="https://instagram.com/mordisco.arg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            instagram.com/mordisco.arg
          </a>
        </div>
      </div>

      {/* Footer suave */}
      <p className="text-xs text-neutral-400 mt-10">
        Esta web está en desarrollo. Gracias por tu paciencia ❤️
      </p>
    </main>
  );
}
