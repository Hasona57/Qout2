import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { createUserWithEmailPassword } from '@/lib/firebase-auth-server'

// GET endpoint for easy browser access
export async function GET(request: NextRequest) {
  return await seedDatabase()
}

// POST endpoint for programmatic access
export async function POST(request: NextRequest) {
  return await seedDatabase()
}

async function seedDatabase() {
  try {
    const { db } = getFirebaseServer()

    // Step 1: Create Permissions
    const permissions = [
      { name: 'products.create', resource: 'products', action: 'create' },
      { name: 'products.read', resource: 'products', action: 'read' },
      { name: 'products.update', resource: 'products', action: 'update' },
      { name: 'products.delete', resource: 'products', action: 'delete' },
      { name: 'inventory.view', resource: 'inventory', action: 'view' },
      { name: 'inventory.manage', resource: 'inventory', action: 'manage' },
      { name: 'sales.pos', resource: 'sales', action: 'pos' },
      { name: 'sales.view', resource: 'sales', action: 'view' },
      { name: 'production.manage', resource: 'production', action: 'manage' },
      { name: 'reports.view', resource: 'reports', action: 'view' },
    ]

    const savedPermissionIds: string[] = []
    const allPermissions = await db.getAll('permissions')
    
    for (const perm of permissions) {
      // Check if permission exists
      const existing = allPermissions.find((p: any) => p.name === perm.name)

      if (!existing) {
        const permId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'perm'
        const newPerm = {
          id: permId,
          ...perm,
          createdAt: new Date().toISOString(),
        }
        
        try {
          await db.set(`permissions/${permId}`, newPerm)
          savedPermissionIds.push(permId)
          console.log(`✅ Created permission: ${perm.name}`)
        } catch (error) {
          console.error(`Error creating permission ${perm.name}:`, error)
        }
      } else {
        savedPermissionIds.push(existing.id)
      }
    }

    // Step 2: Create Roles
    const roles = [
      {
        name: 'admin',
        description: 'Full system access',
      },
      {
        name: 'sales_employee',
        description: 'POS access only',
      },
      {
        name: 'factory_manager',
        description: 'Production management',
      },
      {
        name: 'storekeeper',
        description: 'Inventory management',
      },
      {
        name: 'customer',
        description: 'Customer access',
      },
    ]

    const roleMap: Record<string, string> = {}
    const allRoles = await db.getAll('roles')
    
    for (const roleData of roles) {
      // Check if role exists
      const existing = allRoles.find((r: any) => r.name === roleData.name)

      if (!existing) {
        const roleId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'role'
        const newRole = {
          id: roleId,
          ...roleData,
          createdAt: new Date().toISOString(),
        }
        
        try {
          await db.set(`roles/${roleId}`, newRole)
          roleMap[roleData.name] = roleId
          console.log(`✅ Created role: ${roleData.name}`)
        } catch (error) {
          console.error(`Error creating role ${roleData.name}:`, error)
        }
      } else {
        roleMap[roleData.name] = existing.id
      }
    }

    // Step 3: Create Admin User
    const adminEmail = 'admin@qote.com'
    const adminPassword = 'admin123'

    // Check if admin user exists
    const allUsers = await db.getAll('users')
    const existingAdmin = allUsers.find((u: any) => u.email === adminEmail)

    if (!existingAdmin && roleMap['admin']) {
      try {
        // Create user in Firebase Auth
        const authResult = await createUserWithEmailPassword(adminEmail, adminPassword)
        
        // Create user profile in database
        const adminUser = {
          id: authResult.uid,
          name: 'Admin User',
          email: adminEmail,
          roleId: roleMap['admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await db.set(`users/${authResult.uid}`, adminUser)
        console.log('✅ Created admin user:', adminEmail, '/', adminPassword)
      } catch (error: any) {
        console.error('Error creating admin user:', error)
        // User might already exist in Firebase Auth
        if (error.message && error.message.includes('EMAIL_EXISTS')) {
          console.log('Admin user already exists in Firebase Auth')
        }
      }
    }

    // Step 4: Create POS User
    const posEmail = 'pos@qote.com'
    const posPassword = 'pos123'

    const existingPos = allUsers.find((u: any) => u.email === posEmail)

    if (!existingPos && roleMap['sales_employee']) {
      try {
        // Create user in Firebase Auth
        const authResult = await createUserWithEmailPassword(posEmail, posPassword)
        
        // Create user profile in database
        const posUser = {
          id: authResult.uid,
          name: 'POS Sales Employee',
          email: posEmail,
          roleId: roleMap['sales_employee'],
          isActive: true,
          employeeCode: 'POS001',
          commissionRate: '5.00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await db.set(`users/${authResult.uid}`, posUser)
        console.log('✅ Created POS user:', posEmail, '/', posPassword)
      } catch (error: any) {
        console.error('Error creating POS user:', error)
        // User might already exist in Firebase Auth
        if (error.message && error.message.includes('EMAIL_EXISTS')) {
          console.log('POS user already exists in Firebase Auth')
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        admin: {
          email: adminEmail,
          password: adminPassword,
        },
        pos: {
          email: posEmail,
          password: posPassword,
        },
      },
    })
  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: error.message || 'Seeding failed' },
      { status: 500 }
    )
  }
}

