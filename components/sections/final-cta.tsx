import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section id="contact" className="py-20 border-border md:py-20 border-t-0">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-6">Contact</p>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
            Have an idea? Let's rock with me
          </h2>

          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            Are you a company or brand seeking creative services, or simply inspired by what we're building? Let's
            connect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="mailto:hello@portfolio.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white rounded-full transition-all hover:shadow-2xl relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                boxShadow: "0 8px 32px rgba(32, 62, 236, 0.4)",
              }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Get in Touch
                <ArrowUpRight className="w-4 h-4" />
              </span>
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full hover:bg-secondary transition-colors"
              style={{ borderColor: "#203eec", borderWidth: "1px", color: "#203eec" }}
            >
              View Resume
            </Link>
          </div>

          {/* Contact Info */}
        </div>
      </div>
    </section>
  )
}
