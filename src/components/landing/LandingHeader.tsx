"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Product", href: "#solution" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="landing-nav fixed top-0 left-0 right-0 z-50 border-b border-brand-border/40 bg-brand-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <span className="text-white text-sm font-bold leading-none">A</span>
          </div>
          <span className="font-heading text-body-lg font-semibold text-brand-text-primary">
            AiMavrik{" "}
            <span className="text-brand-text-secondary font-normal">
              Catalyst
            </span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-body-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* ── Desktop actions ── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-body-sm px-4 py-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/5 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="btn btn-primary !h-10 !text-body-sm !px-5"
          >
            Sign Up
          </Link>
        </div>

        {/* ── Mobile toggle ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-brand-text-secondary hover:text-brand-text-primary"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border/40 bg-brand-bg-primary/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block text-body-lg text-brand-text-secondary hover:text-brand-text-primary transition-colors py-2"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-4 border-t border-brand-border/30 space-y-3">
              <Link
                href="/login"
                className="block text-body-lg text-brand-text-secondary hover:text-brand-text-primary"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary w-full !text-body-sm"
              >
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
