import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ActivityIndicator, RefreshControl, Alert, Image, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { Colors } from '../constants/colors'
import api from '../services/api'
import { Exercise } from '../types'

const CATEGORIES = ['Musculation', 'Cardio', 'Flexibilité'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_COLORS: Record<Category, string> = {
  Musculation: Colors.indigo,
  Cardio: Colors.amber,
  Flexibilité: Colors.emerald,
}

const CATEGORY_EMOJI: Record<Category, string> = {
  Musculation: '🏋️',
  Cardio: '🏃',
  Flexibilité: '🧘',
}

// Vérifie qu'une URL est valide et commence par http/https
// Le composant Image natif crashe en layout si l'URI est malformée
function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const encoded = encodeURI(url)
    return encoded.startsWith('http://') || encoded.startsWith('https://')
  } catch {
    return false
  }
}

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  // Modal créer/modifier
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Exercise | null>(null)
  const [form, setForm] = useState({ name: '', category: 'Musculation' as Category, muscle_group: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Modal détail (avec GIF)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [gifLoaded, setGifLoaded] = useState(false)
  const [gifError, setGifError] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadExercises = async () => {
    try {
      const res = await api.get('/exercises', { params: search ? { search } : {} })
      setExercises(res.data.exercises)
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur de chargement' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadExercises(), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', category: 'Musculation', muscle_group: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (exercise: Exercise) => {
    setEditTarget(exercise)
    setForm({
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group ?? '',
      description: exercise.description ?? '',
    })
    setModalOpen(true)
  }

  const openDetail = (exercise: Exercise) => {
    setGifLoaded(false)
    setGifError(false)
    setDetailExercise(exercise)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Le nom est requis' })
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const res = await api.put(`/exercises/${editTarget.id}`, form)
        setExercises(prev => prev.map(e => e.id === editTarget.id ? res.data.exercise : e))
        Toast.show({ type: 'success', text1: 'Exercice modifié' })
      } else {
        const res = await api.post('/exercises', form)
        setExercises(prev => [res.data.exercise, ...prev])
        Toast.show({ type: 'success', text1: 'Exercice créé' })
      }
      setModalOpen(false)
    } catch (err) {
      const msg = (err as any)?.response?.data?.error
      Toast.show({ type: 'error', text1: msg || 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (exercise: Exercise) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${exercise.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/exercises/${exercise.id}`)
              setExercises(prev => prev.filter(e => e.id !== exercise.id))
              Toast.show({ type: 'success', text1: 'Exercice supprimé' })
            } catch {
              Toast.show({ type: 'error', text1: 'Erreur lors de la suppression' })
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un exercice..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openDetail(item)}>
            <View style={styles.itemLeft}>
              <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>
                  {item.category}{item.muscle_group ? ` · ${item.muscle_group}` : ''}
                </Text>
                {isValidHttpUrl(item.gif_url) && (
                  <Text style={styles.gifBadge}>▶ Voir la démonstration</Text>
                )}
              </View>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => openEdit(item)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadExercises() }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun exercice trouvé</Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* ── Modal DÉTAIL avec GIF ─────────────────────────── */}
      <Modal visible={!!detailExercise} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.detailModal}>
            {detailExercise && (
              <>
                {/* Header */}
                <View style={styles.detailHeader}>
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[detailExercise.category] + '33' }]}>
                    <Text style={[styles.catBadgeText, { color: CATEGORY_COLORS[detailExercise.category] }]}>
                      {detailExercise.category}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailExercise(null)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Zone GIF */}
                <View style={styles.gifZone}>
                  {isValidHttpUrl(detailExercise.gif_url) && !gifError ? (
                    <>
                      {!gifLoaded && (
                        <ActivityIndicator color={Colors.primary} style={StyleSheet.absoluteFill} />
                      )}
                      <Image
                        source={{ uri: encodeURI(detailExercise.gif_url!) }}
                        style={[styles.gif, gifLoaded ? { opacity: 1 } : { opacity: 0 }]}
                        resizeMode="contain"
                        onLoad={() => setGifLoaded(true)}
                        onError={() => { setGifError(true); setGifLoaded(false) }}
                      />
                    </>
                  ) : (
                    <View style={styles.gifPlaceholder}>
                      <Text style={styles.gifEmoji}>{CATEGORY_EMOJI[detailExercise.category]}</Text>
                      <Text style={styles.gifPlaceholderText}>
                        {gifError ? 'Impossible de charger le GIF' : 'Illustration non disponible'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Infos */}
                <ScrollView style={styles.detailBody}>
                  <Text style={styles.detailName}>{detailExercise.name}</Text>
                  {detailExercise.muscle_group && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionLabel}>GROUPE MUSCULAIRE</Text>
                      <Text style={styles.detailSectionValue}>{detailExercise.muscle_group}</Text>
                    </View>
                  )}
                  {detailExercise.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionLabel}>DESCRIPTION</Text>
                      <Text style={styles.detailSectionValue}>{detailExercise.description}</Text>
                    </View>
                  )}
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.detailEditBtn}
                      onPress={() => { setDetailExercise(null); openEdit(detailExercise) }}
                    >
                      <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                      <Text style={styles.detailEditBtnText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailCloseBtn}
                      onPress={() => setDetailExercise(null)}
                    >
                      <Text style={styles.detailCloseBtnText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal CRÉER / MODIFIER ──────────────────────── */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editTarget ? 'Modifier' : 'Nouvel exercice'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de l'exercice"
              placeholderTextColor={Colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
            />

            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, form.category === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                  onPress={() => setForm(p => ({ ...p, category: cat }))}
                >
                  <Text style={[styles.catBtnText, form.category === cat && { color: Colors.white }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Groupe musculaire (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={form.muscle_group}
              onChangeText={v => setForm(p => ({ ...p, muscle_group: v }))}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.saveBtnText}>{editTarget ? 'Modifier' : 'Créer'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, padding: 12, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 90 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  itemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  gifBadge: { fontSize: 11, color: Colors.primaryLight, marginTop: 3 },
  itemActions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  actionBtn: { padding: 6 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  fab: {
    position: 'absolute',
    bottom: 24, right: 24,
    backgroundColor: Colors.primary,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },

  // Detail modal
  detailModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catBadgeText: { fontSize: 12, fontWeight: '600' },
  gifZone: {
    height: 200,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: { width: '100%', height: '100%' },
  gifPlaceholder: { alignItems: 'center', gap: 8 },
  gifEmoji: { fontSize: 48 },
  gifPlaceholderText: { fontSize: 13, color: Colors.textMuted },
  detailBody: { padding: 20 },
  detailName: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  detailSection: { marginBottom: 14 },
  detailSectionLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  detailSectionValue: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  detailEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
  },
  detailEditBtnText: { color: Colors.primary, fontWeight: '600' },
  detailCloseBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  detailCloseBtnText: { color: Colors.textSecondary, fontWeight: '600' },

  // Create/edit modal
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  input: {
    backgroundColor: Colors.dark,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  label: { color: Colors.textSecondary, marginBottom: 8, fontSize: 13 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  catBtnText: { color: Colors.textSecondary, fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '600' },
})
