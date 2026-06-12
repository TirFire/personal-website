"use client"

import Link from "next/link"
import { Github, Linkedin, Twitter, Dribbble } from "lucide-react"

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Dribbble, label: "Dribbble" },
]

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#works", label: "Works" },
  { href: "#insights", label: "Insights" },
  { href: "#contact", label: "Contact" },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              portfolio
            </Link>
            <p className="mt-4 text-muted-foreground text-sm max-w-xs leading-relaxed">
              Independent digital product designer crafting thoughtful, pixel-perfect experiences for the web.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-full bg-secondary transition-colors hover:bg-opacity-10"
                  style={{ ["--hover-bg" as any]: "#203eec20" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#203eec20")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" style={{ color: "#203eec" }} />
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="mailto:hello@portfolio.com"
                className="text-sm transition-colors hover:underline"
                style={{ color: "#203eec" }}
              >
                hello@portfolio.com
              </Link>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Pages</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4">Get insights and updates directly to your inbox.</p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2.5 text-sm bg-secondary rounded-lg border-0 focus:ring-2 outline-none"
                style={{ ["--tw-ring-color" as any]: "#203eec" }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all relative overflow-hidden"
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
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-16 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} portfolio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
