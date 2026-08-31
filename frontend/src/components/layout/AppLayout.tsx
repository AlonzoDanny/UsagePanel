import { LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import type { AppRole } from '../../types/auth'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/clients' },
  { label: 'Clientes', icon: Users, to: '/clients' },
]

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigationItems =
    profile?.role === 'admin'
      ? [...navigation, { label: 'Miembros', icon: Settings, to: '/members' }]
      : navigation
  const links = (
    <nav className="space-y-1" aria-label="Navegación principal">
      {navigationItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          onClick={() => setIsOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
  const account = (
    <AccountPanel
      email={profile?.email ?? ''}
      role={profile?.role ?? 'agent'}
      onSignOut={signOut}
    />
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 p-4 lg:flex">
        <Brand />
        <div className="mt-8">{links}</div>
        {account}
      </aside>
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-3 text-lg font-semibold text-slate-900">
          UsagePanel
        </span>
      </header>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-default bg-slate-950/40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Cerrar menú"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8">{links}</div>
            {account}
          </aside>
        </div>
      )}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-sm font-bold text-slate-950">
        UP
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        UsagePanel
      </span>
    </div>
  )
}
function AccountPanel({
  email,
  role,
  onSignOut,
}: {
  email: string
  role: AppRole
  onSignOut: () => Promise<void>
}) {
  return (
    <div className="mt-auto border-t border-slate-800 px-2 pt-4">
      <p className="truncate text-xs font-medium text-slate-300">{email}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {role === 'admin' ? 'Administrador' : 'Agente'}
      </p>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
      <p className="mt-4 text-xs text-slate-600">Versión 1.0</p>
    </div>
  )
}
