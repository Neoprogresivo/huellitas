import { useState } from 'react'
import { X, PawPrint, Save } from 'lucide-react'

const initial = { name: '', species: 'Perro', breed: '', birth_date: '', sex: 'No especificado', weight_kg: '', status: 'Activo', notes: '' }

export default function PetModal({ pet, onClose, onSave, busy }) {
  const [form, setForm] = useState(pet ? {
    ...initial, ...pet, birth_date: pet.birth_date || '', weight_kg: pet.weight_kg ?? '', breed: pet.breed || '', notes: pet.notes || ''
  } : initial)
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const submit = e => {
    e.preventDefault()
    onSave({
      name: form.name, species: form.species, breed: form.breed,
      birth_date: form.birth_date || null, sex: form.sex,
      weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
      status: form.status, notes: form.notes
    })
  }
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pet-modal-title">
        <div className="modal-head"><span className="modal-symbol"><PawPrint size={22}/></span><div><h2 id="pet-modal-title">{pet ? 'Editar mascota' : 'Nueva mascota'}</h2><p>Cuéntanos un poco sobre tu compañero.</p></div><button className="icon-button close-modal" aria-label="Cerrar" onClick={onClose}><X size={20}/></button></div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field full">Nombre de la mascota <span>*</span><input value={form.name} onChange={e => set('name', e.target.value)} minLength={2} maxLength={60} required placeholder="Ej.: Luna" autoFocus/></label>
            <label className="form-field">Especie <span>*</span><select value={form.species} onChange={e => set('species', e.target.value)}>{['Perro','Gato','Ave','Conejo','Otro'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="form-field">Raza<input value={form.breed} onChange={e => set('breed', e.target.value)} maxLength={80} placeholder="Ej.: Mestizo" /></label>
            <label className="form-field">Fecha de nacimiento<input type="date" max={new Date().toISOString().slice(0,10)} value={form.birth_date} onChange={e => set('birth_date', e.target.value)}/></label>
            <label className="form-field">Sexo<select value={form.sex} onChange={e => set('sex', e.target.value)}>{['No especificado','Macho','Hembra'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="form-field">Peso (kg)<input type="number" min="0.01" max="200" step="0.01" placeholder="Ej.: 8.50" value={form.weight_kg} onChange={e => set('weight_kg',e.target.value)}/></label>
            <label className="form-field">Estado<select value={form.status} onChange={e => set('status', e.target.value)}>{['Activo','En tratamiento','En adopción'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="form-field full">Notas adicionales<textarea rows="3" maxLength={1000} value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="Alergias, cuidados especiales o información importante…"/></label>
          </div>
          <div className="modal-actions"><button type="button" onClick={onClose} className="btn btn-light">Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}><Save size={16}/>{busy?'Guardando…':pet?'Guardar cambios':'Registrar mascota'}</button></div>
        </form>
      </section>
    </div>
  )
}
