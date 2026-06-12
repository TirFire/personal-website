"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowDown } from "lucide-react"
import { useEffect, useState } from "react"

export function Hero() {
  const titleText = "Designing intelligence with a human touch"
  const words = titleText.split(" ")
  const [maskReveal, setMaskReveal] = useState(0)
  const [opacity, setOpacity] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)

    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const maxScroll = 500
      const revealPercentage = Math.min(100, (scrollPosition / maxScroll) * 100)
      const calculatedOpacity = Math.min(1, scrollPosition / maxScroll)
      setMaskReveal(revealPercentage)
      setOpacity(calculatedOpacity)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", checkDesktop)
    }
  }, [])

  return (
    <section className="min-h-screen flex flex-col justify-center pt-20 relative overflow-hidden">
      <div className="absolute -right-32 md:-right-48 top-32 md:top-40 w-[500px] h-[500px] md:w-[750px] md:h-[750px] pointer-events-none animate-orb-rotate -z-10 scale-125">
        <Image src="/images/orb.png" alt="" width={750} height={750} className="w-full h-full" priority />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-20 md:py-32 md:pb-4 pb-4 pt-4 md:pt-32">
        <div className="max-w-4xl">
          <p className="text-muted-foreground mb-6 text-lg font-normal">I'm Abby, AI Digital Product Designer</p>

          {/* Main Title with animated words */}
          <h1 className="text-5xl sm:text-6xl lg:text-[96px] font-semibold tracking-tight leading-[1] text-balance md:text-9xl">
            {words.map((word, index) => (
              <span
                key={index}
                className={`hero-word my-0 py-2 font-mono font-normal text-5xl md:text-7xl ${word === "AI" ? "ai-gradient-word" : ""}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  marginRight: index < words.length - 1 ? "0.25em" : "0",
                  ...(word === "AI"
                    ? {
                        background: "linear-gradient(135deg, #ff006e 0%, #8b5cf6 33%, #203eec 66%, #00d4ff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter:
                          "drop-shadow(0 0 20px rgba(255, 0, 110, 0.3)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.3)) drop-shadow(0 0 40px rgba(0, 212, 255, 0.2))",
                      }
                    : {}),
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-xl leading-relaxed text-left text-lg text-zinc-500 ml-0">
            I craft intelligent, intuitive AI-powered products using vibe coding, generative design tools, and
            cutting-edge AI technologies. Let's build the future of human-AI interaction together.
          </p>

          <div className="flex flex-row items-start gap-4 mt-10">
            <Link
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white rounded-full transition-all relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                boxShadow: "0 4px 20px rgba(32, 62, 236, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(32, 62, 236, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(32, 62, 236, 0.3)"
              }}
            >
              Let's Talk
            </Link>
            <Link
              href="#works"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium transition-colors"
              style={{ color: "#203eec" }}
            >
              View Works
              <ArrowDown className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full mt-8">
        <Image
          src="/images/designer.png"
          alt="Designer workspace"
          width={1200}
          height={800}
          className="w-full h-auto transition-all duration-100 ease-out"
          style={{
            opacity: opacity,
            clipPath: isDesktop ? `inset(${100 - maskReveal}% 0 0 0)` : "none",
          }}
          priority
        />
      </div>
    </section>
  )
}
