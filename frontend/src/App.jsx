import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronDown,
  CircleHelp, ClipboardList, Dog, Edit3, Filter, Heart, HeartPulse,
  LayoutDashboard, LogOut, Menu, MoreHorizontal, PawPrint, Plus,
  Search, ShieldCheck, Sparkles, Syringe, Trash2, X
} from 'lucide-react'
import { supabase, isConfigured } from './lib/supabase.js'
import { api } from './lib/api.js'
import AuthScreen from './components/AuthScreen.jsx'
import PetModal from './components/PetModal.jsx'
import VaccineModal from './components/VaccineModal.jsx'

const speciesMeta = {
  Perro: { emoji:'🐕', className:'dog' }, Gato: { emoji:'🐈', className:'cat' },
  Ave: { emoji:'🦜', className:'bird' }, Conejo: { emoji:'🐇', className:'rabbit' }, Otro: { emoji:'🐾', className:'other' }
}
const demoPets = [
  { name:'Luna', species:'Perro', breed:'Golden Retriever', sex:'Hembra', weight_kg:21.5, status:'Activo', birth_date:'2022-05-12', notes:'Le encantan los paseos y las pelotas.' },
  { name:'Milo', species:'Gato', breed:'Mestizo', sex:'Macho', weight_kg:4.3, status:'Activo', birth_date:'2023-08-20', notes:'Un explorador curioso.' },
  { name:'Coco', species:'Conejo', breed:'Enano', sex:'Macho', weight_kg:1.65, status:'En tratamiento', birth_date:'2024-01-10', notes:'Control veterinario mensual.' }
]

function formatDate(value) {
  if (!value) return 'Sin registrar'
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'numeric'})
}
function yearsOld(dob) {
  if (!dob) return 'Edad no registrada'
  const d = new Date(`${dob}T12:00:00`), now=new Date()
  let years=now.getFullYear()-d.getFullYear()
  if (now.getMonth()<d.getMonth() || (now.getMonth()===d.getMonth() && now.getDate()<d.getDate())) years--
  return years<1?'Menor de 1 año':`${years} ${years===1?'año':'años'}`
}
function VaccineDue({ date }) {
  if (!date) return <span className="due-muted">Sin fecha de refuerzo</span>
  const today=new Date().toISOString().slice(0,10)
  const days=Math.ceil((new Date(date+'T12:00:00Z')-new Date(today+'T12:00:00Z'))/86400000)
  return <span className={days<0?'due overdue':days<=30?'due upcoming':'due fine'}>{days<0?'Refuerzo vencido':days<=30?'Próximo refuerzo':'Refuerzo programado'} · {formatDate(date)}</span>
}

function ConfigError() {
  return <main className="config-error"><div className="config-card"><span className="config-emoji">🔧</span><h1>Primero conectemos Supabase</h1><p>La aplicación está lista, pero falta indicar el proyecto PostgreSQL y la clave pública de Supabase.</p><pre>{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}</pre><p>Revisa <strong>README.md</strong> en la raíz del repositorio, crea <strong>frontend/.env.local</strong> y ejecuta <strong>supabase/schema.sql</strong> en el SQL Editor.</p><span className="config-note">No utilices nunca una clave service_role o secreta en Vite.</span></div></main>
}

