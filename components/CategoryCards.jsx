import React, { forwardRef } from "react";

const CategoryCards = forwardRef(({ categories, onSelect }, ref) => {
  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto px-4 py-4 scrollbar-hide flex gap-4"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="min-w-[120px] flex flex-col items-center justify-center bg-white shadow-md rounded-xl p-3 hover:shadow-lg transition border border-neutral-200"
        >
          {cat.image && (
            <img
              src={cat.image}
              alt={cat.name}
              className="w-14 h-14 object-cover rounded-full mb-2"
            />
          )}
          <span className="text-sm font-semibold text-neutral-700 text-center">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
});

CategoryCards.displayName = "CategoryCards";

export default CategoryCards;
