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
}

export interface ResourceManifest {
  resources: PharmacyPlusResource[]
  updatedAt: string
}
