import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { Attachment } from './entities/attachment.entity';
import { minioClient, MINIO_BUCKET_NAME, initializeMinIO } from '../../config/minio.config';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    {
      provide: 'MINIO_CLIENT',
      useValue: minioClient,
    },
    {
      provide: 'MINIO_BUCKET',
      useValue: MINIO_BUCKET_NAME,
    },
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {
  async onModuleInit() {
    await initializeMinIO();
  }
}














