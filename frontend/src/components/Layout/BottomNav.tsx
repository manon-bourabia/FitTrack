import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Calendar, User, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exercises',  icon: Dumbbell,         label: 'Exercices' },
  { to: '/workouts',   icon: Calendar,          label: 'Séances'   },
  { to: '/profile',    icon: User,              label: 'Profil'    },
]

export default function BottomNav() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1117] border-t border-slate-800 flex items-center justify-around px-2 pb-safe">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Bouton déconnexion discret */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-400 transition-colors"
      >
        <LogOut size={20} />
        <span>Quitter</span>
      </button>
    </nav>
  )
}
