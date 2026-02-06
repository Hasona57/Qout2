import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()
    const fileId = params.id

    const fileData = await db.get(`file_storage/${fileId}`)

    if (!fileData || !fileData.dataUrl) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Extract base64 data from data URL
    const base64Data = fileData.dataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Return file with appropriate content type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileData.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileData.fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('Error retrieving file:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    )
  }
}

