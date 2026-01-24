import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
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

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Try uploading to Supabase Storage - try multiple bucket names
    const bucketNames = ['product-images', 'attachments', 'images']
    let uploadSuccess = false
    let publicUrl = ''
    let usedBucket = ''

    for (const bucketName of bucketNames) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, uint8Array, {
            contentType: file.type || 'image/jpeg',
            upsert: false,
          })

        if (!error && data) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath)

          publicUrl = urlData.publicUrl
          usedBucket = bucketName
          uploadSuccess = true
          break
        } else {
          console.error(`Error uploading to ${bucketName}:`, error)
        }
      } catch (err) {
        console.error(`Exception uploading to ${bucketName}:`, err)
        continue
      }
    }

    // If upload failed, return error
    if (!uploadSuccess) {
      console.error('Failed to upload to all storage buckets')
      // Return a placeholder URL or error
      return NextResponse.json(
        { 
          error: 'Failed to upload file. Please ensure a storage bucket (product-images, attachments, or images) exists in Supabase Storage.', 
          success: false,
          details: 'Create a public bucket in Supabase Storage dashboard'
        },
        { status: 500 }
      )
    }

    // Try to save attachment record (optional - don't fail if this fails)
    try {
      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert({
          entityType,
          entityId: finalEntityId,
          url: publicUrl,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
        })
        .select()
        .single()

      if (!dbError && attachment) {
        return NextResponse.json({
          data: attachment,
          url: publicUrl,
          success: true,
        })
      }
    } catch (dbErr) {
      console.error('Error saving attachment record (non-critical):', dbErr)
      // Continue even if DB save fails
    }

    // Return URL even if DB save failed - ensure format matches what frontend expects
    return NextResponse.json({
      data: {
        url: publicUrl,
        fileName: file.name,
        entityType,
        entityId: finalEntityId,
      },
      url: publicUrl, // Also include at root level for compatibility
      success: true,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload file', 
        success: false,
        details: error.stack
      },
      { status: 500 }
    )
  }
}

