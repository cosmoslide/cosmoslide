'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { uploadApi } from '@/lib/api'

// Dynamically import the PDF viewer component with no SSR
const PresentationViewer = dynamic(() => import('@/components/PresentationViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading viewer...</p>
      </div>
    </div>
  ),
})

interface PresentationData {
  id: string
  title: string
  url: string
  pdfKey: string
  noteId: string | null
  userId: string
  createdAt: string
}

export default function PresentationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPresentation()
  }, [id])



  const fetchPresentation = async () => {
    try {
      setLoading(true)
      const data = await uploadApi.getPresentation(id)
      setPresentation(data)

      // Try to build direct S3 URL for download (inline, no helper)
      const s3Base = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '').replace(/\/$/, '')
      const s3Key = (data.pdfKey || '').replace(/^\//, '')
      const directUrl = s3Base && s3Key ? `${s3Base}/${s3Key}` : null
      if (directUrl) {
        setPdfUrl(directUrl)
        setDownloadUrl(directUrl)
      } else {
        const proxyUrl = await uploadApi.getFileUrl(data.pdfKey)
        setPdfUrl(proxyUrl)
        setDownloadUrl(proxyUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load presentation')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => router.push('/upload')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Upload
          </button>
        </div>
      </div>
    )
  }

  if (!presentation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {presentation.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={presentation.title || 'presentation.pdf'}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download
                </a>
              )}
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pdfUrl && <PresentationViewer pdfUrl={pdfUrl} title={presentation.title} />}
      </div>
    </div>
  )
}
