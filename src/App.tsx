import { useCallback, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BreathingFirstLaunch from './components/BreathingFirstLaunch'
import NavigationTransitionShell from './components/NavigationTransition'
import { DiaryAuthProvider } from './context/DiaryAuthContext'
import AppShell from './AppShell'
import LoginPage from './pages/LoginPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  /** Ogni apertura / reload: schermata respiro prima dell’app (nessun salto via localStorage). */
  const [enteredApp, setEnteredApp] = useState(false)

  const onFirstLaunchComplete = useCallback(() => {
    setEnteredApp(true)
  }, [])

  if (!enteredApp) {
    return <BreathingFirstLaunch onComplete={onFirstLaunchComplete} />
  }

  return (
    <DiaryAuthProvider>
      <BrowserRouter>
        <NavigationTransitionShell>
          <Routes>
            <Route path="/registrazione" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/accedi" element={<LoginPage />} />
            <Route path="*" element={<AppShell />} />
          </Routes>
        </NavigationTransitionShell>
      </BrowserRouter>
    </DiaryAuthProvider>
  )
}
