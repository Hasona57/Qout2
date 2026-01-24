import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
    const supabase = getSupabaseServer()

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
    for (const perm of permissions) {
      // Check if permission exists
      const { data: existing } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', perm.name)
        .single()

      if (!existing) {
        const { data: newPerm, error } = await supabase
          .from('permissions')
          .insert(perm)
          .select('id')
          .single()

        if (error) {
          console.error(`Error creating permission ${perm.name}:`, error)
        } else if (newPerm) {
          savedPermissionIds.push(newPerm.id)
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
    for (const roleData of roles) {
      // Check if role exists
      const { data: existing } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleData.name)
        .single()

      if (!existing) {
        const { data: newRole, error } = await supabase
          .from('roles')
          .insert(roleData)
          .select('id')
          .single()

        if (error) {
          console.error(`Error creating role ${roleData.name}:`, error)
        } else if (newRole) {
          roleMap[roleData.name] = newRole.id
        }
      } else {
        roleMap[roleData.name] = existing.id
      }
    }

    // Step 3: Create Admin User
    const adminEmail = 'admin@qote.com'
    const adminPassword = 'admin123'

    // Check if admin user exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (!existingAdmin && roleMap['admin']) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          roleId: roleMap['admin'],
          isActive: true,
        })
        .select()
        .single()

      if (adminError) {
        console.error('Error creating admin user:', adminError)
      } else {
        console.log('✅ Created admin user:', adminEmail, '/', adminPassword)
      }
    }

    // Step 4: Create POS User
    const posEmail = 'pos@qote.com'
    const posPassword = 'pos123'

    const { data: existingPos } = await supabase
      .from('users')
      .select('id')
      .eq('email', posEmail)
      .single()

    if (!existingPos && roleMap['sales_employee']) {
      const hashedPassword = await bcrypt.hash(posPassword, 10)
      const { data: posUser, error: posError } = await supabase
        .from('users')
        .insert({
          name: 'POS Sales Employee',
          email: posEmail,
          password: hashedPassword,
          roleId: roleMap['sales_employee'],
          isActive: true,
          employeeCode: 'POS001',
          commissionRate: '5.00',
        })
        .select()
        .single()

      if (posError) {
        console.error('Error creating POS user:', posError)
      } else {
        console.log('✅ Created POS user:', posEmail, '/', posPassword)
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

