// Firebase Client Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database, ref, get, set, push, update, remove, query, orderByChild, equalTo, limitToLast, startAt, endAt, onValue, off, DatabaseReference, Query } from 'firebase/database'
import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6mRNIsjJoaY47nL09G_pcMM1cKnf4i2k",
  authDomain: "qout-a6cb4.firebaseapp.com",
  databaseURL: "https://qout-a6cb4-default-rtdb.firebaseio.com",
  projectId: "qout-a6cb4",
  storageBucket: "qout-a6cb4.firebasestorage.app",
  messagingSenderId: "688023840915",
  appId: "1:688023840915:web:276a0f9e30eb67c9af0566",
  measurementId: "G-SVJ70GZHC3"
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Get Firebase services
export const auth: Auth = getAuth(app)
export const database: Database = getDatabase(app)

// Database helper functions
export const db = {
  // Get data from a path
  async get(path: string): Promise<any> {
    try {
      const snapshot = await get(ref(database, path))
      return snapshot.exists() ? snapshot.val() : null
    } catch (error) {
      console.error('Firebase get error:', error)
      throw error
    }
  },

  // Set data at a path
  async set(path: string, data: any): Promise<void> {
    try {
      await set(ref(database, path), data)
    } catch (error) {
      console.error('Firebase set error:', error)
      throw error
    }
  },

  // Push data to a path (creates new key)
  async push(path: string, data: any): Promise<string> {
    try {
      const newRef = push(ref(database, path))
      await set(newRef, data)
      return newRef.key || ''
    } catch (error) {
      console.error('Firebase push error:', error)
      throw error
    }
  },

  // Update data at a path
  async update(path: string, data: any): Promise<void> {
    try {
      await update(ref(database, path), data)
    } catch (error) {
      console.error('Firebase update error:', error)
      throw error
    }
  },

  // Remove data at a path
  async remove(path: string): Promise<void> {
    try {
      await remove(ref(database, path))
    } catch (error) {
      console.error('Firebase remove error:', error)
      throw error
    }
  },

  // Query data
  async query(path: string, options?: {
    orderBy?: string
    equalTo?: any
    limitToLast?: number
    startAt?: any
    endAt?: any
  }): Promise<any[]> {
    try {
      let dbQuery: DatabaseReference | Query = ref(database, path)
      
      if (options?.orderBy) {
        dbQuery = query(dbQuery, orderByChild(options.orderBy))
      }
      if (options?.equalTo !== undefined) {
        dbQuery = query(dbQuery, equalTo(options.equalTo))
      }
      if (options?.limitToLast) {
        dbQuery = query(dbQuery, limitToLast(options.limitToLast))
      }
      if (options?.startAt !== undefined) {
        dbQuery = query(dbQuery, startAt(options.startAt))
      }
      if (options?.endAt !== undefined) {
        dbQuery = query(dbQuery, endAt(options.endAt))
      }

      const snapshot = await get(dbQuery)
      if (!snapshot.exists()) {
        return []
      }
      
      const data = snapshot.val()
      // Convert object to array if needed
      if (typeof data === 'object' && !Array.isArray(data)) {
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
      }
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Firebase query error:', error)
      return []
    }
  },

  // Get all data from a path as array
  async getAll(path: string): Promise<any[]> {
    try {
      const data = await this.get(path)
      if (!data) return []
      if (Array.isArray(data)) return data
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }))
    } catch (error) {
      console.error('Firebase getAll error:', error)
      return []
    }
  }
}

// Auth helper functions
export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Firebase sign in error:', error)
      throw error
    }
  },

  // Create user with email and password
  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Firebase sign up error:', error)
      throw error
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Firebase sign out error:', error)
      throw error
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }
}

// Server-side Firebase helper (for API routes)
export const getFirebaseServer = () => {
  return {
    db,
    auth: firebaseAuth
  }
}

// Helper to get authenticated user data from database
export const getUserData = async (userId: string): Promise<any> => {
  try {
    const userData = await db.get(`users/${userId}`)
    return userData
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}

