"use client"

import { useEffect, useState } from "react"

export function GradientBar({ targetId = "home-projects" }: { targetId?: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const selectedWorksSection = document.querySelector(`#${targetId}`)
      if (selectedWorksSection) {
        const rect = selectedWorksSection.getBoundingClientRect()
        const isSectionVisible = rect.top < window.innerHeight && rect.bottom > 0
        setIsVisible(isSectionVisible)
      } else {
        setIsVisible(window.scrollY > 140)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [targetId])

  return <div className="bottom-gradient-bar transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0 }} />
}
