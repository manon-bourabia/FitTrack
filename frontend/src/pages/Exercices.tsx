// pages/Exercices.tsx -- Gestion des exercices (CRUD + modal de detail avec GIF)

import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { Plus, Search, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Exercise } from '../types'
import ExerciseDetailModal from '../components/ExerciseDetailModal'

const CATEGORIES = ['Musculation', 'Cardio', 'Flexibilité'] as const
type Category = (typeof CATEGORIES)[number]

const CAT_COLORS: Record<Category, string> = {
  Musculation: 'bg-indigo-500/15 text-indigo-300',
  Cardio: 'bg-amber-500/15 text-amber-300',
  'Flexibilité': 'bg-emerald-500/15 text-emerald-300',
}

const EMPTY_FORM = {
  name: '',
  category: 'Musculation' as Category,
  muscle_group: '',
  description: '',
}

const inputCls =
  'w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'

const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5'

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Exercise | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  // detailExercise : exercice selectionne pour afficher le modal de detail (null = ferme)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)

  const loadExercises = (s = search, c = catFilter) => {
    const params: Record<string, string> = {}
    if (c) params.category = c
    if (s) params.search = s
    api
      .get('/exercises', { params })
      .then((res) => setExercises(res.data.exercises))
      .catch(() => toast.error('Impossible de charger les exercices'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadExercises() }, [catFilter])

  // Debounce 350ms sur la recherche textuelle
  useEffect(() => {
    const t = setTimeout(() => loadExercises(), 350)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (ex: Exercise) => {
    setEditTarget(ex)
    setForm({
      name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group ?? '',
      description: ex.description ?? '',
    })
    setModalOpen(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editTarget) {
        const res = await api.put(`/exercises/${editTarget.id}`, form)
        setExercises(exercises.map((ex) => (ex.id === editTarget.id ? res.data.exercise : ex)))
        toast.success('Exercice modifie')
      } else {
        const res = await api.post('/exercises', form)
        setExercises([res.data.exercise, ...exercises])
        toast.success('Exercice cree')
      }
      setModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(msg || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/exercises/${id}`)
      setExercises(exercises.filter((ex) => ex.id !== id))
      toast.success('Exercice supprime')
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(msg || 'Impossible de supprimer')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Exercices</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Ajouter
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#1E293B] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                catFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1E293B] border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {cat === '' ? 'Tous' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Chargement...</p>
      ) : exercises.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-sm">Aucun exercice trouve</p>
          <button onClick={openCreate} className="mt-3 text-indigo-400 text-sm hover:underline">
            Creer un exercice
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => setDetailExercise(ex)}
              className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-slate-600 hover:bg-slate-800/70 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-white transition-colors">
                  {ex.name}
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${CAT_COLORS[ex.category]}`}>
                  {ex.category}
                </span>
              </div>
              {ex.muscle_group && <p className="text-xs text-slate-500">{ex.muscle_group}</p>}
              {ex.description && <p className="text-xs text-slate-600 line-clamp-2">{ex.description}</p>}

              {ex.gif_url && (
                <p className="text-xs text-indigo-400/60 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                  Voir la demonstration
                </p>
              )}

              <div className="flex gap-3 mt-auto pt-2 border-t border-slate-700/50">
                {/* stopPropagation : evite d'ouvrir le modal de detail en cliquant Modifier/Supprimer */}
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(ex) }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <Pencil size={12} /> Modifier
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(ex.id) }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors self-center" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detail avec GIF anime */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}

      {/* Modal creation / edition */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={editTarget ? "Modifier l'exercice" : 'Nouvel exercice'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nom *</label>
              <input name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Developpe couche" />
            </div>
            <div>
              <label className={labelCls}>Categorie *</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Groupe musculaire</label>
              <input name="muscle_group" value={form.muscle_group} onChange={handleChange} className={inputCls} placeholder="Pectoraux, Triceps..." />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700/40 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Creer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal confirmation suppression */}
      {deleteId !== null && (
        <Modal onClose={() => setDeleteId(null)} title="Supprimer l'exercice">
          <p className="text-sm text-slate-400 mb-6">Es-tu sur ? Cette action est irreversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700/40 transition-colors">
              Annuler
            </button>
            <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Modal interne reusable -- fond semi-transparent avec backdrop-blur
function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
