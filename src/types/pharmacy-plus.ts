export type ResourceCategory = 'PGD' | 'Video' | 'Training' | 'Compliance' | 'SOP'

export interface PharmacyPlusResource {
  id: string
  name: string
  description: string
  category: ResourceCategory
  fileName: string
  blobUrl: string
  fileSize: number
  fileType: string
  uploadedAt: string
  downloads: number
  /** If true, blobUrl is an external link (YouTube, Google Drive, etc.) — not stored in Vercel Blob */
  isExternal?: boolean
}

export interface ResourceManifest {
  resources: PharmacyPlusResource[]
  updatedAt: string
}
