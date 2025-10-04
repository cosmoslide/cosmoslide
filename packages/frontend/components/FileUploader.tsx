'use client'

import { useState } from 'react'
import { uploadApi } from '@/lib/api'

interface FileUploaderProps {
  onUploadComplete?: (result: { key: string; url: string }) => void
  onError?: (error: string) => void
  acceptedFileTypes?: string
  maxSizeMB?: number
  pdfOnly?: boolean
}

export default function FileUploader({
  onUploadComplete,
  onError,
  acceptedFileTypes = '.pdf,application/pdf',
  maxSizeMB = 200,
  pdfOnly = true,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    // Check file type if specified
    if (acceptedFileTypes && !acceptedFileTypes.split(',').some(
      type => file.type.match(type.trim())
    )) {
      return `File type not allowed. Accepted types: ${acceptedFileTypes}`
    }

    return null
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
      const error = validateFile(droppedFile)
      if (error) {
        onError?.(error)
      } else {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const error = validateFile(selectedFile)
      if (error) {
        onError?.(error)
      } else {
        setFile(selectedFile)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadApi.uploadFile(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      onUploadComplete?.(result)
      setFile(null)
      setUploadProgress(0)
    } catch (err: any) {
      onError?.(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
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
              htmlFor="file-upload-component"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Choose File
            </label>
            <input
              id="file-upload-component"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
            />
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              or drag and drop
            </p>
            {acceptedFileTypes && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Accepted: {acceptedFileTypes}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Max size: {maxSizeMB}MB
            </p>
          </div>

          {file && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>

      {file && !uploading && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Upload
          </button>
          <button
            onClick={() => setFile(null)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
