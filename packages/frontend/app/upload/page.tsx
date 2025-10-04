'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadApi } from '@/lib/api'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ key: string; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ key: string; url: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }
    fetchUploadedFiles()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      const files = await uploadApi.listFiles()
      setUploadedFiles(files)
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

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const result = await uploadApi.uploadFile(file)
      setUploadResult(result)
      setFile(null)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PDF Upload
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload and preview PDF files
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
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
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
            {file && (
              <button
                onClick={() => setFile(null)}
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
          {uploadResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                File uploaded successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 break-all">
                Key: {uploadResult.key}
              </p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewFile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {previewFile.key}
                </h3>
                <div className="flex gap-2">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-4">
                <iframe
                  src={previewFile.url}
                  className="w-full h-full min-h-[600px] border-0"
                  title={previewFile.key}
                />
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Uploaded PDF Files
          </h2>
          {uploadedFiles.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No PDF files uploaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {uploadedFiles.map((fileKey) => (
                <div
                  key={fileKey}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {fileKey}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handlePreview(fileKey)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleDelete(fileKey)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
