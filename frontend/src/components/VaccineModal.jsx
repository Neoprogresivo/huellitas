import { useState } from 'react'
import { Syringe, X, Save } from 'lucide-react'

export default function VaccineModal({ vaccine, onClose, onSave, busy }) {
  const [form, setForm] = useState(vaccine ? {
    name:vaccine.name, administered_on:vaccine.administered_on, next_due_on:vaccine.next_due_on||'', notes:vaccine.notes||''
  } : { name:'', administered_on:new Date().toISOString().slice(0,10), next_due_on:'', notes:'' })
  const set = (key,value) => setForm(p => ({...p,[key]:value}))
  const submit = e => { e.preventDefault(); onSave({...form,next_due_on:form.next_due_on||null}) }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="vaccine-modal-title">
      <div className="modal-head"><span className="modal-symbol purple"><Syringe size={22}/></span><div><h2 id="vaccine-modal-title">{vaccine?'Editar vacuna':'Registrar vacuna'}</h2><p>Mantén al día su historial de salud.</p></div><button className="icon-button close-modal" aria-label="Cerrar" onClick={onClose}><X size={20}/></button></div>
      <form onSubmit={submit}><div className="form-grid">
        <label className="form-field full">Nombre de la vacuna <span>*</span><input value={form.name} onChange={e=>set('name',e.target.value)} required minLength={2} maxLength={100} placeholder="Ej.: Antirrábica" autoFocus/></label>
        <label className="form-field">Fecha de aplicación <span>*</span><input type="date" required max={new Date().toISOString().slice(0,10)} value={form.administered_on} onChange={e=>set('administered_on',e.target.value)}/></label>
        <label className="form-field">Próximo refuerzo<input type="date" value={form.next_due_on} onChange={e=>set('next_due_on',e.target.value)}/></label>
        <label className="form-field full">Observaciones<textarea rows="3" maxLength={500} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Veterinario, dosis, observaciones…"/></label>
      </div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}><Save size={16}/>{busy?'Guardando…':'Guardar vacuna'}</button></div></form>
    </section>
  </div>
}
