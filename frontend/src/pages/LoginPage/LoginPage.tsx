import {
  AlertCircle,
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  requestPasswordReset,
  signInWithPassword,
  updatePassword,
} from '../../services/authService'

export function LoginPage() {
  const { user, isConfigured } = useAuth()
  const [mode, setMode] = useState<'login' | 'recovery'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = useLocation()
  const destination =
    (location.state as { from?: string } | null)?.from ?? '/clients'

  if (user) return <Navigate to={destination} replace />

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password)
        window.location.assign(destination)
      } else {
        await requestPasswordReset(email)
        setMessage(
          'Si la cuenta existe, recibirás un enlace seguro para restablecer la contraseña.',
        )
      }
    } catch {
      setError(
        mode === 'login'
          ? 'No fue posible iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.'
          : 'No fue posible solicitar el restablecimiento. Inténtalo de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConfigured)
    return (
      <AuthShell>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Configuración pendiente
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Agrega `VITE_API_BASE_URL=http://localhost:3000/api` a `.env` para
          habilitar la comunicación con el backend.
        </p>
      </AuthShell>
    )
  return (
    <AuthShell>
      <div className="mb-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950">
          UP
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {mode === 'login'
            ? 'Accede a UsagePanel'
            : 'Restablece tu contraseña'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === 'login'
            ? 'Usa las credenciales proporcionadas por el administrador de tu empresa.'
            : 'Te enviaremos un enlace de recuperación a tu correo.'}
        </p>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Correo electrónico
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              required
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </label>
        {mode === 'login' && (
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <div className="relative mt-1.5">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                minLength={12}
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </label>
        )}
        <button
          disabled={isSubmitting}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === 'login' ? <KeyRound className="h-4 w-4" /> : null}
          {isSubmitting
            ? 'Procesando...'
            : mode === 'login'
              ? 'Iniciar sesión'
              : 'Enviar enlace'}
        </button>
      </form>
      <button
        type="button"
        className="mt-6 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
        onClick={() => {
          setMode((current) => (current === 'login' ? 'recovery' : 'login'))
          setError('')
          setMessage('')
        }}
      >
        {mode === 'login' ? (
          '¿Olvidaste tu contraseña?'
        ) : (
          <>
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Volver al inicio de sesión
          </>
        )}
      </button>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setIsSubmitting(true)
    try {
      await updatePassword(password)
      setMessage('La contraseña se actualizó. Ya puedes iniciar sesión.')
      setPassword('')
      setConfirmation('')
    } catch {
      setError('El enlace ha caducado o no es válido. Solicita uno nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <AuthShell>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950">
        UP
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        Nueva contraseña
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Usa una contraseña larga, única y que no reutilices en otros servicios.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <PasswordField
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          label="Confirmar contraseña"
          value={confirmation}
          onChange={setConfirmation}
        />
        <button
          disabled={isSubmitting}
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
      <Link
        className="mt-6 inline-block text-sm font-semibold text-cyan-700"
        to="/login"
      >
        Volver al inicio de sesión
      </Link>
    </AuthShell>
  )
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        required
        minLength={12}
        autoComplete="new-password"
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  )
}
function Notice({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: 'error' | 'success'
}) {
  const styles =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return (
    <div className={`mb-5 flex gap-2 rounded-lg border p-3 text-sm ${styles}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </div>
  )
}
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-card sm:p-9">
        {children}
      </section>
    </main>
  )
}
