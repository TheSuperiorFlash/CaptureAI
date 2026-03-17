'use client'

import { motion } from 'framer-motion'

interface FadeImageLoopProps {
  image1: string
  image2: string
  duration1?: number
  fadeDuration?: number
  duration2?: number
}

export default function FadeImageLoop({
  image1,
  image2,
  duration1 = 2,
  fadeDuration = 1,
  duration2 = 2,
}: FadeImageLoopProps) {
  const totalDuration = duration1 + fadeDuration + duration2 + fadeDuration

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <div className="relative w-full h-full" style={{ width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      {/* Image 1 */}
      <motion.img
        src={image1}
        alt="Fade loop image 1"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        animate={{
          opacity: [1, 1, 0, 0],
        }}
        transition={{
          duration: totalDuration,
          times: [0, duration1 / totalDuration, (duration1 + fadeDuration) / totalDuration, 1],
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Image 2 */}
      <motion.img
        src={image2}
        alt="Fade loop image 2"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        animate={{
          opacity: [0, 0, 1, 1],
        }}
        transition={{
          duration: totalDuration,
          times: [0, (duration1 + fadeDuration) / totalDuration, (duration1 + fadeDuration * 2) / totalDuration, 1],
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
