"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { motion, useMotionValue, useSpring } from "framer-motion"
import TextCursorProximity from "../visuals/text-hover-effect"
import ConnectWalletButton from "../connect-wallet-button"


// ============================================================================
// CONSTANTS
// ============================================================================

const ANIMATION_DURATIONS = {
  pageLoad: 1,
  textStagger: 0.8,
  blobPrimary: 15,
  blobSecondary: 20,
  blobTertiary: 18,
  particle: 8,
} as const

const PARTICLE_COUNT = 15
const FEATURE_BADGES = ["SECURE", "FAST", "PRIVATE"] as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getThemeColors = (isDark: boolean) => ({
  primary: isDark ? "#FF4444" : "#FF87C1",
  background: isDark ? "#000000" : "#0000FF",
  gradientPrimary: isDark
    ? "radial-gradient(circle, rgba(255,68,68,0.3) 0%, transparent 70%)"
    : "radial-gradient(circle, rgba(255,135,193,0.3) 0%, transparent 70%)",
  gradientSecondary: isDark
    ? "radial-gradient(circle, rgba(255,68,68,0.2) 0%, transparent 70%)"
    : "radial-gradient(circle, rgba(255,135,193,0.2) 0%, transparent 70%)",
  gradientTertiary: isDark
    ? "radial-gradient(circle, rgba(255,100,100,0.25) 0%, transparent 70%)"
    : "radial-gradient(circle, rgba(255,160,210,0.25) 0%, transparent 70%)",
  gradientMouse: isDark
    ? "radial-gradient(circle, rgba(255,68,68,0.15) 0%, transparent 70%)"
    : "radial-gradient(circle, rgba(255,135,193,0.15) 0%, transparent 70%)",
})

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FloatingParticleProps {
  delay: number
  duration: number
  color: string
}

const FloatingParticle = ({ delay, duration, color }: FloatingParticleProps) => {
  const randomX = Math.random() * 100
  const randomY = Math.random() * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: `${randomX}vw`, y: `${randomY}vh` }}
      animate={{
        opacity: [0, 0.6, 0],
        x: [`${randomX}vw`, `${randomX + (Math.random() - 0.5) * 30}vw`],
        y: [`${randomY}vh`, `${randomY + (Math.random() - 0.5) * 30}vh`],
        scale: [0, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }}
    />
  )
}

interface GridBackgroundProps {
  color: string
}

const GridBackground = ({ color }: GridBackgroundProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

interface AnimatedBlobProps {
  gradient: string
  className?: string
  duration: number
  delay?: number
  scaleRange?: [number, number, number]
  rotateRange?: [number, number, number]
  opacityRange?: [number, number, number]
  xRange?: [number, number, number]
  yRange?: [number, number, number]
}

const AnimatedBlob = ({
  gradient,
  className = "",
  duration,
  delay = 0,
  scaleRange = [1, 1.2, 1],
  rotateRange = [0, 90, 0],
  opacityRange = [0.3, 0.5, 0.3],
  xRange,
  yRange,
}: AnimatedBlobProps) => {
  return (
    <motion.div
      animate={{
        scale: scaleRange,
        rotate: rotateRange,
        opacity: opacityRange,
        ...(xRange && { x: xRange }),
        ...(yRange && { y: yRange }),
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{ background: gradient }}
    />
  )
}

interface CornerDecorationProps {
  color: string
  position: "top-left" | "bottom-left"
}

const CornerDecoration = ({ color, position }: CornerDecorationProps) => {
  const isTop = position === "top-left"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ duration: 1, delay: 1.2 }}
      className={`absolute ${isTop ? "top-0" : "bottom-0"} left-0 w-32 h-32 pointer-events-none`}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <line
          x1="0"
          y1={isTop ? "20" : "80"}
          x2="20"
          y2={isTop ? "20" : "80"}
          stroke={color}
          strokeWidth="0.5"
        />
        <line
          x1="20"
          y1={isTop ? "0" : "80"}
          x2="20"
          y2={isTop ? "20" : "100"}
          stroke={color}
          strokeWidth="0.5"
        />
      </svg>
    </motion.div>
  )
}

interface StatusIndicatorProps {
  color: string
}



interface ScanLinesProps {
  color: string
}

