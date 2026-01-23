import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as MinIO from 'minio';
import { Attachment } from './entities/attachment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @Inject('MINIO_CLIENT')
    private minioClient: MinIO.Client,
    @Inject('MINIO_BUCKET')
    private bucketName: string,
  ) { }

  async uploadFile(
    file: any,
    entityType: string,
    entityId: string,
  ): Promise<Attachment> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Handle temporary or undefined entityId by generating a placeholder UUID
    const finalEntityId = !entityId || entityId === 'temp' ? uuidv4() : entityId;
    const objectName = `${entityType}/${finalEntityId}/${fileName}`;

    await this.minioClient.putObject(this.bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    // Use public endpoint from config if available, otherwise fallback to env or localhost
    // We can't easily inject ConfigService here because it's not injected in constructor, 
    // but we can use the env vars directly as a fallback or assume the caller ensures MINIO_PUBLIC_ENDPOINT is set.
    // Ideally we should inject ConfigService. Let's rely on process.env for now to match the style or partial injection.

    const host = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';

    // If public endpoint is a full URL, use it directly (better for prod)
    let url = '';
    if (host.startsWith('http')) {
      url = `${host}/${this.bucketName}/${objectName}`;
    } else {
      url = `${protocol}://${host}:${port}/${this.bucketName}/${objectName}`;
    }

    const attachment = this.attachmentsRepository.create({
      entityType,
      entityId: finalEntityId,
      url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }

  async findByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    return this.attachmentsRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    const attachment = await this.attachmentsRepository.findOne({ where: { id } });
    if (attachment) {
      // Extract objectName from URL: http://host/bucket/entityType/entityId/filename
      const urlParts = attachment.url.split('/');
      const objectName = urlParts.slice(-3).join('/');
      await this.minioClient.removeObject(this.bucketName, objectName);
      await this.attachmentsRepository.remove(attachment);
    }
  }
}

