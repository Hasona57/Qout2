import { Controller, Post, Get, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file' })
  uploadFile(
    @UploadedFile() file: any,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
  ) {
    return this.attachmentsService.uploadFile(file, entityType, entityId);
  }

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'Get attachments for entity' })
  findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.attachmentsService.findByEntity(entityType, entityId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  delete(@Param('id') id: string) {
    return this.attachmentsService.delete(id);
  }
}

