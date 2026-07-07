import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Modal, TextInput, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Colors } from '../constants/colors'
import api from '../services/api'
import { Workout, RootStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<RootStackParamList>

export default function WorkoutsScreen() {
  const navigation = useNavigation<NavProp>()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Workout | null>(null)
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], duration: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const loadWorkouts = async () => {
    try {
      const res = await api.get('/workouts')
      setWorkouts(res.data.workouts)
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur de chargement' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadWorkouts()
    }, [])
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm({ title: '', date: new Date().toISOString().split('T')[0], duration: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (workout: Workout) => {
    setEditTarget(workout)
    setForm({
      title: workout.title,
      date: workout.date.split('T')[0],
      duration: workout.duration ? String(workout.duration) : '',
      notes: workout.notes ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: 'error', text1: 'Le titre est requis' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        date: form.date,
        duration: form.duration ? parseInt(form.duration) : undefined,
        notes: form.notes || undefined,
      }
      if (editTarget) {
        const res = await api.put(`/workouts/${editTarget.id}`, payload)
        const updated = res.data.workout
        // Préserve exercise_count (non renvoyé par PUT)
        setWorkouts(prev => prev.map(w =>
          w.id === editTarget.id
            ? { ...updated, exercise_count: w.exercise_count }
            : w
        ))
        setModalOpen(false)
        Toast.show({ type: 'success', text1: 'Séance modifiée' })
      } else {
        const res = await api.post('/workouts', payload)
        const newWorkout = res.data.workout
        setWorkouts(prev => [newWorkout, ...prev])
        setModalOpen(false)
        // Après création → navigation immédiate vers le détail
        navigation.navigate('WorkoutDetail', {
          workoutId: newWorkout.id,
          title: newWorkout.title,
        })
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.error
      Toast.show({ type: 'error', text1: msg || 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (workout: Workout) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${workout.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/workouts/${workout.id}`)
              setWorkouts(prev => prev.filter(w => w.id !== workout.id))
              Toast.show({ type: 'success', text1: 'Séance supprimée' })
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
      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id, title: item.title })}
          >
            <View style={styles.itemMain}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>
                {new Date(item.date).toLocaleDateString('fr-FR')}
                {item.duration ? ` · ${item.duration} min` : ''}
                {item.exercise_count != null ? ` · ${item.exercise_count} exercice${item.exercise_count !== 1 ? 's' : ''}` : ''}
              </Text>
              {item.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{item.notes}</Text> : null}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openEdit(item)} hitSlop={8} style={styles.actionBtn}>
                <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadWorkouts() }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune séance. Appuie sur + pour commencer !</Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editTarget ? 'Modifier la séance' : 'Nouvelle séance'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Titre de la séance"
              placeholderTextColor={Colors.textMuted}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textMuted}
              value={form.date}
              onChangeText={v => setForm(p => ({ ...p, date: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Durée en minutes (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={form.duration}
              onChangeText={v => setForm(p => ({ ...p, duration: v }))}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Notes (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={form.notes}
              onChangeText={v => setForm(p => ({ ...p, notes: v }))}
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
  list: { padding: 16, paddingBottom: 90 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemMain: { flex: 1 },
  itemTitle: { fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  itemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  itemNotes: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  itemActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  actionBtn: { padding: 4 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, lineHeight: 24 },
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
