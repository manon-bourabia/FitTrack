import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { Colors } from '../constants/colors'
import { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

// Objectifs disponibles (as const = types exacts)
const GOALS = [
  { value: 'lose' as const, label: 'Perte de poids' },
  { value: 'maintain' as const, label: 'Maintien' },
  { value: 'gain' as const, label: 'Prise de masse' },
]

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis' })
      return
    }
    setLoading(true)
    try {
      await register({
        username,
        email,
        password,
        goal,
        weight: weight ? parseFloat(weight) : undefined,
      })
    } catch (err) {
      const msg = (err as any)?.response?.data?.error
      Toast.show({ type: 'error', text1: msg || "Erreur lors de l'inscription" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>FitTrack</Text>
        <Text style={styles.subtitle}>Créer un compte</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          placeholderTextColor={Colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Poids (kg, optionnel)"
          placeholderTextColor={Colors.textMuted}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Objectif</Text>
        {/* Boutons radio custom — React Native n'a pas de RadioButton natif */}
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.goalBtn, goal === g.value && styles.goalBtnActive]}
              onPress={() => setGoal(g.value)}
            >
              <Text style={[styles.goalBtnText, goal === g.value && styles.goalBtnTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={styles.btnText}>S'inscrire</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 36, fontWeight: 'bold', color: Colors.primary,
    textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 20, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 32,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  label: { color: Colors.textSecondary, marginBottom: 8, fontSize: 14 },
  goalRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  goalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  goalBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goalBtnText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
  goalBtnTextActive: { color: Colors.white, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  footerLink: {
    color: Colors.primaryLight, textAlign: 'center', marginTop: 20, fontSize: 14,
  },
})
