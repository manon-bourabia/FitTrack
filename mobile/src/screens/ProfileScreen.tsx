import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, TextInput, Dimensions,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LineChart } from 'react-native-chart-kit'
import { Colors } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { WeightEntry } from '../types'

const screenWidth = Dimensions.get('window').width

interface MonthlyStat { month: string; workout_count: number; total_minutes: number }

const GOAL_LABELS: Record<string, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien du poids',
  gain: 'Prise de masse',
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateShort(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  })
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const [monthly, setMonthly] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)

  // Suivi du poids
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [weightLoading, setWeightLoading] = useState(true)
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightForm, setWeightForm] = useState({
    weight: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [savingWeight, setSavingWeight] = useState(false)

  const fetchAll = async () => {
    try {
      const [statsRes, weightRes] = await Promise.all([
        api.get('/stats/progression'),
        api.get('/weight'),
      ])
      setMonthly(statsRes.data.stats.monthly ?? [])
      setWeightEntries(weightRes.data.entries ?? [])
    } catch {
      // Silencieux
    } finally {
      setLoading(false)
      setWeightLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchAll() }, []))

  const handleAddWeight = async () => {
    if (!weightForm.weight || !weightForm.date) {
      Alert.alert('Erreur', 'Poids et date requis')
      return
    }
    setSavingWeight(true)
    try {
      const res = await api.post('/weight', {
        weight: parseFloat(weightForm.weight),
        date: weightForm.date,
        note: weightForm.note || undefined,
      })
      setWeightEntries(prev => [res.data.entry, ...prev])
      setWeightForm({ weight: '', date: new Date().toISOString().slice(0, 10), note: '' })
      setShowWeightForm(false)
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la pesée")
    } finally {
      setSavingWeight(false)
    }
  }

  const handleDeleteWeight = (id: number) => {
    Alert.alert('Supprimer', 'Supprimer cette pesée ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/weight/${id}`)
            setWeightEntries(prev => prev.filter(e => e.id !== id))
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer')
          }
        },
      },
    ])
  }

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    )
  }

  // Avatar avec initiales
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?'

  // Activité récente : 4 derniers mois
  const recentMonths = [...monthly].reverse().slice(0, 4)

  // Données graphique poids : 30 dernières entrées en ordre chronologique
  const weightChartEntries = [...weightEntries].reverse().slice(-30)
  const hasWeightChart = weightChartEntries.length >= 2

  const weightChartData = {
    labels: weightChartEntries.map(e => formatDateShort(e.date)),
    datasets: [{ data: weightChartEntries.map(e => Number(e.weight)) }],
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + infos */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Infos profil */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mon profil</Text>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoLabel}>Objectif</Text>
          <Text style={styles.infoValue}>{user?.goal ? GOAL_LABELS[user.goal] : '—'}</Text>
        </View>
        {user?.weight && (
          <View style={styles.infoRow}>
            <Ionicons name="scale-outline" size={16} color={Colors.amber} />
            <Text style={styles.infoLabel}>Poids</Text>
            <Text style={styles.infoValue}>{user.weight} kg</Text>
          </View>
        )}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="calendar-outline" size={16} color={Colors.emerald} />
          <Text style={styles.infoLabel}>Membre depuis</Text>
          <Text style={styles.infoValue}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
          </Text>
        </View>
      </View>

      {/* Activité mensuelle */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activité récente</Text>
        {recentMonths.length === 0 ? (
          <Text style={styles.empty}>Aucune activité enregistrée</Text>
        ) : (
          recentMonths.map((m) => {
            const [year, month] = m.month.split('-')
            const date = new Date(Number(year), Number(month) - 1)
            const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            return (
              <View key={m.month} style={styles.monthRow}>
                <Text style={styles.monthLabel}>{label}</Text>
                <Text style={styles.monthValue}>
                  {m.workout_count} séance{m.workout_count !== 1 ? 's' : ''} · {m.total_minutes} min
                </Text>
              </View>
            )
          })
        )}
      </View>

      {/* ── Suivi du poids ─────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Évolution du poids</Text>
          <TouchableOpacity
            style={styles.addWeightBtn}
            onPress={() => setShowWeightForm(v => !v)}
          >
            <Ionicons name="add" size={14} color={Colors.white} />
            <Text style={styles.addWeightBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Formulaire ajout pesée */}
        {showWeightForm && (
          <View style={styles.weightForm}>
            <View style={styles.weightFormRow}>
              <TextInput
                style={[styles.weightInput, { flex: 1 }]}
                placeholder="Poids (kg)"
                placeholderTextColor={Colors.textMuted}
                value={weightForm.weight}
                onChangeText={v => setWeightForm(p => ({ ...p, weight: v }))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.weightInput, { flex: 1.5 }]}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={Colors.textMuted}
                value={weightForm.date}
                onChangeText={v => setWeightForm(p => ({ ...p, date: v }))}
              />
            </View>
            <TextInput
              style={styles.weightInput}
              placeholder="Note (optionnel, ex: après sport)"
              placeholderTextColor={Colors.textMuted}
              value={weightForm.note}
              onChangeText={v => setWeightForm(p => ({ ...p, note: v }))}
            />
            <View style={styles.weightFormActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWeightForm(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingWeight && { opacity: 0.6 }]}
                onPress={handleAddWeight}
                disabled={savingWeight}
              >
                {savingWeight
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.saveBtnText}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Graphique linéaire */}
        {weightLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : hasWeightChart ? (
          <LineChart
            data={weightChartData}
            width={screenWidth - 64}
            height={180}
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: () => Colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
            }}
            bezier
            style={{ marginTop: 8 }}
            // Afficher seulement certains labels pour éviter l'encombrement
            formatXLabel={(label) => label}
            hidePointsAtIndex={weightChartEntries.length > 8
              ? weightChartEntries.map((_, i) => i % 2 === 0 ? -1 : i).filter(i => i === -1 ? false : true)
              : []}
          />
        ) : (
          <Text style={styles.empty}>
            {weightEntries.length === 1
              ? 'Ajoute au moins 2 pesées pour voir l\'évolution'
              : 'Aucune pesée enregistrée. Commence maintenant !'}
          </Text>
        )}

        {/* 5 dernières pesées */}
        {weightEntries.length > 0 && (
          <View style={styles.weightList}>
            <Text style={styles.weightListTitle}>Dernières pesées</Text>
            {weightEntries.slice(0, 5).map(entry => (
              <View key={entry.id} style={styles.weightRow}>
                <View>
                  <Text style={styles.weightValue}>{Number(entry.weight).toFixed(1)} kg</Text>
                  <Text style={styles.weightDate}>{formatDate(entry.date)}</Text>
                  {entry.note && <Text style={styles.weightNote}>{entry.note}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteWeight(entry.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bouton déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.red} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  avatar: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  username: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14 },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  monthRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  monthLabel: { color: Colors.textSecondary, fontSize: 14, textTransform: 'capitalize' },
  monthValue: { color: Colors.textPrimary, fontSize: 14 },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16, fontSize: 13 },

  // Suivi poids
  addWeightBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  addWeightBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  weightForm: {
    backgroundColor: Colors.dark,
    borderRadius: 10, padding: 12,
    marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    gap: 8,
  },
  weightFormRow: { flexDirection: 'row', gap: 8 },
  weightInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 10,
    fontSize: 14,
  },
  weightFormActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, padding: 10, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  saveBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 8, padding: 10, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  weightList: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  weightListTitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  weightRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  weightValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  weightDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  weightNote: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 1 },

  // Déconnexion
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.red + '44',
    marginBottom: 32,
  },
  logoutText: { color: Colors.red, fontWeight: '600', fontSize: 16 },
})
