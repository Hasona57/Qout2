// Firebase helper functions for server-side operations
import { getFirebaseServer, getUserData } from './firebase'

// Helper to find user by email in Firebase Realtime Database
export async function findUserByEmail(email: string): Promise<any> {
  const { db } = getFirebaseServer()
  
  try {
    // Get all users and find by email
    const users = await db.getAll('users')
    const user = users.find((u: any) => u.email === email && u.isActive !== false)
    return user || null
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

// Helper to get user role
export async function getUserRole(roleId: string): Promise<any> {
  const { db } = getFirebaseServer()
  
  try {
    if (!roleId) return null
    const role = await db.get(`roles/${roleId}`)
    return role ? { id: roleId, ...role } : null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

// Helper to update user last login
export async function updateUserLastLogin(userId: string): Promise<void> {
  const { db } = getFirebaseServer()
  
  try {
    await db.update(`users/${userId}`, {
      lastLoginAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// Helper to create user profile in database (after Firebase Auth signup)
export async function createUserProfile(firebaseUid: string, userData: any): Promise<void> {
  const { db } = getFirebaseServer()
  
  try {
    await db.set(`users/${firebaseUid}`, {
      ...userData,
      id: firebaseUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

