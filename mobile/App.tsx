import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import { Colors } from './src/constants/colors'
import { RootStackParamList, TabParamList } from './src/types'

import LoadingSpinner from './src/components/LoadingSpinner'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import ExercisesScreen from './src/screens/ExercisesScreen'
import WorkoutsScreen from './src/screens/WorkoutsScreen'
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen'
import ProfileScreen from './src/screens/ProfileScreen'

// Création des navigateurs (fabriques de composants)
const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

// Lookup centralisé pour les icônes des onglets (filled/outline)
const TAB_ICONS: Record<keyof TabParamList, { active: string; inactive: string }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Exercises: { active: 'barbell', inactive: 'barbell-outline' },
  Workouts: { active: 'calendar', inactive: 'calendar-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
}

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Dashboard: 'Accueil',
  Exercises: 'Exercices',
  Workouts: 'Séances',
  Profile: 'Profil',
}

// Navigation à onglets (visible seulement quand connecté)
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // focused = true si cet onglet est actif
          const icons = TAB_ICONS[route.name]
          const iconName = focused ? icons.active : icons.inactive
          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarLabel: TAB_LABELS[route.name as keyof TabParamList],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
        },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} options={{ title: 'Exercices' }} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} options={{ title: 'Séances' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  )
}

// Navigateur racine : bascule entre Auth et App selon l'état user
function RootNavigator() {
  const { user, loading } = useAuth()

  // Affiche un spinner pendant la lecture du token AsyncStorage
  if (loading) return <LoadingSpinner />

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Utilisateur connecté → onglets + WorkoutDetail
          <>
            <Stack.Screen name="AppTabs" component={AppTabs} />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.title ?? 'Séance',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.textPrimary,
                headerShadowVisible: false,
              })}
            />
          </>
        ) : (
          // Non connecté → Login + Register
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      <Toast topOffset={52} />
    </NavigationContainer>
  )
}

// Composant racine — enveloppe tout dans AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  )
}
