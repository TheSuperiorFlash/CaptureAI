import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_URL
    const LAST_MODIFIED = new Date('2026-03-16')

    return [
        {
            url: baseUrl,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/activate`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/download`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: LAST_MODIFIED,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]
}
