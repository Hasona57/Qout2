import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const log = this.auditLogsRepository.create({
      userId,
      entityType,
      entityId,
      action,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });

    return this.auditLogsRepository.save(log);
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}














