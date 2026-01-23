import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/users/entities/role.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  // Get roles
  const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
  const salesEmployeeRole = await roleRepository.findOne({ where: { name: 'sales_employee' } });
  
  if (!adminRole) {
    throw new Error('Admin role not found. Run roles seed first.');
  }
  if (!salesEmployeeRole) {
    throw new Error('Sales employee role not found. Run roles seed first.');
  }

  // Create admin user
  let admin = await userRepository.findOne({ where: { email: 'admin@qote.com' } });
  if (!admin) {
    admin = userRepository.create({
      name: 'Admin User',
      email: 'admin@qote.com',
      password: await bcrypt.hash('admin123', 10),
      roleId: adminRole.id,
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('✅ Created admin user: admin@qote.com / admin123');
  }

  // Create POS sales employee user
  let posUser = await userRepository.findOne({ where: { email: 'pos@qote.com' } });
  if (!posUser) {
    posUser = userRepository.create({
      name: 'POS Sales Employee',
      email: 'pos@qote.com',
      password: await bcrypt.hash('pos123', 10),
      roleId: salesEmployeeRole.id,
      isActive: true,
      employeeCode: 'POS001',
      commissionRate: '5.00', // 5% commission
    });
    await userRepository.save(posUser);
    console.log('✅ Created POS user: pos@qote.com / pos123');
  }
}

