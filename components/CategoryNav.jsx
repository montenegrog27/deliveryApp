export default function CategoryNav({ categories, sectionRefs }) {
const handleClick = (id) => {
  const ref = sectionRefs.current[id];
  console.log("🖱️ Navegando a:", id, "ref encontrado:", ref);
  if (ref) {
    ref.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};


  return (
    <div className="sticky top-[70px z-40 bg-[#FFF9F5] py-2 px-4 overflow-x-auto flex gap-3 border-b shadow-sm scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.id)}
          className="px-3 py-1.5 rounded-full bg-neutral-200 hover:bg-[#E00000]/10 text-sm font-semibold whitespace-nowrap"
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
