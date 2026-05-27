export default function Dashboard() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Dashboard UADAV
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1E293B]">
          <p className="text-sm text-gray-400">Afiliados Activos</p>
          <h2 className="text-3xl font-bold mt-2">1,248</h2>
        </div>

        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1E293B]">
          <p className="text-sm text-gray-400">Inspectores</p>
          <h2 className="text-3xl font-bold mt-2">32</h2>
        </div>

        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1E293B]">
          <p className="text-sm text-gray-400">Empresas</p>
          <h2 className="text-3xl font-bold mt-2">214</h2>
        </div>

        <div className="bg-[#111827] rounded-2xl p-5 border border-[#1E293B]">
          <p className="text-sm text-gray-400">Credenciales Emitidas</p>
          <h2 className="text-3xl font-bold mt-2">5,842</h2>
        </div>

      </div>
    </div>
  );
}
