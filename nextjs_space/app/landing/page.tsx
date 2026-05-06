'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, BookOpen, BarChart3, Globe, FileText, Palette, Music } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* SECTION 1: HERO */}
      {/* ============================================ */}
      <section className="bg-[#1E3A8A] min-h-[90vh] flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src="/assets/mwp-logo-white.svg"
            alt="Ministerial Worship Planner"
            width={120}
            height={100}
            className="mx-auto"
            priority
          />
        </div>

        {/* H1 Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight max-w-4xl mb-6">
          Organize Your Worship with Excellence and Biblical Depth
        </h1>

        {/* Subheading */}
        <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mb-10 leading-relaxed">
          A denomination-aware worship planning system designed to bring structure, balance, and pastoral clarity to Christian churches.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/start"
            className="bg-[#C9A227] hover:bg-[#B8911F] text-[#1E3A8A] font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Start 30-Day Free Trial
          </Link>
          <Link
            href="mailto:demo@ministerialworship.com?subject=Demo Request"
            className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Request a Private Demo
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: PROBLEM */}
      {/* ============================================ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E3A8A] font-bold mb-12">
            Many Churches Desire Order, But Lack Structure
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              'Improvised service flow',
              'Inconsistent doctrinal balance',
              'Repetition of songs and themes',
              'Disorganized ceremony planning',
            ].map((problem, idx) => (
              <div
                key={idx}
                className="bg-[#E5E7EB] rounded-lg p-6 text-[#1E3A8A] text-lg font-medium flex items-center gap-4"
              >
                <span className="text-2xl">•</span>
                {problem}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: SOLUTION */}
      {/* ============================================ */}
      <section className="bg-[#E5E7EB] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E3A8A] font-bold mb-14">
            A Structured System for Christian Worship
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Structured Templates',
                description: 'Weekly worship programs and ceremony templates ready to customize.',
              },
              {
                icon: BarChart3,
                title: 'Smart Doctrinal Balance',
                description: 'Denomination-aware hymn weighting for theological consistency.',
              },
              {
                icon: CheckCircle,
                title: 'Biblical Coverage Tracking',
                description: 'Annual balance insights to ensure comprehensive worship themes.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-sm">
                <item.icon className="w-12 h-12 text-[#1E3A8A] mx-auto mb-6 stroke-[1.5]" />
                <h3 className="font-serif text-xl text-[#1E3A8A] font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: DENOMINATIONAL ADAPTABILITY */}
      {/* ============================================ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E3A8A] font-bold mb-6">
            Designed for Christian Churches Across Traditions
          </h2>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            The system adapts templates and doctrinal weighting according to your church&apos;s tradition.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Seventh-day Adventist',
              'Baptist',
              'Methodist',
              'Pentecostal',
              'Presbyterian',
              'Lutheran',
              'Non-denominational',
            ].map((denom, idx) => (
              <span
                key={idx}
                className="bg-[#E5E7EB] text-[#1E3A8A] px-5 py-2 rounded-full text-sm font-medium"
              >
                {denom}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: FEATURES GRID */}
      {/* ============================================ */}
      <section className="bg-[#E5E7EB] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E3A8A] font-bold mb-14">
            Core Features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Music, title: 'Weekly Worship Programs' },
              { icon: BookOpen, title: 'Ceremony Templates' },
              { icon: Globe, title: 'Multi-language Support' },
              { icon: FileText, title: 'PDF & PowerPoint Export' },
              { icon: BarChart3, title: 'Doctrinal Analytics' },
              { icon: Palette, title: 'Custom Branding per Church' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4"
              >
                <feature.icon className="w-8 h-8 text-[#1E3A8A] stroke-[1.5] flex-shrink-0" />
                <span className="text-[#1E3A8A] font-medium text-lg">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 6: PRICING */}
      {/* ============================================ */}
      <section className="bg-[#1E3A8A] py-20 px-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-10 shadow-xl text-center">
            <p className="text-[#1E3A8A] text-lg font-medium mb-2">Simple Pricing</p>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="font-serif text-5xl font-bold text-[#1E3A8A]">$29</span>
              <span className="text-gray-500 text-lg">/ month per church</span>
            </div>

            <ul className="text-left space-y-3 mb-8">
              {[
                'All templates',
                'Smart generator',
                'Doctrinal balance engine',
                'Unlimited programs',
                '30-day free trial',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-[#C9A227] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/start"
              className="block w-full bg-[#C9A227] hover:bg-[#B8911F] text-[#1E3A8A] font-semibold px-8 py-4 rounded-lg text-lg transition-colors text-center"
            >
              Start Free Trial
            </Link>

            <p className="text-gray-500 text-sm mt-4">No contracts. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 7: FINAL CTA */}
      {/* ============================================ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1E3A8A] font-bold mb-8">
            Bring Order and Depth to Your Worship.
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-[#C9A227] hover:bg-[#B8911F] text-[#1E3A8A] font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Start 30-Day Free Trial
            </Link>
            <Link
              href="mailto:demo@ministerialworship.com?subject=Demo Request"
              className="text-[#1E3A8A] hover:text-[#C9A227] font-semibold px-8 py-4 text-lg transition-colors underline underline-offset-4"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 8: FOOTER */}
      {/* ============================================ */}
      <footer className="bg-[#1E3A8A] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/assets/mwp-logo-horizontal-white.svg"
              alt="Ministerial Worship Planner"
              width={180}
              height={40}
              className="mx-auto"
            />
          </div>

          <p className="text-white/80 text-lg mb-6">
            Structured Worship. Biblical Depth.
          </p>

          <p className="text-white/60 text-sm mb-4">
            © 2026 Ministerial Worship Planner
          </p>

          <div className="flex justify-center gap-6 text-white/60 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="mailto:contact@ministerialworship.com" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