export default function App() {
  const [session,setSession]=useState(undefined)
  const [pets,setPets]=useState([])
  const [vaccines,setVaccines]=useState([])
  const [selectedId,setSelectedId]=useState(null)
  const [loading,setLoading]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [toast,setToast]=useState('')
  const [query,setQuery]=useState('')
  const [speciesFilter,setSpeciesFilter]=useState('Todas')
  const [tab,setTab]=useState('mascotas')
  const [petForm,setPetForm]=useState(null)
  const [vaccineForm,setVaccineForm]=useState(null)
  const [mobileNav,setMobileNav]=useState(false)

  useEffect(()=>{
    if (!isConfigured) return
    supabase.auth.getSession().then(({data})=>setSession(data.session || null)).catch(()=>setSession(null))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s))
    return ()=>subscription.unsubscribe()
  },[])

  const refresh=useCallback(async()=>{
    setLoading(true);setError('')
    try {
      const [p,v]=await Promise.all([api('/pets'),api('/vaccines')])
      setPets(p.data); setVaccines(v.data)
      setSelectedId(current=>p.data.some(item=>item.id===current)?current:(p.data[0]?.id||null))
    } catch(err) { setError(err.message) }
    finally {setLoading(false)}
  },[])
  useEffect(()=>{
    if(session?.user?.id) refresh()
    else {setPets([]);setVaccines([]);setSelectedId(null)}
  },[session?.user?.id,refresh])
  useEffect(()=>{
    if(!toast)return
    const id=setTimeout(()=>setToast(''),4000)
    return ()=>clearTimeout(id)
  },[toast])

  const filtered=useMemo(()=>pets.filter(p=>{
    const matches=speciesFilter==='Todas'||speciesFilter===p.species
    const q=query.trim().toLocaleLowerCase()
    return matches && (!q||[p.name,p.breed,p.species].some(x=>(x||'').toLocaleLowerCase().includes(q)))
  }),[pets,query,speciesFilter])
  const selected=pets.find(p=>p.id===selectedId)
  const petVaccines=vaccines.filter(v=>v.pet_id===selectedId)
  const upcoming=vaccines.filter(v=>v.next_due_on&&v.next_due_on<=new Date(Date.now()+30*86400000).toISOString().slice(0,10)).length

  async function savePet(values) {
    setBusy(true)
    try {
      const response=petForm?.pet
        ? await api(`/pets/${petForm.pet.id}`,{method:'PATCH',body:JSON.stringify(values)})
        : await api('/pets',{method:'POST',body:JSON.stringify(values)})
      setPetForm(null)
      await refresh()
      setSelectedId(response.data.id)
      setToast(petForm?.pet?'Mascota actualizada correctamente.':'¡Una nueva mascota se unió a tu familia!')
    } catch(e){setToast(`Error: ${e.message}`)}
    finally{setBusy(false)}
  }
  async function removePet(pet) {
    if(!window.confirm(`¿Eliminar a ${pet.name} y todo su historial de vacunas? Esta acción no se puede deshacer.`))return
    setBusy(true)
    try {await api(`/pets/${pet.id}`,{method:'DELETE'});await refresh();setToast('Mascota eliminada correctamente.')}
    catch(e){setToast(`Error: ${e.message}`)}finally{setBusy(false)}
  }
  async function saveVaccine(values) {
    if(!selectedId)return
    setBusy(true)
    try {
      if(vaccineForm?.vaccine) await api(`/vaccines/${vaccineForm.vaccine.id}`,{method:'PATCH',body:JSON.stringify(values)})
      else await api('/vaccines',{method:'POST',body:JSON.stringify({...values,pet_id:selectedId})})
      setVaccineForm(null);await refresh();setToast('Vacuna guardada correctamente.')
    } catch(e){setToast(`Error: ${e.message}`)}finally{setBusy(false)}
  }
  async function removeVaccine(v) {
    if(!window.confirm(`¿Eliminar el registro de vacuna «${v.name}»?`))return
    setBusy(true)
    try {await api(`/vaccines/${v.id}`,{method:'DELETE'});await refresh();setToast('Registro eliminado.')}
    catch(e){setToast(`Error: ${e.message}`)}finally{setBusy(false)}
  }
  async function loadDemo() {
    if(pets.length>0)return
    setBusy(true)
    try {
      const created=[]
      for(const p of demoPets){const response=await api('/pets',{method:'POST',body:JSON.stringify(p)});created.push(response.data)}
      const demoVaccines=[
        {pet_id:created[0].id,name:'Antirrábica',administered_on:'2026-01-15',next_due_on:'2027-01-15',notes:'Control anual de ejemplo'},
        {pet_id:created[0].id,name:'Séxtuple',administered_on:'2026-03-10',next_due_on:'2026-12-01',notes:'Refuerzo programado'},
        {pet_id:created[1].id,name:'Triple felina',administered_on:'2026-02-14',next_due_on:'2027-02-14'},
        {pet_id:created[2].id,name:'Mixomatosis',administered_on:'2026-04-10',next_due_on:'2027-04-10'}
      ]
      for(const v of demoVaccines)await api('/vaccines',{method:'POST',body:JSON.stringify(v)})
      await refresh();setToast('Se agregaron tres mascotas y cuatro vacunas de demostración.')
    }
    catch(e){setToast(`Error: ${e.message}`)}finally{setBusy(false)}
  }
  async function signOut(){await supabase.auth.signOut()}

  if(!isConfigured)return <ConfigError/>
  if(session===undefined)return <div className="app-loading"><PawPrint size={32}/> Cargando Huellitas…</div>
  if(!session)return <AuthScreen/>

  const initials=(session.user.email||'U').split('@')[0].slice(0,2).toUpperCase()
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`}>
      <div className="sidebar-top">
        <div className="brand"><span className="brand-mark"><PawPrint size={22} strokeWidth={2.6}/></span><span>huellitas<span className="brand-dot">.</span></span></div>
        <button className="icon-button mobile-nav-close" onClick={()=>setMobileNav(false)} aria-label="Cerrar menú"><X size={20}/></button>
        <div className="side-section-label">MI ESPACIO</div>
        <button className={`side-nav ${tab==='mascotas'?'active':''}`} onClick={()=>{setTab('mascotas');setMobileNav(false)}}><LayoutDashboard size={19}/>Mi panel</button>
        <button className={`side-nav ${tab==='vacunas'?'active':''}`} onClick={()=>{setTab('vacunas');setMobileNav(false)}}><Syringe size={19}/>Control de vacunas<span className="side-count">{vaccines.length}</span></button>
        <div className="side-section-label second">MI FAMILIA</div>
        <div className="side-pets">
          {pets.slice(0,5).map(p=><button key={p.id} className={`side-pet ${p.id===selectedId?'selected':''}`} onClick={()=>{setSelectedId(p.id);setTab('mascotas');setMobileNav(false)}}><span>{speciesMeta[p.species]?.emoji||'🐾'}</span><span className="truncate">{p.name}</span></button>)}
          {pets.length===0&&<p className="side-placeholder">Aún no hay mascotas</p>}
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="side-tip"><div className="side-tip-icon"><Heart size={18} fill="currentColor"/></div><strong>Siempre a tu lado</strong><p>Un pequeño cuidado hoy es un gran bienestar mañana.</p></div>
        <button className="profile" onClick={signOut} title="Cerrar sesión"><span className="profile-initials">{initials}</span><span className="profile-text"><strong>Mi cuenta</strong><small className="truncate">{session.user.email}</small></span><LogOut size={17}/></button>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={()=>setMobileNav(true)} aria-label="Abrir menú"><Menu size={22}/></button>
        <div className="breadcrumb">Mi espacio <span>/</span> <strong>{tab==='mascotas'?'Panel general':'Control de vacunas'}</strong></div>
        <div className="topbar-right"><span className="top-badge"><span className="live-dot"/> Sistema conectado</span><span className="top-avatar">{initials}</span></div>
      </header>
      <div className="page-content">
        <div className="page-title"><div><span className="eyebrow"><Sparkles size={14}/> TU ESPACIO DE CUIDADO</span><h1>{tab==='mascotas'?'Hola, familia peluda 👋':'Historial de vacunas 💉'}</h1><p>{tab==='mascotas'?'Porque cada mascota merece atención, amor y un registro bien cuidado.':'Un registro organizado de los cuidados veterinarios de tu familia.'}</p></div><button className="btn btn-primary top-add" onClick={()=>setPetForm({pet:null})}><Plus size={18}/> Nueva mascota</button></div>
        {error&&<div className="page-error" role="alert">{error} <button onClick={refresh}>Reintentar</button></div>}
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-icon mint"><PawPrint size={23}/></span><span className="stat-caption">Total de mascotas</span><div className="stat-value">{pets.length.toString().padStart(2,'0')}<span>registradas</span></div></div>
          <div className="stat-card"><span className="stat-icon peach"><HeartPulse size={23}/></span><span className="stat-caption">En buen estado</span><div className="stat-value">{pets.filter(p=>p.status==='Activo').length.toString().padStart(2,'0')}<span>activas</span></div></div>
          <div className="stat-card"><span className="stat-icon lavender"><Syringe size={23}/></span><span className="stat-caption">Vacunas registradas</span><div className="stat-value">{vaccines.length.toString().padStart(2,'0')}<span>dosis</span></div></div>
          <div className="stat-card"><span className="stat-icon yellow"><CalendarDays size={23}/></span><span className="stat-caption">Refuerzos pendientes</span><div className="stat-value">{upcoming.toString().padStart(2,'0')}<span>próx. 30 días o vencidos</span></div></div>
        </div>
        {tab==='mascotas'&&<>
          <section className="section-heading"><div><span className="section-kicker">MIS COMPAÑEROS</span><h2>Tu familia de cuatro patas <span className="count-pill">{pets.length}</span></h2><p>Toda su información, reunida en un solo lugar.</p></div></section>
          <div className="filter-row"><div className="search-input"><Search size={18}/><input placeholder="Buscar por nombre, raza o especie…" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Buscar mascotas"/></div><div className="filter-select"><Filter size={17}/><select value={speciesFilter} onChange={e=>setSpeciesFilter(e.target.value)} aria-label="Filtrar por especie"><option>Todas</option>{Object.keys(speciesMeta).map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={15}/></div></div>
          {loading?<div className="loading-panel"><PawPrint size={24}/>Cargando tus mascotas…</div>:
            pets.length===0?<div className="empty-state"><div className="empty-paw">🐶</div><h3>¡Aquí comienza su historia!</h3><p>Agrega tu primera mascota o carga tres registros de demostración para conocer la aplicación.</p><div className="empty-actions"><button className="btn btn-primary" onClick={()=>setPetForm({pet:null})}><Plus size={17}/>Registrar mascota</button><button className="btn btn-light" disabled={busy} onClick={loadDemo}>Cargar ejemplos</button></div></div>:
            filtered.length===0?<div className="empty-state slim"><Search size={36}/><h3>No encontramos resultados</h3><p>Prueba con otro nombre o modifica el filtro.</p><button className="btn btn-light" onClick={()=>{setQuery('');setSpeciesFilter('Todas')}}>Limpiar filtros</button></div>:
            <div className="pet-grid">{filtered.map(p=><button key={p.id} className={`pet-card ${p.id===selectedId?'is-selected':''}`} onClick={()=>setSelectedId(p.id)}><div className="pet-card-top"><span className={`pet-avatar ${speciesMeta[p.species]?.className||'other'}`}>{speciesMeta[p.species]?.emoji||'🐾'}</span><span className={`status-chip ${p.status==='Activo'?'active':p.status==='En tratamiento'?'treatment':'adoption'}`}><span/>{p.status}</span></div><div className="pet-card-name">{p.name}<ArrowRight size={18}/></div><div className="pet-card-meta">{p.breed||p.species} · {yearsOld(p.birth_date)}</div><div className="pet-card-foot"><span><Heart size={14}/> {p.species}</span><span>{vaccines.filter(v=>v.pet_id===p.id).length} vacunas</span></div></button>)}</div>}
          {selected&&<section className="detail-card"><div className="detail-top"><div className="detail-title"><span className={`detail-avatar ${speciesMeta[selected.species]?.className||'other'}`}>{speciesMeta[selected.species]?.emoji||'🐾'}</span><div><span className="section-kicker">FICHA DE MASCOTA</span><h2>{selected.name}</h2><p>{selected.species} · {selected.breed||'Raza no especificada'}</p></div></div><div className="detail-actions"><button className="btn btn-light small" onClick={()=>setPetForm({pet:selected})}><Edit3 size={15}/>Editar ficha</button><button className="icon-button danger" onClick={()=>removePet(selected)} disabled={busy} aria-label={`Eliminar ${selected.name}`} title="Eliminar mascota"><Trash2 size={17}/></button></div></div><div className="detail-facts"><div><small>Edad</small><strong>{yearsOld(selected.birth_date)}</strong></div><div><small>Sexo</small><strong>{selected.sex}</strong></div><div><small>Peso</small><strong>{selected.weight_kg?`${selected.weight_kg} kg`:'No registrado'}</strong></div><div><small>Estado</small><strong>{selected.status}</strong></div></div>{selected.notes&&<div className="pet-notes"><strong>Notas importantes</strong><p>{selected.notes}</p></div>}
            <div className="vaccine-header"><div><span className="section-kicker">HISTORIAL DE SALUD</span><h3>Vacunas y refuerzos <span className="count-pill">{petVaccines.length}</span></h3></div><button className="btn btn-secondary small" onClick={()=>setVaccineForm({vaccine:null})}><Plus size={16}/>Agregar vacuna</button></div>
            {petVaccines.length===0?<div className="no-vaccines"><Syringe size={26}/><span>Aún no hay vacunas registradas para {selected.name}.</span></div>:<div className="vaccine-list">{petVaccines.map(v=><div className="vaccine-item" key={v.id}><div className="vaccine-round"><Syringe size={20}/></div><div className="vaccine-info"><strong>{v.name}</strong><small>Aplicada el {formatDate(v.administered_on)}</small><VaccineDue date={v.next_due_on}/>{v.notes&&<small className="v-note">{v.notes}</small>}</div><div className="vaccine-actions"><button className="icon-button" title="Editar vacuna" aria-label="Editar vacuna" onClick={()=>setVaccineForm({vaccine:v})}><Edit3 size={16}/></button><button className="icon-button danger" title="Eliminar vacuna" aria-label="Eliminar vacuna" onClick={()=>removeVaccine(v)}><Trash2 size={16}/></button></div></div>)}</div>}</section>}
        </>}
        {tab==='vacunas'&&<section className="all-vaccines"><div className="section-heading"><div><span className="section-kicker">CONTROL DE SALUD</span><h2>Calendario de vacunas</h2><p>Registros de todas tus mascotas, organizados por fecha de aplicación.</p></div></div>{vaccines.length===0?<div className="empty-state slim"><Syringe size={36}/><h3>Aún no hay vacunas registradas</h3><p>Selecciona una mascota en «Mi panel» para agregar su primera vacuna.</p><button className="btn btn-primary" onClick={()=>setTab('mascotas')}>Ver mascotas <ArrowRight size={16}/></button></div>:<div className="vaccine-table-wrap"><table className="vaccine-table"><thead><tr><th>Mascota</th><th>Vacuna</th><th>Aplicación</th><th>Refuerzo</th></tr></thead><tbody>{vaccines.map(v=>{const p=pets.find(p=>p.id===v.pet_id);return<tr key={v.id}><td><span className="table-pet-icon">{speciesMeta[p?.species]?.emoji||'🐾'}</span>{p?.name||'Mascota eliminada'}</td><td>{v.name}</td><td>{formatDate(v.administered_on)}</td><td><VaccineDue date={v.next_due_on}/></td></tr>})}</tbody></table></div>}</section>}
        <footer className="app-footer"><span><PawPrint size={15}/> Huellitas · Proyecto educativo React + Vite + API + PostgreSQL</span><span>Hecho para aprender Ingeniería de Software</span></footer>
      </div>
    </main>
    {mobileNav&&<div className="sidebar-overlay" onClick={()=>setMobileNav(false)}/>}
    {petForm&&<PetModal pet={petForm.pet} onClose={()=>!busy&&setPetForm(null)} onSave={savePet} busy={busy}/>}
    {vaccineForm&&<VaccineModal vaccine={vaccineForm.vaccine} onClose={()=>!busy&&setVaccineForm(null)} onSave={saveVaccine} busy={busy}/>}
    {toast&&<div className={`toast ${toast.startsWith('Error')?'toast-error':''}`} role="status"><Check size={18}/>{toast}<button onClick={()=>setToast('')} aria-label="Cerrar aviso"><X size={15}/></button></div>}
  </div>
}
