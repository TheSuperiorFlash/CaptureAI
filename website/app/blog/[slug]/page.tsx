import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAllPosts, getPostBySlug, getPostJsonLd } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'

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
            <p key={elements.length} className="mb-5 text-[15px] leading-relaxed text-[--color-text-secondary]">
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
          ? 'mb-5 list-decimal space-y-2 pl-6'
          : 'mb-5 list-disc space-y-2 pl-6'
        elements.push(
          <ListTag key={elements.length} className={listClass}>
            {listItems.map((item, i) => (
              <li key={i} className="text-[15px] leading-relaxed text-[--color-text-secondary]">
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
          return <strong key={i} className="font-semibold text-[--color-text]">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-cyan-400">{part.slice(1, -1)}</code>
        }
        return part
      })
    }

    for (const line of lines) {
      if (line.startsWith('## ')) {
        flushList()
        flushParagraph()
        elements.push(
          <h2 key={elements.length} className="mb-4 mt-10 text-xl font-bold text-[--color-text]">
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        flushParagraph()
        elements.push(
          <h3 key={elements.length} className="mb-3 mt-8 text-lg font-semibold text-[--color-text]">
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

        <div className="relative z-10 mx-auto max-w-3xl px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text-tertiary] transition-colors hover:text-cyan-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <time className="text-sm text-[--color-text-tertiary]" dateTime={post.datePublished}>
                {new Date(post.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[--color-text-tertiary]">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mb-4 text-[--color-text]">{post.title}</h1>
            <p className="text-lg text-[--color-text-secondary]">{post.description}</p>
          </header>

          {/* Content */}
          <article className="glass-card rounded-2xl p-8 md:p-10">
            {renderContent(post.content)}
          </article>

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="mb-4 text-sm text-[--color-text-tertiary]">
              Ready to try CaptureAI?
            </p>
            <Link
              href="/activate"
              className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
