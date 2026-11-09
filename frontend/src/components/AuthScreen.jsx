import { useState } from 'react'
import { ArrowRight, Heart, LockKeyhole, Mail, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError(''); setNotice('')
    if (!email.includes('@') || password.length < 6) {
      setError('Ingresa un correo válido y una contraseña de al menos 6 caracteres.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) throw authError
        if (data.session) setNotice('Cuenta creada. Ingresando al panel…')
        else setNotice('Registro recibido. Revisa tu correo para confirmar la cuenta y luego inicia sesión.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos, o cuenta sin confirmar.' : err.message)
    } finally { setBusy(false) }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <a className="brand brand-inverted" href="/" aria-label="Huellitas, inicio">
          <span className="brand-mark"><PawPrint size={22} strokeWidth={2.6} /></span><span>huellitas<span className="brand-dot">.</span></span>
        </a>
        <div className="auth-hero">
          <div className="eyebrow light"><Sparkles size={15}/> TU ESPACIO PARA CUIDARLOS MEJOR</div>
          <h1>Todo el amor que les das, <em>bien organizado.</em></h1>
          <p>Un hogar para la información de tus mascotas: sus datos, vacunas y próximos cuidados, siempre a mano.</p>
          <div className="auth-graphic" aria-hidden="true">
            <div className="graphic-orbit orbit-one"/><div className="graphic-orbit orbit-two"/>
            <span className="floating-heart heart-one">♥</span><span className="floating-heart heart-two">✦</span>
            <div className="graphic-pet">🐕</div>
            <div className="graphic-tile tile-one">💚 <span>Bienestar</span></div>
            <div className="graphic-tile tile-two">💉 <span>Vacunas al día</span></div>
          </div>
        </div>
        <div className="auth-story-bottom"><ShieldCheck size={18}/><span>Tu información es privada y está protegida por usuario.</span></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-panel">
          <div className="auth-mini-icon"><PawPrint size={26}/></div>
          <div className="auth-heading">
            <span className="overline">BIENVENIDO A HUELLITAS</span>
            <h2>{mode === 'login' ? 'Qué alegría verte de nuevo' : 'Comencemos juntos'}</h2>
            <p>{mode === 'login' ? 'Ingresa a tu cuenta para cuidar lo que más quieres.' : 'Crea una cuenta para guardar los datos de tus mascotas.'}</p>
          </div>
          <div className="auth-switch" role="tablist" aria-label="Tipo de acceso">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }} role="tab" aria-selected={mode === 'login'}>Iniciar sesión</button>
            <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); setNotice('') }} role="tab" aria-selected={mode === 'register'}>Crear cuenta</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            <label className="field-label" htmlFor="email">Correo electrónico</label>
            <div className="input-icon"><Mail size={18}/><input id="email" autoComplete="email" type="email" placeholder="tu@correo.com" required value={email} onChange={e => setEmail(e.target.value)}/></div>
            <label className="field-label" htmlFor="password">Contraseña</label>
            <div className="input-icon"><LockKeyhole size={18}/><input id="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} type="password" minLength={6} placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)}/></div>
            {error && <div className="inline-error" role="alert">{error}</div>}
            {notice && <div className="inline-success" role="status">{notice}</div>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Procesando…' : mode === 'login' ? 'Entrar a mi espacio' : 'Crear mi cuenta'} <ArrowRight size={18}/></button>
          </form>
          <p className="auth-foot"><Heart size={15} fill="currentColor"/> Hecho con cariño para tus compañeros de cuatro patas.</p>
        </div>
      </section>
    </main>
  )
}
