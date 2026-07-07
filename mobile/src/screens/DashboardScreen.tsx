import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { BarChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const screenWidth = Dimensions.get('window').width

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Jul', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatMonth(monthStr: string) {
  const [, month] = monthStr.split('-')
  return MONTH_LABELS[month] ?? month
}

interface MonthlyStat { month: string; workout_count: number; total_minutes: number }
interface DailyStat { day: string; workout_count: number; total_minutes: number }
interface RecentWorkout { id: number; title: string; date: string; duration?: number | null }

interface Stats {
  summary: { total_workouts: number; total_minutes: number; avg_duration: number; unique_exercises: number }
  monthly: MonthlyStat[]
  daily: DailyStat[]
  recent: RecentWorkout[]
}

function StatCard({ icon, iconColor, iconBg, label, value }: {
  icon: any; iconColor: string; iconBg: string; label: string; value: string | number
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly')

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/progression')
      setStats(res.data.stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchStats() }, []))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  // ── Données mensuelles : 6 derniers mois ──────────────────
  const monthlyChartData = stats
    ? [...stats.monthly].reverse().slice(-6)
    : []

  // ── Données hebdo : 7 derniers jours, 0 si pas de séance ──
  const weeklyChartData = (() => {
    const result: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = DAY_LABELS[d.getDay()]
      const match = stats?.daily?.find(x => x.day === key)
      result.push({ label, value: match?.workout_count ?? 0 })
    }
    return result
  })()

  const chartLabels = view === 'monthly'
    ? monthlyChartData.map(m => formatMonth(m.month))
    : weeklyChartData.map(d => d.label)

  const chartValues = view === 'monthly'
    ? monthlyChartData.map(m => m.workout_count)
    : weeklyChartData.map(d => d.value)

  const hasData = chartValues.some(v => v > 0)

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : [''],
    datasets: [{ data: chartValues.length > 0 ? chartValues : [0] }],
  }

  const GOAL_LABELS: Record<string, string> = {
    lose: 'Perte de poids',
    maintain: 'Maintien du poids',
    gain: 'Prise de masse',
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <Text style={styles.greeting}>Bonjour, {user?.username} 👋</Text>
      <Text style={styles.goal}>
        Objectif : {GOAL_LABELS[user?.goal ?? 'maintain']}
        {user?.weight ? ` · ${user.weight} kg` : ''}
      </Text>

      {stats && (
        <>
          {/* 4 stats */}
          <View style={styles.statsGrid}>
            <StatCard icon="fitness-outline" iconColor={Colors.primary} iconBg={Colors.primary + '33'} label="Séances" value={stats.summary.total_workouts} />
            <StatCard icon="time-outline" iconColor={Colors.amber} iconBg={Colors.amber + '33'} label="Minutes" value={stats.summary.total_minutes} />
            <StatCard icon="trending-up-outline" iconColor={Colors.emerald} iconBg={Colors.emerald + '33'} label="Moy. min" value={Math.round(stats.summary.avg_duration)} />
            <StatCard icon="barbell-outline" iconColor={Colors.indigo} iconBg={Colors.indigo + '33'} label="Exercices" value={stats.summary.unique_exercises} />
          </View>

          {/* Graphique avec toggle Semaine / Mois */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Séances par {view === 'weekly' ? 'semaine' : 'mois'}
              </Text>
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, view === 'weekly' && styles.toggleBtnActive]}
                  onPress={() => setView('weekly')}
                >
                  <Text style={[styles.toggleBtnText, view === 'weekly' && styles.toggleBtnTextActive]}>
                    Semaine
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, view === 'monthly' && styles.toggleBtnActive]}
                  onPress={() => setView('monthly')}
                >
                  <Text style={[styles.toggleBtnText, view === 'monthly' && styles.toggleBtnTextActive]}>
                    Mois
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {hasData ? (
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                segments={Math.min(4, Math.max(...chartValues))}
                chartConfig={{
                  backgroundColor: Colors.surface,
                  backgroundGradientFrom: Colors.surface,
                  backgroundGradientTo: Colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: () => Colors.textSecondary,
                }}
                showValuesOnTopOfBars
              />
            ) : (
              <Text style={styles.noData}>
                {view === 'weekly' ? 'Aucune séance cette semaine' : 'Aucune donnée mensuelle'}
              </Text>
            )}
          </View>

          {/* Dernières séances */}
          {stats.recent && stats.recent.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dernières séances</Text>
              {stats.recent.map((w, idx) => (
                <View
                  key={w.id}
                  style={[styles.recentItem, idx === stats.recent.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View>
                    <Text style={styles.recentTitle}>{w.title}</Text>
                    <Text style={styles.recentDate}>
                      {new Date(w.date).toLocaleDateString('fr-FR')}
                      {w.duration ? ` · ${w.duration} min` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  greeting: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  goal: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12, padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleBtnText: { fontSize: 12, color: Colors.textSecondary },
  toggleBtnTextActive: { color: Colors.white, fontWeight: '600' },
  noData: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 32, fontSize: 13 },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentTitle: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  recentDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
})
