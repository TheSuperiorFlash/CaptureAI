import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAllPosts, getPostBySlug, getPostJsonLd } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { ScrollReveal } from '@/components/ScrollReveal'
import MagneticButton from '@/components/MagneticButton'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified || post.datePublished,
      url: `${SITE_URL}/blog/${post.slug}`,
      images: [post.image || '/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image || '/og-image.png'],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const jsonLd = getPostJsonLd(post)

  // Static JSON-LD structured data - no user input, safe for dangerouslySetInnerHTML
  const jsonLdHtml = JSON.stringify(jsonLd)

  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  })

  // Simple markdown-like rendering: split on ## headings and ### subheadings
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let currentParagraph: string[] = []
    let listItems: string[] = []
    let listType: 'ul' | 'ol' | null = null

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ')
        if (text.trim()) {
          elements.push(
            <p key={elements.length} className="mb-8 text-[17px] leading-[1.8] text-[--color-text-secondary]">
              {renderInline(text)}
            </p>
          )
        }
        currentParagraph = []
      }
    }

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul'
        const listClass = listType === 'ol'
          ? 'mb-8 list-decimal space-y-3 pl-6 marker:text-cyan-500/70'
          : 'mb-8 list-disc space-y-3 pl-6 marker:text-cyan-500/70'
        elements.push(
          <ListTag key={elements.length} className={listClass}>
            {listItems.map((item, i) => (
              <li key={i} className="text-[17px] leading-relaxed text-[--color-text-secondary] pl-2">
                {renderInline(item)}
              </li>
            ))}
          </ListTag>
        )
        listItems = []
        listType = null
      }
    }

    const renderInline = (text: string): React.ReactNode => {
      // Handle [links](url), **bold**, and `code`
      const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g)
      return parts.map((part, i) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          const [, linkText, url] = linkMatch
          const isInternal = url.startsWith('/')
          if (isInternal) {
            return <Link key={i} href={url} className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">{linkText}</Link>
          }
          return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">{linkText}</a>
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded-md bg-white/[0.06] border border-white/[0.05] px-1.5 py-0.5 text-[14px] text-cyan-300 mx-0.5">{part.slice(1, -1)}</code>
        }
        return part
      })
    }

    for (const line of lines) {
      if (line.startsWith('## ')) {
        flushList()
        flushParagraph()
        elements.push(
          <h2 key={elements.length} className="mb-6 mt-14 text-2xl font-bold md:text-3xl text-gradient-static">
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        flushParagraph()
        elements.push(
          <h3 key={elements.length} className="mb-4 mt-10 text-xl font-semibold text-white">
            {line.slice(4)}
          </h3>
        )
      } else if (line.match(/^- /)) {
        flushParagraph()
        if (listType !== 'ul') {
          flushList()
          listType = 'ul'
        }
        listItems.push(line.slice(2))
      } else if (line.match(/^\d+\. /)) {
        flushParagraph()
        if (listType !== 'ol') {
          flushList()
          listType = 'ol'
        }
        listItems.push(line.replace(/^\d+\.\s*/, ''))
      } else if (line.trim() === '') {
        flushList()
        flushParagraph()
      } else {
        currentParagraph.push(line)
      }
    }

    flushList()
    flushParagraph()
    return elements
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <div className="relative overflow-x-hidden py-20 md:py-28">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 gradient-mesh" />
        <div className="absolute right-[-100px] top-[20%] h-[400px] w-[400px] rounded-full bg-blue-600 gradient-blur" />

        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <ScrollReveal delay={0}>
            {/* Back link */}
            <Link
              href="/blog"
              className="mb-10 inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text-tertiary] transition-colors hover:text-cyan-400 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to blog
            </Link>

            {/* Glowing orb decorative background behind header */}
            <div className="absolute left-1/2 top-40 h-[300px] w-[300px] md:h-[400px] md:w-[600px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="mb-16 text-center md:mb-20">
              <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                <time className="text-[13px] font-medium tracking-wide text-[--color-text-tertiary]" dateTime={post.datePublished}>
                  {new Date(post.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <span className="text-[--color-text-tertiary]/50">•</span>
                <div className="flex gap-2 flex-wrap items-center justify-center">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">{post.title}</h1>
              <p className="mx-auto max-w-2xl text-[17px] md:text-xl text-[--color-text-secondary] leading-relaxed">{post.description}</p>
            </header>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal delay={0.1}>
            <article className="mx-auto max-w-3xl">
              <div className="divider-gradient mb-12 h-[1px] w-full" />
              <div className="prose-custom">
                {renderContent(post.content)}
              </div>
              <div className="divider-gradient mt-20 mb-16 h-[1px] w-full opacity-60" />
            </article>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal delay={0.2} className="mx-auto max-w-3xl">
            <div className="glass-card rounded-[2rem] p-10 md:p-14 text-center relative overflow-hidden bg-[#0a0d14]/60">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-500/5" />
              <div className="absolute top-0 right-1/4 h-32 w-32 rounded-full bg-cyan-500/20 blur-[60px]" />
              <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-blue-600/20 blur-[60px]" />
              
              <div className="relative z-10">
                <h3 className="mb-4 text-3xl font-bold text-white tracking-tight">Ready to study smarter?</h3>
                <p className="mb-10 text-[17px] text-[--color-text-secondary] max-w-lg mx-auto leading-relaxed">
                  Join thousands of students using CaptureAI to instantly answer questions and save hours on assignments.
                </p>
                <MagneticButton className="mx-auto">
                  <Link
                    href="/activate"
                    className="glow-btn inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-[16px] font-bold tracking-wide text-white transition-all hover:from-[#1a5cff] hover:to-[#00f0ff] hover:shadow-[0_0_40px_rgba(0,113,255,0.4)]"
                  >
                    Get Started Now
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </>
  )
}
