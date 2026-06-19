import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      {/* Sidebar : visible uniquement sur desktop (md et +) */}
      <Sidebar />

      {/* Contenu principal : padding-bottom sur mobile pour laisser place à la bottom nav */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6 pt-safe">
        <Outlet />
      </main>

      {/* Bottom nav : visible uniquement sur mobile */}
      <BottomNav />
    </div>
  )
}
