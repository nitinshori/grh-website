import { put, del, list, head } from '@vercel/blob'
import type { ResourceManifest, PharmacyPlusResource } from '@/types/pharmacy-plus'

const MANIFEST_PATH = 'pharmacy-plus/manifest.json'

// ── Manifest operations ─────────────────────────────────────────

async function getManifestBlob(): Promise<{ url: string; downloadUrl: string } | null> {
  const { blobs } = await list({ prefix: MANIFEST_PATH })
  return blobs.length > 0 ? { url: blobs[0].url, downloadUrl: blobs[0].downloadUrl } : null
}

export async function readManifest(): Promise<ResourceManifest> {
  try {
    const blob = await getManifestBlob()
    if (!blob) return { resources: [], updatedAt: new Date().toISOString() }

    const response = await fetch(blob.downloadUrl, { cache: 'no-store' })
    if (!response.ok) return { resources: [], updatedAt: new Date().toISOString() }

    return (await response.json()) as ResourceManifest
  } catch {
    return { resources: [], updatedAt: new Date().toISOString() }
  }
}

async function writeManifest(manifest: ResourceManifest): Promise<void> {
  // Delete old manifest first (Blob is append-only, so we replace)
  const blob = await getManifestBlob()
  if (blob) {
    await del(blob.url)
  }

  manifest.updatedAt = new Date().toISOString()

  await put(MANIFEST_PATH, JSON.stringify(manifest, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

// ── Resource operations ─────────────────────────────────────────

export async function getAllResources(): Promise<PharmacyPlusResource[]> {
  const manifest = await readManifest()
  return manifest.resources.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )
}

export async function getResourceById(id: string): Promise<PharmacyPlusResource | null> {
  const manifest = await readManifest()
  return manifest.resources.find((r) => r.id === id) ?? null
}

export async function addResource(resource: PharmacyPlusResource): Promise<void> {
  const manifest = await readManifest()
  manifest.resources.push(resource)
  await writeManifest(manifest)
}

export async function deleteResource(id: string): Promise<PharmacyPlusResource | null> {
  const manifest = await readManifest()
  const index = manifest.resources.findIndex((r) => r.id === id)
  if (index === -1) return null

  const [removed] = manifest.resources.splice(index, 1)

  // Delete the actual file blob (skip for external links)
  if (!removed.isExternal) {
    try {
      await del(removed.blobUrl)
    } catch {
      // File may already be gone; continue with manifest cleanup
    }
  }

  await writeManifest(manifest)
  return removed
}

export async function incrementDownloads(id: string): Promise<PharmacyPlusResource | null> {
  const manifest = await readManifest()
  const resource = manifest.resources.find((r) => r.id === id)
  if (!resource) return null

  resource.downloads += 1
  await writeManifest(manifest)
  return resource
}

export async function addExternalResource(
  resource: Omit<PharmacyPlusResource, 'downloads'>
): Promise<void> {
  const manifest = await readManifest()
  manifest.resources.push({ ...resource, downloads: 0 })
  await writeManifest(manifest)
}

// ── File upload ─────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<{ url: string; size: number }> {
  const blob = await put(`pharmacy-plus/files/${file.name}`, file, {
    access: 'private',
    contentType: file.type,
  })

  // Use downloadUrl for private stores (permanent signed URL)
  return { url: blob.downloadUrl, size: file.size }
}
