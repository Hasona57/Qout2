import { DataSource } from 'typeorm';
import { Role } from '../../modules/users/entities/role.entity';
import { Permission } from '../../modules/users/entities/permission.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // Create permissions
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
  ];

  const savedPermissions = [];
  for (const perm of permissions) {
    let permission = await permissionRepository.findOne({ where: { name: perm.name } });
    if (!permission) {
      permission = permissionRepository.create(perm);
      permission = await permissionRepository.save(permission);
    }
    savedPermissions.push(permission);
  }

  // Create roles
  const roles = [
    {
      name: 'admin',
      description: 'Full system access',
      permissions: savedPermissions, // All permissions
    },
    {
      name: 'sales_employee',
      description: 'POS access only',
      permissions: savedPermissions.filter((p) => p.name.includes('sales') || p.name.includes('products.read')),
    },
    {
      name: 'factory_manager',
      description: 'Production management',
      permissions: savedPermissions.filter((p) => p.name.includes('production') || p.name.includes('inventory')),
    },
    {
      name: 'storekeeper',
      description: 'Inventory management',
      permissions: savedPermissions.filter((p) => p.name.includes('inventory') || p.name.includes('products.read')),
    },
    {
      name: 'customer',
      description: 'Customer access',
      permissions: savedPermissions.filter((p) => p.name === 'products.read'),
    },
  ];

  for (const roleData of roles) {
    let role = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepository.create(roleData);
      role = await roleRepository.save(role);
      console.log(`✅ Created role: ${role.name}`);
    }
  }
}






