import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const finalEntityId = !entityId || entityId === 'temp' ? uuidv4() : entityId
    const filePath = `${entityType}/${finalEntityId}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments') // Make sure this bucket exists in Supabase Storage
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError)
      // If bucket doesn't exist, try 'product-images' or create a fallback
      const { data: altUploadData, error: altError } = await supabase.storage
        .from('product-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (altError) {
        console.error('Error uploading to alternative bucket:', altError)
        return NextResponse.json(
          { error: 'Failed to upload file. Please ensure storage bucket exists.', success: false },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Save attachment record
      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert({
          entityType,
          entityId: finalEntityId,
          url: urlData.publicUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving attachment record:', dbError)
        // Still return the URL even if DB save fails
        return NextResponse.json({
          data: {
            url: urlData.publicUrl,
            fileName: file.name,
          },
          success: true,
        })
      }

      return NextResponse.json({
        data: attachment || { url: urlData.publicUrl, fileName: file.name },
        success: true,
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    // Save attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert({
        entityType,
        entityId: finalEntityId,
        url: urlData.publicUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving attachment record:', dbError)
      // Still return the URL even if DB save fails
      return NextResponse.json({
        data: {
          url: urlData.publicUrl,
          fileName: file.name,
        },
        success: true,
      })
    }

    return NextResponse.json({
      data: attachment || { url: urlData.publicUrl, fileName: file.name },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file', success: false },
      { status: 500 }
    )
  }
}

