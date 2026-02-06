// Server-side Firebase Auth using REST API
const FIREBASE_API_KEY = "AIzaSyB6mRNIsjJoaY47nL09G_pcMM1cKnf4i2k"
const FIREBASE_AUTH_DOMAIN = "qout-a6cb4.firebaseapp.com"

export async function signInWithEmailPassword(email: string, password: string) {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Authentication failed')
    }

    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    }
  } catch (error: any) {
    console.error('Firebase Auth REST API error:', error)
    throw error
  }
}

export async function createUserWithEmailPassword(email: string, password: string) {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed')
    }

    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    }
  } catch (error: any) {
    console.error('Firebase Auth REST API error:', error)
    throw error
  }
}

// Verify Firebase ID token and get user ID
export async function verifyIdToken(idToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.users || data.users.length === 0) {
      return null
    }

    return data.users[0].localId || null
  } catch (error: any) {
    console.error('Firebase token verification error:', error)
    return null
  }
}

