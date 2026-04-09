import Link from "next/link";

export function LandingFooter() {
  return (
    <footer
      id="footer"
      className="border-t border-brand-border/40 bg-brand-bg-secondary/15"
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* ── Brand ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <span className="text-white text-xs font-bold leading-none">
                  A
                </span>
              </div>
              <span className="font-heading text-body-lg font-semibold text-brand-text-primary">
                AiMavrik Catalyst
              </span>
            </div>
            <p className="text-body-sm text-brand-text-tertiary leading-relaxed max-w-xs">
              Managed AI execution system for business growth and operations.
            </p>
          </div>

          {/* ── Links ── */}
          <div className="space-y-4">
            <p className="text-label-sm text-brand-text-secondary tracking-wider">
              LINKS
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="text-body-sm text-brand-text-tertiary hover:text-brand-text-primary transition-colors"
              >
                Login
              </Link>
              <a
                href="#"
                className="text-body-sm text-brand-text-tertiary hover:text-brand-text-primary transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-body-sm text-brand-text-tertiary hover:text-brand-text-primary transition-colors"
              >
                Terms
              </a>
            </div>
          </div>

          {/* ── Contact ── */}
          <div className="space-y-4">
            <p className="text-label-sm text-brand-text-secondary tracking-wider">
              CONTACT
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:hello@aimavrik.com"
                className="text-body-sm text-brand-text-tertiary hover:text-brand-text-primary transition-colors"
              >
                hello@aimavrik.com
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-brand-text-tertiary hover:text-brand-text-primary transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-border/25">
          <p className="text-body-sm text-brand-text-tertiary text-center">
            &copy; {new Date().getFullYear()} AiMavrik. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
