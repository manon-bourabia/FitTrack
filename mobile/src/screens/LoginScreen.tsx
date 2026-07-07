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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis' })
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      // PAS de navigation.navigate() ici !
      // AuthContext met user à jour → RootNavigator redirige automatiquement
    } catch (err) {
      const msg = (err as any)?.response?.data?.error
      Toast.show({ type: 'error', text1: msg || 'Email ou mot de passe incorrect' })
    } finally {
      setLoading(false)
    }
  }

  return (
    // KeyboardAvoidingView : remonte le contenu quand le clavier apparaît
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>FitTrack</Text>
        <Text style={styles.subtitle}>Connexion</Text>

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

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={styles.btnText}>Se connecter</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}>Pas encore de compte ? S'inscrire</Text>
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
