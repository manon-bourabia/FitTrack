// ExerciseDetailModal — affiche les détails complets d'un exercice avec GIF animé
import { useState } from 'react'
import { X, Dumbbell, Zap, Leaf } from 'lucide-react'
import { Exercise } from '../types'

// Icône et couleur par catégorie
const CAT_STYLE: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Musculation: {
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/15',
    icon: <Dumbbell size={14} />,
  },
  Cardio: {
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    icon: <Zap size={14} />,
  },
  Flexibilité: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    icon: <Leaf size={14} />,
  },
}

interface Props {
  exercise: Exercise
  onClose: () => void
}

export default function ExerciseDetailModal({ exercise, onClose }: Props) {
  // imgError : true si le GIF n'a pas pu charger (affiche un placeholder)
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const style = CAT_STYLE[exercise.category] ?? CAT_STYLE['Musculation']

  // Fermeture en cliquant sur le fond (pas sur la carte)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.color}`}>
              {style.icon}
              {exercise.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zone GIF */}
        <div className="relative bg-slate-900/60 flex items-center justify-center" style={{ height: 220 }}>
          {exercise.gif_url && !imgError ? (
            <>
              {/* Spinner pendant le chargement du GIF */}
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={exercise.gif_url}
                alt={`Démonstration : ${exercise.name}`}
                className={`h-full w-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            // Placeholder si pas de GIF ou si le chargement échoue
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <div className="text-5xl">{exercise.category === 'Cardio' ? '🏃' : exercise.category === 'Flexibilité' ? '🧘' : '🏋️'}</div>
              <p className="text-xs">Illustration non disponible</p>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="px-6 py-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-100">{exercise.name}</h2>

          {exercise.muscle_group && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Groupe musculaire</p>
              <p className="text-sm text-slate-300">{exercise.muscle_group}</p>
            </div>
          )}

          {exercise.description && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-400 leading-relaxed">{exercise.description}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700/40 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
