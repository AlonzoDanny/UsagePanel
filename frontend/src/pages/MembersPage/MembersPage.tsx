import { MailPlus, ShieldCheck, UserCog, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { changeMemberRole, inviteMember } from '../../services/authService'
import { getMembers } from '../../services/memberService'
import type { AppRole, Profile } from '../../types/auth'
import { formatDate } from '../../utils/formatters'

export function MembersPage() {
  const { profile: currentProfile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  async function loadMembers() {
    setIsLoading(true)
    setError('')
    try {
      setMembers(await getMembers())
    } catch {
      setError('No fue posible cargar los miembros de la empresa.')
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    let isActive = true
    getMembers()
      .then((nextMembers) => {
        if (isActive) setMembers(nextMembers)
      })
      .catch(() => {
        if (isActive)
          setError('No fue posible cargar los miembros de la empresa.')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [])
  async function handleRoleChange(member: Profile, role: AppRole) {
    if (member.role === role) return
    setError('')
    try {
      await changeMemberRole(member.id, role)
      await loadMembers()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible actualizar el rol.',
      )
    }
  }

  return (
    <>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Miembros de la empresa
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestiona quién puede acceder al monitoreo y sus permisos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <MailPlus className="h-4 w-4" />
          Invitar miembro
        </button>
      </header>
      <section className="mt-7 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-700" />
          <div className="text-sm leading-6 text-cyan-900">
            <span className="font-semibold">Permisos por rol.</span> Los
            administradores gestionan miembros y roles. Los agentes consultan
            exclusivamente el monitoreo de clientes.
          </div>
        </div>
      </section>
      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {isLoading ? (
          <div className="p-6">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState>{error}</ErrorState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Miembro</th>
                  <th className="px-5 py-3.5 font-semibold">Rol</th>
                  <th className="px-5 py-3.5 font-semibold">Fecha de alta</th>
                  <th className="px-5 py-3.5 font-semibold">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {member.fullName ?? 'Sin nombre'}
                      </p>
                      <p className="mt-0.5 text-slate-500">{member.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(member.createdAt.slice(0, 10))}
                    </td>
                    <td className="px-5 py-4">
                      {member.id === currentProfile?.id ? (
                        <span className="text-xs font-medium text-slate-400">
                          Tu cuenta
                        </span>
                      ) : (
                        <select
                          aria-label={`Rol de ${member.email}`}
                          value={member.role}
                          onChange={(event) =>
                            void handleRoleChange(
                              member,
                              event.target.value as AppRole,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        >
                          <option value="agent">Agente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {isInviteOpen && (
        <InviteMemberDialog
          onClose={() => setIsInviteOpen(false)}
          onInvited={() => {
            setIsInviteOpen(false)
            void loadMembers()
          }}
        />
      )}
    </>
  )
}

function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span
      className={
        role === 'admin'
          ? 'inline-flex rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20'
          : 'inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/20'
      }
    >
      {role === 'admin' ? 'Administrador' : 'Agente'}
    </span>
  )
}
function InviteMemberDialog({
  onClose,
  onInvited,
}: {
  onClose: () => void
  onInvited: () => void
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<AppRole>('agent')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await inviteMember(email, fullName, role)
      onInvited()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible enviar la invitación.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/40"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-cyan-50 p-2.5 text-cyan-700">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="invite-title"
              className="text-lg font-semibold text-slate-950"
            >
              Invitar miembro
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recibirá un correo para crear una contraseña segura.
            </p>
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Nombre completo
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Rol
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="agent">Agente</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <UserCog className="h-4 w-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
