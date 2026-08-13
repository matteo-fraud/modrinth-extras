import { browser } from 'wxt/browser'

import { modrinthClient } from '../utils/api'
import { getSettings } from '../utils/settings'

const CDN_URL_PATTERN =
	/^https:\/\/cdn\.modrinth\.com\/data\/([^/]+)\/versions\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]+/g

interface VersionInfo {
	slug: string
	versionNumber: string
	gameVersion: string
}

const slugCache = new Map<string, string>()
const versionCache = new Map<string, VersionInfo>()

export function registerDownloadRenameListener() {
	browser.downloads?.onDeterminingFilename.addListener((item, suggest) => {
		void (async () => {
			try {
				const { downloadRename } = await getSettings()
				const match = downloadRename.enabled ? CDN_URL_PATTERN.exec(item.url) : null
				if (!match) {
					suggest()
					return
				}

				const [, projectId, versionId, originalFilename] = match
				const info = await getVersionInfo(projectId, versionId)
				if (!info) {
					suggest()
					return
				}

				const extension = originalFilename.includes('.')
					? originalFilename.slice(originalFilename.lastIndexOf('.'))
					: ''
				const filename =
					sanitizeFilename(applyTemplate(downloadRename.template, info)) + extension
				console.log(`[Modrinth Extras] Download rename: "${originalFilename}" -> "${filename}"`)
				suggest({ filename, conflictAction: 'uniquify' })
			} catch (err) {
				console.error('[Modrinth Extras] Download rename: Failed to compute filename:', err)
				suggest()
			}
		})()

		return true
	})
}

function applyTemplate(template: string, info: VersionInfo): string {
	return template
		.replaceAll('[slug]', info.slug)
		.replaceAll('[version]', info.versionNumber)
		.replaceAll('[game_version]', info.gameVersion)
}

function sanitizeFilename(name: string): string {
	return name.replace(INVALID_FILENAME_CHARS, '-').trim()
}

async function getVersionInfo(projectId: string, versionId: string): Promise<VersionInfo | null> {
	const cached = versionCache.get(versionId)
	if (cached) return cached

	const [slug, version] = await Promise.all([
		getProjectSlug(projectId),
		modrinthClient.labrinth.versions_v3.getVersion(versionId),
	])
	if (!slug || !version) return null

	const info: VersionInfo = {
		slug,
		versionNumber: version.version_number,
		gameVersion: version.game_versions.join('+') || 'unknown',
	}
	versionCache.set(versionId, info)
	return info
}

async function getProjectSlug(projectId: string): Promise<string | null> {
	const cached = slugCache.get(projectId)
	if (cached) return cached

	const project = await modrinthClient.labrinth.projects_v3.get(projectId)
	if (!project?.slug) return null

	slugCache.set(projectId, project.slug)
	return project.slug
}
