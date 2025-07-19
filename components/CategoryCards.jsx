import React, { forwardRef } from "react";

const CategoryCards = forwardRef(({ categories, onSelect }, ref) => {
  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto px-4 py-3 flex gap-3 scrollbar-hide"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="whitespace-nowrap bg-white text-[#1A1A1A] text-sm font-semibold px-4 py-2 rounded-full border border-neutral-300 shadow-sm hover:bg-neutral-100 active:scale-95 transition-all"
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
});

CategoryCards.displayName = "CategoryCards";

export default CategoryCards;
