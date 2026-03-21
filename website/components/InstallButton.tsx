'use client'

import { Chrome } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const CWS_URL = 'https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkpmmkecmoeomnjd?authuser=0&hl=en'

export default function InstallButton() {
  return (
    <a
      href={CWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="glow-btn flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-center text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
      onClick={() => trackEvent('click_install', { location: 'download_page' })}
    >
      <Chrome className="h-4 w-4" />
      Add to Chrome — Start now
    </a>
  )
}