const ScanLines = ({ color }: ScanLinesProps) => {
  return (
    <motion.div
      animate={{ y: ["-100%", "100%"] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute inset-0 pointer-events-none opacity-5"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          ${color} 2px,
          ${color} 4px
        )`,
      }}
    />
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Preview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const colors = getThemeColors(isDark)

  // Mouse tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATION_DURATIONS.pageLoad }}
      className="w-screen h-screen fixed inset-0 overflow-hidden"
      ref={containerRef}
      style={{ backgroundColor: colors.background }}
    >
      {/* ===== BACKGROUND LAYERS ===== */}
      <GridBackground color={colors.primary} />

      {/* Animated gradient blobs */}
      <AnimatedBlob
        gradient={colors.gradientPrimary}
        className="top-1/4 left-1/4 w-96 h-96"
        duration={ANIMATION_DURATIONS.blobPrimary}
      />

      <AnimatedBlob
        gradient={colors.gradientSecondary}
        className="bottom-1/4 right-1/4 w-96 h-96"
        duration={ANIMATION_DURATIONS.blobSecondary}
        delay={1}
        rotateRange={[0, -90, 0]}
        scaleRange={[1, 1.3, 1]}
      />

      <AnimatedBlob
        gradient={colors.gradientTertiary}
        className="top-1/2 left-1/2 w-80 h-80"
        duration={ANIMATION_DURATIONS.blobTertiary}
        delay={2}
        scaleRange={[1, 1.4, 1]}
        xRange={[0, 50, 0]}
        yRange={[0, -50, 0]}
        opacityRange={[0.2, 0.4, 0.2]}
      />

      {/* Floating particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.8}
          duration={ANIMATION_DURATIONS.particle + Math.random() * 4}
          color={colors.primary}
        />
      ))}

      {/* Mouse follower gradient */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{
          x: springX,
          y: springY,
          left: "-128px",
          top: "-128px",
          background: colors.gradientMouse,
        }}
      />

      {/* ===== MAIN CONTENT CONTAINER ===== */}

      <div className="relative w-full h-full bg-primary">
        {/* Left side - Text content */}
        <div className="flex flex-col pl-6 py-20 sm:pl-12 md:pl-16 lg:pl-24 h-[60vh] justify-between ">
          <div className="  flex flex-col justify-center   z-10 max-w-2xl">
            {/* Main heading */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.textStagger, delay: 0.2 }}
            >
              <TextCursorProximity
                label="FLEXANON"
                className="text-3xl sm:text-6xl md:text-6xl lg:text-9xl font-overusedGrotesk uppercase leading-none"
                styles={{
                  transform: {
                    from: "scale(1)",
                    to: "scale(1.4)",
                  },
                  color: {
                    from: "#FFFFFF",
                    to: colors.primary,
                  },
                }}
                falloff="gaussian"
                radius={100}
                // @ts-expect-error - containerRef type mismatch in TextCursorProximity component
                containerRef={containerRef}
              />
            </motion.div>

            {/* Subheading */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.textStagger, delay: 0.4 }}
              className="mt-5"
            >
              <TextCursorProximity
                label="ANONYMOUS IDENTITY ON SOLANA POWERED BY ZERION"
                className="text-sm sm:text-base md:text-lg lg:text-xl font-overusedGrotesk opacity-60 uppercase leading-none"
                styles={{
                  transform: {
                    from: "scale(1)",
                    to: "scale(1.2)",
                  },
                  color: {
                    from: "#FFFFFF",
                    to: colors.primary,
                  },
                }}
                falloff="gaussian"
                radius={80}
                // @ts-expect-error - containerRef type mismatch in TextCursorProximity component
                containerRef={containerRef}
              />
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.textStagger, delay: 0.5 }}
              className="mt-5 max-w-md"
            >
              <p className="text-md sm:text-sm opacity-100 normal-case font-light leading-relaxed text-white">
                Experience the future of anonymous transactions with cutting-edge blockchain technology
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION_DURATIONS.textStagger, delay: 0.8 }}
              className="flex gap-4 mt-6"
            >
              {FEATURE_BADGES.map((badge) => (
                <motion.div
                  key={badge}
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border backdrop-blur-sm text-white"
                  style={{
                    borderColor: isDark ? "rgba(255,68,68,0.3)" : "rgba(255,135,193,0.3)",
                    backgroundColor: isDark ? "rgba(255,68,68,0.1)" : "rgba(255,135,193,0.1)",
                  }}
                >
                  {badge}
                </motion.div>
              ))}
            </motion.div>

            {/* Connect Wallet CTA */}


            {/* Feature badges */}

          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.textStagger, delay: 0.6 }}
            className="mt-8"
          >
            <ConnectWalletButton />
          </motion.div>
        </div>
        {/* Right side - Rotating Earth */}


        {/* ===== OVERLAY ELEMENTS ===== */}

        <CornerDecoration color={colors.primary} position="top-left" />
        <CornerDecoration color={colors.primary} position="bottom-left" />
        <ScanLines color={colors.primary} />
      </div>
    </motion.div>
  )
}

export { Preview }