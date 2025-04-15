"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10 font-inter">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-extrabold text-red-600 tracking-tight">
          MORDISCO 🍔
        </h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          Mi pedido
        </button>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          Elegí tu mordisco
        </h2>

        {loading ? (
          <p className="text-gray-600">Cargando menú...</p>
        ) : (
          menu.map((category) => (
            <div key={category.id} className="mb-14">
              <h3 className="text-xl font-semibold text-neutral-800 uppercase mb-6 tracking-wide">
                {category.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-xl border border-neutral-200 transition-all"
                  >
                    {item.attributes.imageUrl ? (
                      <img
                        src={item.attributes.imageUrl}
                        alt={item.attributes.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-neutral-100 flex items-center justify-center text-sm text-neutral-400">
                        Sin imagen
                      </div>
                    )}

                    <div className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">
                          {item.attributes.name}
                        </h4>
                        {item.attributes.description && (
                          <p className="text-sm text-gray-500 mt-1 leading-tight">
                            {item.attributes.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-red-600 font-bold text-lg">
                          ${item.attributes.price}
                        </span>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm font-semibold rounded-lg transition-all">
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
