export default function Header() {
  return (
    <header className="h-16 bg-[#111827] border-b border-[#1E293B] flex items-center justify-between px-6 text-white">
      
      <div>
        <h2 className="font-semibold">
          Unión Argentina de Artistas de Variedades
        </h2>
      </div>

      <div className="flex items-center gap-4">

        <input
          type="text"
          placeholder="Buscar..."
          className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-sm"
        />

        <div className="w-10 h-10 rounded-full bg-[#33CCFF]"></div>

      </div>

    </header>
  );
}
