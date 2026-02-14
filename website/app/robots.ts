import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/payment-success'],
        },
        sitemap: 'https://captureai.dev/sitemap.xml',
    }
}
