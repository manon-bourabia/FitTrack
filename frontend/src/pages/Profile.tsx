import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { User, Target, Scale, Calendar, Activity, Pencil, X, Check, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ProgressionStats, WeightHistory } from '../types'
import LoadingSpinner from '../components/Layout/LoadingSpinner'
import toast from 'react-hot-toast'
import api from '../services/api'

const GOAL_LABELS: Record<string, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien du poids',
  gain: 'Prise de masse',
}

const GOAL_COLORS: Record<string, string> = {
  lose: 'text-amber-400',
  maintain: 'text-emerald-400',
  gain: 'text-violet-400',
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Jul', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMonth(m: string) {
  const [, month] = m.split('-')
  return MONTH_LABELS[month] ?? month
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#F1F5F9',
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { data, loading } = useFetch<ProgressionStats>('/stats/progression')
  const { data: weightData, loading: weightLoading, refetch: refetchWeight } = useFetch<WeightHistory>('/weight')

  // État du formulaire d'édition profil
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    weight: user?.weight ? String(user.weight) : '',
    goal: user?.goal ?? 'maintain',
  })

  // État du formulaire d'ajout de pesée
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightForm, setWeightForm] = useState({
    weight: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [savingWeight, setSavingWeight] = useState(false)

  const handleEdit = () => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      weight: user?.weight ? String(user.weight) : '',
      goal: user?.goal ?? 'maintain',
    })
    setEditing(true)
  }

  const handleCancel = () => setEditing(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser?.({
        username: form.username,
        email: form.email,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        goal: form.goal,
      })
      toast.success('Profil mis à jour !')
      setEditing(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Erreur lors de la mise à jour'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleAddWeight = async () => {
    if (!weightForm.weight || !weightForm.date) {
      toast.error('Poids et date requis')
      return
    }
    setSavingWeight(true)
    try {
      await api.post('/weight', {
        weight: parseFloat(weightForm.weight),
        date: weightForm.date,
        note: weightForm.note || undefined,
      })
      toast.success('Pesée enregistrée !')
      setWeightForm({ weight: '', date: new Date().toISOString().slice(0, 10), note: '' })
      setShowWeightForm(false)
      refetchWeight()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSavingWeight(false)
    }
  }

  const handleDeleteWeight = async (id: number) => {
    try {
      await api.delete(`/weight/${id}`)
      toast.success('Pesée supprimée')
      refetchWeight()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) return <LoadingSpinner />

  const stats = data?.stats
  const chartData = stats
    ? [...stats.monthly].reverse().map((m) => ({
        name: formatMonth(m.month),
        Séances: m.workout_count,
      }))
    : []

  // Données pour le graphique de poids : ordre chronologique, 30 dernières entrées
  const weightChartData = weightData?.entries
    ? [...weightData.entries].reverse().slice(-30).map((e) => ({
        date: e.date.slice(0, 10),
        Poids: Number(e.weight),
        label: formatDate(e.date),
      }))
    : []

  const weightMin = weightChartData.length
    ? Math.floor(Math.min(...weightChartData.map((d) => d.Poids)) - 2)
    : 'auto'
  const weightMax = weightChartData.length
    ? Math.ceil(Math.max(...weightChartData.map((d) => d.Poids)) + 2)
    : 'auto'

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'FT'

  return (
    <div className="space-y-4 md:space-y-6 w-full md:max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100">Mon profil</h1>

      {/* Carte utilisateur */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{user?.username}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {data?.user.member_since && (
                <p className="text-xs text-slate-500 mt-1">
                  Membre depuis {formatDate(data.user.member_since)}
                </p>
              )}
            </div>
          </div>

          {/* Bouton éditer / annuler */}
          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
            >
              <Pencil size={14} />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700/50 transition-colors"
              >
                <X size={14} /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
              >
                <Check size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {/* Formulaire d'édition */}
        {editing ? (
          <div className="mt-6 pt-5 border-t border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Nom d'utilisateur</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="ex : 75.5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Objectif</label>
              <select
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value as 'lose' | 'maintain' | 'gain' })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="lose">Perte de poids</option>
                <option value="maintain">Maintien du poids</option>
                <option value="gain">Prise de masse</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-700/50">
            <InfoItem
              icon={<Scale size={15} className="text-slate-500" />}
              label="Poids"
              value={user?.weight ? `${user.weight} kg` : '—'}
            />
            <InfoItem
              icon={<Target size={15} className="text-slate-500" />}
              label="Objectif"
              value={
                <span className={GOAL_COLORS[user?.goal ?? 'maintain']}>
                  {GOAL_LABELS[user?.goal ?? 'maintain']}
                </span>
              }
            />
            <InfoItem
              icon={<Activity size={15} className="text-slate-500" />}
              label="Séances"
              value={stats?.summary.total_workouts ?? 0}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-500">Minutes totales</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats?.summary.total_minutes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">d'entraînement</p>
        </div>
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-violet-400" />
            <span className="text-xs text-slate-500">Exercices maîtrisés</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats?.summary.unique_exercises ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">exercices différents</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Activité mensuelle</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
              <Bar dataKey="Séances" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-10">Aucune donnée d'activité</p>
        )}
      </div>

      {stats?.byCategory && stats.byCategory.length > 0 && (
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Répartition par type</h3>
          <div className="space-y-3">
            {stats.byCategory.map((cat) => {
              const total = stats.byCategory.reduce((a, c) => a + c.exercise_count, 0)
              const pct = total > 0 ? Math.round((cat.exercise_count / total) * 100) : 0
              const colors: Record<string, string> = {
                Musculation: '#6366F1', Cardio: '#F59E0B', Flexibilité: '#10B981',
              }
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className="text-xs text-slate-400">{cat.category}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[cat.category] ?? '#94A3B8' }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Suivi du poids ───────────────────────────────────────── */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Évolution du poids</h3>
          <button
            onClick={() => setShowWeightForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Plus size={12} />
            Ajouter une pesée
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showWeightForm && (
          <div className="mb-5 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="ex : 74.5"
                value={weightForm.weight}
                onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Date</label>
              <input
                type="date"
                value={weightForm.date}
                onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Note (optionnel)</label>
              <input
                type="text"
                placeholder="ex : après sport"
                value={weightForm.note}
                onChange={(e) => setWeightForm({ ...weightForm, note: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowWeightForm(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddWeight}
                disabled={savingWeight}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
              >
                <Check size={12} />
                {savingWeight ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* Graphique linéaire */}
        {weightLoading ? (
          <p className="text-slate-500 text-sm text-center py-8">Chargement…</p>
        ) : weightChartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[weightMin, weightMax]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit=" kg" width={52} />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => [`${val} kg`, 'Poids'] as any}
                labelFormatter={(label) => {
                  const entry = weightChartData.find((d) => d.date === label)
                  return entry?.label ?? label
                }}
              />
              {user?.goal === 'lose' && user.weight && (
                <ReferenceLine y={user.weight} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'actuel', position: 'right', fontSize: 10, fill: '#F59E0B' }} />
              )}
              <Line type="monotone" dataKey="Poids" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: '#6366F1' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">
            {weightData?.entries.length === 1
              ? 'Ajoute au moins 2 pesées pour voir l\'évolution.'
              : 'Aucune pesée enregistrée. Commence maintenant !'}
          </p>
        )}

        {/* Liste des 5 dernières pesées */}
        {weightData?.entries && weightData.entries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
            <p className="text-xs text-slate-500 mb-2">Dernières pesées</p>
            {weightData.entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-200">{Number(entry.weight).toFixed(1)} kg</span>
                  <span className="text-slate-500 text-xs">{formatDate(entry.date)}</span>
                  {entry.note && <span className="text-slate-600 text-xs italic">{entry.note}</span>}
                </div>
                <button
                  onClick={() => handleDeleteWeight(entry.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  )
}
