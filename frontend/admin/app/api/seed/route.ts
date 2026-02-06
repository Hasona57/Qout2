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

    // Refresh users list after admin creation
    const updatedUsers = await db.getAll('users')
    const existingPos = updatedUsers.find((u: any) => u.email === posEmail)

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

    // Step 5: Create Sizes
    const sizes = [
      { code: '1', nameAr: '1', nameEn: '1', sortOrder: 1 },
      { code: '2', nameAr: '2', nameEn: '2', sortOrder: 2 },
      { code: 'FREE_SIZE', nameAr: 'مقاس حر', nameEn: 'Free Size', sortOrder: 3 },
    ]

    let createdSizes = 0
    const allSizes = await db.getAll('sizes')
    for (const sizeData of sizes) {
      const existing = allSizes.find((s: any) => s.code === sizeData.code)
      if (!existing) {
        const sizeId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'size'
        try {
          await db.set(`sizes/${sizeId}`, {
            id: sizeId,
            ...sizeData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          createdSizes++
          console.log(`✅ Created size: ${sizeData.nameEn}`)
        } catch (error) {
          console.error(`Error creating size ${sizeData.nameEn}:`, error)
        }
      }
    }

    // Step 6: Create Colors
    const colors = [
      { code: 'BLACK', nameAr: 'أسود', nameEn: 'Black', hexCode: '#000000', sortOrder: 1 },
      { code: 'WHITE', nameAr: 'أبيض', nameEn: 'White', hexCode: '#FFFFFF', sortOrder: 2 },
      { code: 'OFF_WHITE', nameAr: 'اوف وايت', nameEn: 'Off White', hexCode: '#FAF9F6', sortOrder: 3 },
      { code: 'PETROLI', nameAr: 'بترولي', nameEn: 'Petroli', hexCode: '#005F6B', sortOrder: 4 },
      { code: 'JANZARI', nameAr: 'جنزاري', nameEn: 'Janzari', hexCode: '#008080', sortOrder: 5 },
      { code: 'BROWN', nameAr: 'بني', nameEn: 'Brown', hexCode: '#8B4513', sortOrder: 6 },
      { code: 'CAMEL', nameAr: 'جملي', nameEn: 'Camel', hexCode: '#C19A6B', sortOrder: 7 },
      { code: 'GREEN', nameAr: 'اخضر', nameEn: 'Green', hexCode: '#008000', sortOrder: 8 },
      { code: 'OLIVE', nameAr: 'زيتي', nameEn: 'Olive', hexCode: '#808000', sortOrder: 9 },
      { code: 'ZAYTOUNI', nameAr: 'زيتوني', nameEn: 'Zaytouni', hexCode: '#6B8E23', sortOrder: 10 },
      { code: 'MINT_GREEN', nameAr: 'منت جرين', nameEn: 'Mint Green', hexCode: '#98FB98', sortOrder: 11 },
      { code: 'RED', nameAr: 'احمر', nameEn: 'Red', hexCode: '#FF0000', sortOrder: 12 },
      { code: 'NABYTI', nameAr: 'نبيتي', nameEn: 'Nabyti', hexCode: '#8B0000', sortOrder: 13 },
      { code: 'BETINGANI', nameAr: 'بتنجاني', nameEn: 'Betingani', hexCode: '#4B0082', sortOrder: 14 },
      { code: 'ANABI', nameAr: 'عنابي', nameEn: 'Anabi', hexCode: '#800020', sortOrder: 15 },
      { code: 'YELLOW', nameAr: 'اصفر', nameEn: 'Yellow', hexCode: '#FFFF00', sortOrder: 16 },
      { code: 'MUSTARD', nameAr: 'مستطرده', nameEn: 'Mustard', hexCode: '#FFDB58', sortOrder: 17 },
      { code: 'SIMON', nameAr: 'سيمون', nameEn: 'Simon', hexCode: '#FA8072', sortOrder: 18 },
      { code: 'GOLD', nameAr: 'دهبي', nameEn: 'Gold', hexCode: '#FFD700', sortOrder: 19 },
      { code: 'SILVER', nameAr: 'فضي', nameEn: 'Silver', hexCode: '#C0C0C0', sortOrder: 20 },
      { code: 'GRAY', nameAr: 'رصاصي', nameEn: 'Gray', hexCode: '#808080', sortOrder: 21 },
      { code: 'BLUE', nameAr: 'ازرق', nameEn: 'Blue', hexCode: '#0000FF', sortOrder: 22 },
      { code: 'PINK', nameAr: 'زهري', nameEn: 'Pink', hexCode: '#FFC0CB', sortOrder: 23 },
      { code: 'NAVY', nameAr: 'كحلي', nameEn: 'Navy', hexCode: '#000080', sortOrder: 24 },
      { code: 'BABY_BLUE', nameAr: 'بيبي بلو', nameEn: 'Baby Blue', hexCode: '#89CFF0', sortOrder: 25 },
      { code: 'BEIGE', nameAr: 'بيج', nameEn: 'Beige', hexCode: '#F5F5DC', sortOrder: 26 },
      { code: 'SKY_BLUE', nameAr: 'ازرق سماوي', nameEn: 'Sky Blue', hexCode: '#87CEEB', sortOrder: 27 },
      { code: 'LAVENDER', nameAr: 'لافندر', nameEn: 'Lavender', hexCode: '#E6E6FA', sortOrder: 28 },
      { code: 'BURGUNDY', nameAr: 'برجاندي', nameEn: 'Burgundy', hexCode: '#800020', sortOrder: 29 },
      { code: 'CASHMERE', nameAr: 'كشميري', nameEn: 'Cashmere', hexCode: '#E6D5B8', sortOrder: 30 },
      { code: 'MAUVE', nameAr: 'موف', nameEn: 'Mauve', hexCode: '#E0B0FF', sortOrder: 31 },
      { code: 'ROSE', nameAr: 'روز', nameEn: 'Rose', hexCode: '#FF007F', sortOrder: 32 },
      { code: 'TURQUOISE', nameAr: 'تركواز', nameEn: 'Turquoise', hexCode: '#40E0D0', sortOrder: 33 },
    ]

    let createdColors = 0
    const allColors = await db.getAll('colors')
    for (const colorData of colors) {
      const existing = allColors.find((c: any) => c.code === colorData.code)
      if (!existing) {
        const colorId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'color'
        try {
          await db.set(`colors/${colorId}`, {
            id: colorId,
            ...colorData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          createdColors++
          console.log(`✅ Created color: ${colorData.nameEn}`)
        } catch (error) {
          console.error(`Error creating color ${colorData.nameEn}:`, error)
        }
      }
    }

    // Step 7: Create Categories
    const categories = [
      { nameAr: 'عبايات', nameEn: 'Abayas', sortOrder: 1 },
      { nameAr: 'جاكيتات', nameEn: 'Jackets', sortOrder: 2 },
      { nameAr: 'فساتين', nameEn: 'Dresses', sortOrder: 3 },
    ]

    let createdCategories = 0
    const allCategories = await db.getAll('categories')
    for (const categoryData of categories) {
      const existing = allCategories.find((c: any) => c.nameEn === categoryData.nameEn)
      if (!existing) {
        const categoryId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'cat'
        try {
          await db.set(`categories/${categoryId}`, {
            id: categoryId,
            ...categoryData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          createdCategories++
          console.log(`✅ Created category: ${categoryData.nameEn}`)
        } catch (error) {
          console.error(`Error creating category ${categoryData.nameEn}:`, error)
        }
      }
    }

    // Step 8: Create Stock Locations
    const locations = [
      { name: 'Store', address: 'Store Address' },
      { name: 'Warehouse', address: 'Main Warehouse' },
    ]

    let createdLocations = 0
    const allLocations = await db.getAll('stock_locations')
    for (const locationData of locations) {
      const existing = allLocations.find((l: any) => l.name === locationData.name)
      if (!existing) {
        const locationId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'loc'
        try {
          await db.set(`stock_locations/${locationId}`, {
            id: locationId,
            ...locationData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          createdLocations++
          console.log(`✅ Created location: ${locationData.name}`)
        } catch (error) {
          console.error(`Error creating location ${locationData.name}:`, error)
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
        seeded: {
          permissions: savedPermissionIds.length,
          roles: Object.keys(roleMap).length,
          sizes: createdSizes,
          colors: createdColors,
          categories: createdCategories,
          locations: createdLocations,
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

