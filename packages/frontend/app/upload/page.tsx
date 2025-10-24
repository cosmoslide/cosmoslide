'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadApi } from '@/lib/api'
import NavigationHeader from '@/components/NavigationHeader'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ key: string; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ key: string; url: string } | null>(null)
  const [title, setTitle] = useState<string>('')
  const [presentationResult, setPresentationResult] = useState<{ id: string; title: string; url: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }
    // fetchUploadedFiles()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      const files = await uploadApi.listFiles()
      // setUploadedFiles(files)
    } catch (err: any) {
      console.error('Failed to fetch files:', err)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      // Validate PDF file
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Only PDF files are allowed')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Validate PDF file
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Only PDF files are allowed')
        e.target.value = '' // Reset input
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    if (!title || title.trim() === '') {
      setError('Please enter a title for the presentation')
      return
    }

    setUploading(true)
    setError(null)
    setUploadResult(null)
    setPresentationResult(null)

    try {
      const result = await uploadApi.uploadPresentation(file, title)
      setPresentationResult({
        id: result.id,
        title: result.title,
        url: result.url,
      })
      setFile(null)
      setTitle('')
      // Refresh the file list
      await fetchUploadedFiles()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      await uploadApi.deleteFile(key)
      await fetchUploadedFiles()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handlePreview = async (key: string) => {
    try {
      const url = await uploadApi.getFileUrl(key)
      setPreviewFile({ key, url })
    } catch (err: any) {
      setError(err.message || 'Preview failed')
    }
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const isPDF = (filename: string) => {
    return getFileExtension(filename) === 'pdf'
  }

  const isImage = (filename: string) => {
    const ext = getFileExtension(filename)
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Presentation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload PDF presentations and share them on your timeline
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Presentation Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter presentation title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            {/* Title Input */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presentation Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter presentation title"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Choose PDF File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    or drag and drop a PDF file here
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Only PDF files are allowed (max 200MB)
                  </p>
                </div>
                {file && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Selected:</span> {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || !title || uploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {uploading ? 'Uploading...' : 'Upload Presentation'}
              </button>
              {file && (
                <button
                  onClick={() => {
                    setFile(null)
                    setTitle('')
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {presentationResult && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                  Presentation uploaded successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                  Title: {presentationResult.title}
                </p>
                <a
                  href={`/presentations/${presentationResult.id}`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  View Presentation: {presentationResult.url}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
