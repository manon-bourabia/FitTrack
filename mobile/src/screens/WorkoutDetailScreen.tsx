import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Colors } from '../constants/colors'
import api from '../services/api'
import { Exercise, WorkoutExercise, RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetail'>

interface ExForm {
  sets: string
  reps: string
  weight_used: string
  duration: string
}

export default function WorkoutDetailScreen({ route }: Props) {
  const { workoutId } = route.params

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  // Modal ajout exercice
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedExId, setSelectedExId] = useState<number | null>(null)
  const [exForm, setExForm] = useState<ExForm>({ sets: '', reps: '', weight_used: '', duration: '' })
  const [saving, setSaving] = useState(false)

  // Modal édition stats
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editExTarget, setEditExTarget] = useState<WorkoutExercise | null>(null)

  const loadWorkout = async () => {
    try {
      // Promise.all : charge en parallèle → deux fois plus rapide
      const [wRes, exRes] = await Promise.all([
        api.get(`/workouts/${workoutId}`),
        api.get('/exercises'),
      ])
      setWorkoutExercises(wRes.data.workout.exercises ?? [])
      setAllExercises(exRes.data.exercises)
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur de chargement' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkout()
  }, [workoutId])

  const selectedExercise = allExercises.find(e => e.id === selectedExId)
  const isCardio = selectedExercise?.category === 'Cardio'

  const handleAddExercise = async () => {
    if (!selectedExId) {
      Toast.show({ type: 'error', text1: 'Sélectionne un exercice' })
      return
    }
    setSaving(true)
    try {
      const payload = isCardio
        ? { exercise_id: selectedExId, duration: exForm.duration ? parseInt(exForm.duration) : undefined }
        : {
          exercise_id: selectedExId,
          sets: exForm.sets ? parseInt(exForm.sets) : undefined,
          reps: exForm.reps ? parseInt(exForm.reps) : undefined,
          weight_used: exForm.weight_used ? parseFloat(exForm.weight_used) : undefined,
        }
      const res = await api.post(`/workouts/${workoutId}/exercises`, payload)
      setWorkoutExercises(prev => [...prev, res.data.workoutExercise])
      setAddModalOpen(false)
      setSelectedExId(null)
      setExForm({ sets: '', reps: '', weight_used: '', duration: '' })
      Toast.show({ type: 'success', text1: 'Exercice ajouté' })
    } catch (err) {
      const msg = (err as any)?.response?.data?.error
      Toast.show({ type: 'error', text1: msg || 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  const openEditStats = (we: WorkoutExercise) => {
    setEditExTarget(we)
    setExForm({
      sets: we.sets ? String(we.sets) : '',
      reps: we.reps ? String(we.reps) : '',
      weight_used: we.weight_used ? String(we.weight_used) : '',
      duration: we.duration ? String(we.duration) : '',
    })
    setEditModalOpen(true)
  }

  const handleEditStats = async () => {
    if (!editExTarget) return
    setSaving(true)
    try {
      const ex = allExercises.find(e => e.id === editExTarget.exercise_id)
      const isCardioEdit = ex?.category === 'Cardio'
      const payload = isCardioEdit
        ? { duration: exForm.duration ? parseInt(exForm.duration) : undefined }
        : {
          sets: exForm.sets ? parseInt(exForm.sets) : undefined,
          reps: exForm.reps ? parseInt(exForm.reps) : undefined,
          weight_used: exForm.weight_used ? parseFloat(exForm.weight_used) : undefined,
        }
      // PATCH = mise à jour partielle (vs PUT qui remplace tout)
      await api.patch(`/workouts/${workoutId}/exercises/${editExTarget.id}`, payload)
      setWorkoutExercises(prev => prev.map(we =>
        we.id === editExTarget.id ? { ...we, ...payload } : we
      ))
      setEditModalOpen(false)
      Toast.show({ type: 'success', text1: 'Stats modifiées' })
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur lors de la modification' })
    } finally {
      setSaving(false)
    }
  }

  const confirmRemoveExercise = (we: WorkoutExercise) => {
    Alert.alert(
      'Retirer l\'exercice',
      `Retirer "${we.exercise_name}" de la séance ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/workouts/${workoutId}/exercises/${we.id}`)
              setWorkoutExercises(prev => prev.filter(e => e.id !== we.id))
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

  // Exercices déjà dans la séance (pour ne pas les proposer deux fois)
  const addedExIds = new Set(workoutExercises.map(we => we.exercise_id))

  return (
    <View style={styles.container}>
      <FlatList
        data={workoutExercises}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.exercise_name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemStats}>
                {item.category === 'Cardio'
                  ? item.duration ? `${item.duration}s` : 'Durée non renseignée'
                  : [
                    item.sets ? `${item.sets} séries` : null,
                    item.reps ? `${item.reps} reps` : null,
                    item.weight_used ? `${item.weight_used} kg` : null,
                  ].filter(Boolean).join(' · ') || 'Stats non renseignées'
                }
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openEditStats(item)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemoveExercise(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun exercice. Appuie sur + pour en ajouter.</Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalOpen(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Modal — Ajouter un exercice */}
      <Modal visible={addModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Ajouter un exercice</Text>

            <Text style={styles.label}>Exercice</Text>
            <FlatList
              data={allExercises.filter(e => !addedExIds.has(e.id))}
              keyExtractor={item => String(item.id)}
              style={styles.exList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.exOption, selectedExId === item.id && styles.exOptionActive]}
                  onPress={() => setSelectedExId(item.id)}
                >
                  <Text style={[styles.exOptionText, selectedExId === item.id && { color: Colors.white }]}>
                    {item.name} <Text style={styles.exCat}>({item.category})</Text>
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Tous les exercices sont déjà ajoutés</Text>}
            />

            {/* Formulaire adaptatif selon la catégorie */}
            {selectedExId && (
              isCardio ? (
                <TextInput
                  style={styles.input}
                  placeholder="Durée en secondes (ex: 1800 = 30min)"
                  placeholderTextColor={Colors.textMuted}
                  value={exForm.duration}
                  onChangeText={v => setExForm(p => ({ ...p, duration: v }))}
                  keyboardType="numeric"
                />
              ) : (
                <View style={styles.statsRow}>
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Séries"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.sets}
                    onChangeText={v => setExForm(p => ({ ...p, sets: v }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Reps"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.reps}
                    onChangeText={v => setExForm(p => ({ ...p, reps: v }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Kg"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.weight_used}
                    onChangeText={v => setExForm(p => ({ ...p, weight_used: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              )
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddModalOpen(false); setSelectedExId(null) }}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAddExercise}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.saveBtnText}>Ajouter</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal — Modifier les stats */}
      <Modal visible={editModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Modifier les stats</Text>
            {editExTarget && (() => {
              const ex = allExercises.find(e => e.id === editExTarget.exercise_id)
              const isC = ex?.category === 'Cardio'
              return isC ? (
                <TextInput
                  style={styles.input}
                  placeholder="Durée en secondes"
                  placeholderTextColor={Colors.textMuted}
                  value={exForm.duration}
                  onChangeText={v => setExForm(p => ({ ...p, duration: v }))}
                  keyboardType="numeric"
                />
              ) : (
                <View style={styles.statsRow}>
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Séries"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.sets}
                    onChangeText={v => setExForm(p => ({ ...p, sets: v }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Reps"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.reps}
                    onChangeText={v => setExForm(p => ({ ...p, reps: v }))}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Kg"
                    placeholderTextColor={Colors.textMuted}
                    value={exForm.weight_used}
                    onChangeText={v => setExForm(p => ({ ...p, weight_used: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              )
            })()}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleEditStats}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.saveBtnText}>Modifier</Text>
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
  list: { padding: 16, paddingBottom: 90 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  itemCategory: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  itemStats: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 12, marginLeft: 8 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, lineHeight: 24 },
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
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  label: { color: Colors.textSecondary, marginBottom: 8, fontSize: 13 },
  exList: { maxHeight: 180, marginBottom: 12 },
  exOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  exOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  exOptionText: { color: Colors.textPrimary, fontSize: 14 },
  exCat: { color: Colors.textMuted, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
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
  inputSmall: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
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
