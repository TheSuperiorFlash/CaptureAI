import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { ScrollReveal, ScrollRevealStagger, ScrollRevealItem } from '@/components/ScrollReveal'

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
  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

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

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        <ScrollReveal className="mb-14 text-center md:mb-20">
          <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-400 border border-blue-500/20">
            Resources
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-[--color-text]">CaptureAI </span>
            <span className="text-gradient-static">Blog</span>
          </h1>
          <p className="text-lg text-[--color-text-secondary] max-w-xl mx-auto">
            Tips, guides, and insights on using AI to study smarter.
          </p>
        </ScrollReveal>

        {/* Featured Post */}
        {featuredPost && (
          <ScrollReveal delay={0.1} className="mb-10 lg:mb-16">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="glass-card group block overflow-hidden rounded-[2rem] transition-all duration-300 sm:hover:border-blue-500/30 sm:hover:shadow-[0_0_40px_rgba(0,113,255,0.12)] bg-[#0B0D14]/80"
            >
              <div className="flex flex-col md:flex-row">
                {/* Left: Content */}
                <div className="flex flex-1 flex-col justify-center p-8 md:p-12 lg:p-14">
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                      Featured
                    </span>
                    <time className="text-sm font-medium tracking-wide text-[--color-text-tertiary]" dateTime={featuredPost.datePublished}>
                      {new Date(featuredPost.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  </div>
                  <h2 className="mb-4 text-2xl font-extrabold text-[--color-text] transition-colors sm:group-hover:text-cyan-400 md:text-3xl lg:text-4xl lg:leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="mb-8 text-base md:text-lg leading-relaxed text-[--color-text-secondary]">
                    {featuredPost.description}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {featuredPost.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[--color-text-tertiary] transition-colors sm:group-hover:bg-white/[0.08]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Right: Visual element */}
                <div className="relative hidden w-[45%] min-w-[320px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#0033aa]/20 to-[#00aaff]/10 md:flex">
                  <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04]" />
                  <div className="gradient-blur absolute h-[150%] w-[150%] bg-blue-600/30 transition-transform duration-700 ease-out sm:group-hover:scale-110 sm:group-hover:bg-cyan-500/20" />
                  
                  {/* Decorative abstract UI block */}
                  <div className="relative h-[200px] w-[280px] rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 sm:group-hover:-translate-y-2 sm:group-hover:translate-x-1 sm:group-hover:rotate-[3deg]">
                    <div className="flex h-10 items-center border-b border-white/[0.06] px-5">
                      <div className="flex gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-white/20 transition-colors sm:group-hover:bg-[#ff5f56]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/20 transition-colors sm:group-hover:bg-[#ffbd2e]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/20 transition-colors sm:group-hover:bg-[#27c93f]" />
                      </div>
                    </div>
                    <div className="flex h-[calc(100%-40px)] items-center justify-center p-6">
                       <div className="w-full space-y-4">
                         <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-blue-400/40 to-cyan-400/20" />
                         <div className="h-3 w-full rounded-full bg-white/10" />
                         <div className="h-3 w-5/6 rounded-full bg-white/5" />
                         <div className="h-3 w-4/5 rounded-full bg-white/5" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        )}

        {/* Post Grid */}
        <ScrollRevealStagger delay={0.2} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {regularPosts.map((post) => (
            <ScrollRevealItem key={post.slug} className="h-full">
              <Link
                href={`/blog/${post.slug}`}
                className="glass-card group flex h-full flex-col rounded-3xl p-8 transition-all duration-300 sm:hover:border-blue-500/30 sm:hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] bg-[#0A0C10]/80"
              >
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <time className="text-[13px] font-medium tracking-wide text-[--color-text-tertiary]" dateTime={post.datePublished}>
                    {new Date(post.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span className="mx-2 text-[--color-text-tertiary]/50">•</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[--color-text-tertiary] transition-colors sm:group-hover:text-cyan-400/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <h2 className="mb-4 text-xl font-bold leading-snug text-[--color-text] transition-colors sm:group-hover:text-cyan-400">
                  {post.title}
                </h2>
                <p className="mb-8 text-[15px] leading-relaxed text-[--color-text-secondary]">
                  {post.description}
                </p>
                <div className="mt-auto border-t border-white/[0.04] pt-5">
                  <span className="inline-flex items-center gap-2 text-[14px] font-bold tracking-wide text-cyan-400 transition-colors sm:group-hover:text-cyan-300">
                    Read article
                    <ArrowRight className="h-4 w-4 transition-transform sm:group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </ScrollRevealItem>
          ))}
        </ScrollRevealStagger>
      </div>
    </div>
    </>
  )
}
