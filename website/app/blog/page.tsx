import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights on using AI for studying. Learn how to study smarter with CaptureAI, Chrome extensions for students, and LMS platform tips.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'CaptureAI Blog',
    description: 'Tips, guides, and insights on using AI for studying.',
    images: ['/og-image.png'],
    url: `${SITE_URL}/blog`,
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog' },
  ],
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <div className="relative overflow-x-hidden py-20 md:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="absolute right-[-100px] top-[20%] h-[400px] w-[400px] rounded-full bg-blue-600 gradient-blur" />

      <div className="relative z-10 mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            Resources
          </span>
          <h1 className="mb-3">
            <span className="text-[--color-text]">CaptureAI </span>
            <span className="text-gradient-static">Blog</span>
          </h1>
          <p className="text-[--color-text-secondary]">
            Tips, guides, and insights on using AI to study smarter.
          </p>
        </div>

        {/* Post list */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card group block rounded-2xl p-7 transition-all duration-200 hover:border-blue-500/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.06)]"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <time className="text-xs text-[--color-text-tertiary]" dateTime={post.datePublished}>
                  {new Date(post.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[--color-text-tertiary]">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mb-2 text-lg font-semibold text-[--color-text] transition-colors group-hover:text-cyan-400">
                {post.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[--color-text-tertiary]">
                {post.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                Read more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
