"use client"

import { motion } from "framer-motion"
import { useState, useRef } from "react"
import ConnectWalletButton from "../connect-wallet-button"
import SplitText from "../SplitText"
import { TextHoverEffect } from "../ui/text-hover-effect"

export default function Hero() {
  const [textDone, setTextDone] = useState(false)
  const hasAnimated = useRef(false)
  const [typedText, setTypedText] = useState("")

  const handleAnimationComplete = () => {
    if (!hasAnimated.current) {
      hasAnimated.current = true
      setTextDone(true)
      startTypingEffect()
    }
  }

  const startTypingEffect = () => {
    const fullText = "SOLANA"
    let index = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1))
      index++
      if (index === fullText.length) clearInterval(interval)
    }, 200)
  }

  return (
    <section className="relative flex items-center justify-start h-screen bg-black text-white overflow-hidden px-6 sm:px-16 lg:px-32">

      {/* Column Grid Background */}
      <div className="absolute inset-0 z-0 flex">
        <div className="absolute inset-0 z-0 flex h-full opacity-30">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="relative flex-1 h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-950 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05),transparent_70%)] mix-blend-overlay" />
              <div className="absolute inset-0 shadow-[inset_10px_0_40px_rgba(0,0,0,0.7),inset_-10px_0_40px_rgba(0,0,0,0.6)]" />
              <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-neutral-700/30 via-neutral-800/50 to-neutral-900/80" />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient glow overlay */}
      <motion.div
        className="absolute w-[1000px] h-[1700px] pointer-events-none"
        style={{
          background:
            " linear-gradient(90deg,rgba(119, 236, 157, 1) 44%, rgba(80, 174, 187, 1) 63%, rgba(122, 87, 197, 1) 81%)",
          filter: "blur(60px) brightness(1.1) contrast(1.1)",
          transform: "rotate(210deg)",
          transformOrigin: "right",
        }}
        initial={{ opacity: 0 }}
        animate={textDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
      />






      {/* Massive SOLANA text at bottom */}
      <div
        className="absolute sansation-bold bottom-[-20%] text-white z-10 left-0 w-full text-center  font-extrabold select-none pointer-events-none "
        style={{


          fontSize: "11vw",
          lineHeight: 1,
        }}

      >

        <span>FLEXANON</span>
      </div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 -mt-52 max-w-2xl"
      >
        <SplitText
          key="hero-title"
          text="Build Your  Profile, Effortlessly."
          className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight sansation-bold"
          delay={50}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="left"
          onLetterAnimationComplete={handleAnimationComplete}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={textDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="text-gray-400 mb-10 text-lg sm:text-xl"
        >
          Connect your wallet, create a unique profile, and share it with anyone in the Web3 ecosystem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={textDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1 }}
        >
          <ConnectWalletButton />
        </motion.div>
      </motion.div>
    </section>
  )
}
