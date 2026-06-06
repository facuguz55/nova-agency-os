import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060c18] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Número 404 grande */}
        <div className="relative mb-8">
          <p className="text-[120px] font-black text-[#0e1a2e] leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#ff8c42]/10 border border-[#ff8c42]/20 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff8c42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v4M11 16h.01"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Página no encontrada</h1>
        <p className="text-sm text-[#475569] mb-8 leading-relaxed">
          Esta URL no existe en Nova Agency OS. Puede que la hayas movido, borrado o escrito mal.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#ff8c42] hover:bg-[#fb923c] text-white text-sm font-bold rounded-xl transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/clients"
            className="px-5 py-2.5 bg-[#0e1a2e] hover:bg-[#1a2d45] text-[#64748b] hover:text-white text-sm font-medium rounded-xl border border-[#1e2f4a] transition-colors"
          >
            Ver Clientes
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[#253f60]">Nova Agency OS · dashboard.novaagency.info</p>
      </div>
    </div>
  )
}
