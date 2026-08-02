import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      createdAt: serverTimestamp(),
      settings: {
        defaultModel: 'gemini',
        byokKeys: {},
      },
    })
    return cred.user
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }
  
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    
    // Check if user doc exists, if not create it
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
        createdAt: serverTimestamp(),
        settings: {
          defaultModel: 'gemini',
          byokKeys: {},
        },
      })
    }
    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  async function getUserDoc(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, loginWithGoogle, logout, getUserDoc }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
