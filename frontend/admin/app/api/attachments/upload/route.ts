import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { randomUUID } from 'crypto'

// Firebase Storage REST API helper
async function uploadToFirebaseStorage(
  file: File,
  filePath: string
): Promise<string | null> {
  try {
    // Get Firebase Storage access token (using Firebase Admin SDK REST API)
    // For now, we'll use a simpler approach: convert to base64 and store metadata
    // In production, use Firebase Admin SDK or Firebase Storage REST API with proper auth
    
    // Convert file to base64 for storage in database (for small files)
    // For larger files, implement Firebase Storage REST API upload
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`
    
    // Store file data in Firebase Realtime Database
    const { db } = getFirebaseServer()
    const fileId = randomUUID()
    await db.set(`file_storage/${fileId}`, {
      id: fileId,
      path: filePath,
      dataUrl,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      fileSize: file.size,
      createdAt: new Date().toISOString(),
    })
    
    // Return a URL that can be used to retrieve the file
    // In production, this should be a Firebase Storage URL
    return `/api/attachments/file/${fileId}`
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string || 'product'
    const entityId = formData.get('entityId') as string || 'temp'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', success: false },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${randomUUID()}.${fileExtension}`
    const finalEntityId = !entityId || entityId === 'temp' ? randomUUID() : entityId
    const filePath = `${entityType}/${finalEntityId}/${fileName}`

    // Upload file to Firebase Storage
    const publicUrl = await uploadToFirebaseStorage(file, filePath)

    if (!publicUrl) {
      return NextResponse.json(
        { 
          error: 'Failed to upload file to Firebase Storage', 
          success: false,
          details: 'Please check Firebase Storage configuration'
        },
        { status: 500 }
      )
    }

    // Save attachment record
    try {
      const attachmentId = Date.now().toString(36) + Math.random().toString(36).substr(2)
      const attachment = {
        id: attachmentId,
        entityType,
        entityId: finalEntityId,
        url: publicUrl,
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        fileSize: file.size,
        createdAt: new Date().toISOString(),
      }

      await db.set(`attachments/${attachmentId}`, attachment)

      return NextResponse.json({
        data: attachment,
        url: publicUrl,
        success: true,
      })
    } catch (dbErr) {
      console.error('Error saving attachment record (non-critical):', dbErr)
      // Return URL even if DB save fails
      return NextResponse.json({
        data: {
          url: publicUrl,
          fileName: file.name,
          entityType,
          entityId: finalEntityId,
        },
        url: publicUrl,
        success: true,
      }, { status: 200 })
    }
  } catch (error: any) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload file', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

