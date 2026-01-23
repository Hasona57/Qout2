import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(userOrDto: any) {
    // If it's a LoginDto (has email and password), validate first
    let user = userOrDto;
    if (userOrDto.email && userOrDto.password) {
      user = await this.validateUser(userOrDto.email, userOrDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // If user is already validated (from LocalAuthGuard), use it directly
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        commissionRate: user.commissionRate,
        employeeCode: user.employeeCode,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('Email already registered');
      }

      // Find customer role by name
      const customerRole = await this.usersService.findRoleByName('customer');
      if (!customerRole) {
        throw new UnauthorizedException('Customer role not found. Please run database seeds first.');
      }

      const user = await this.usersService.create({
        ...registerDto,
        roleId: customerRole.id,
      });

      // Reload user with role relation
      const userWithRole = await this.usersService.findOne(user.id);

      if (!userWithRole.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const payload = {
        sub: userWithRole.id,
        email: userWithRole.email,
        role: userWithRole.role.name,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: userWithRole.id,
          name: userWithRole.name,
          email: userWithRole.email,
          phone: userWithRole.phone,
          role: userWithRole.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Registration failed: ${error.message}`);
    }
  }

  async validateJwtPayload(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }
      return user;
    } catch (error) {
      // If user is not found, findOne throws NotFoundException (404)
      // We should convert this to UnauthorizedException (401) for the auth guard
      throw new UnauthorizedException('User not found');
    }
  }
}

