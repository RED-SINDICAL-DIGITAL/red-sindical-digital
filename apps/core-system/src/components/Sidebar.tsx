export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#111827] border-r border-[#1E293B] text-white p-4">
      
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#33CCFF]">
          UADAV
        </h1>

        <p className="text-sm text-gray-400">
          Red Sindical Digital
        </p>
      </div>

      <nav className="flex flex-col gap-3">

        <button className="text-left hover:text-[#33CCFF]">
          Dashboard
        </button>

        <button className="text-left hover:text-[#33CCFF]">
          Afiliados
        </button>

        <button className="text-left hover:text-[#33CCFF]">
          Credenciales
        </button>

        <button className="text-left hover:text-[#33CCFF]">
          Inspectores
        </button>

        <button className="text-left hover:text-[#33CCFF]">
          Empresas
        </button>

        <button className="text-left hover:text-[#33CCFF]">
          Cobranzas
        </button>

      </nav>

    </aside>
  );
}
