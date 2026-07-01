import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Dart',
  description: 'Choose the plan that fits your workflow. Start free, upgrade when you need more.',
};

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Dart',
    features: [
      '5 tasks per day',
      'Gemini Flash 2.0 model',
      'Basic browser control',
      'Step-by-step visibility',
      'Community support',
    ],
    cta: 'Get Started Free',
    href: '/download',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For power users who need more',
    features: [
      '30 tasks per day',
      'Claude Sonnet 4 model',
      'Advanced browser control',
      'Priority execution',
      'Email support',
      'Task history & analytics',
    ],
    cta: 'Upgrade to Pro',
    href: '/dashboard',
    highlighted: true,
  },
  {
    name: 'Power',
    price: '$79',
    period: '/month',
    description: 'For teams and heavy automation',
    features: [
      '100 tasks per day',
      'Claude Sonnet 4 model',
      'Multi-tab orchestration',
      'Priority execution',
      'Dedicated support',
      'Custom agent instructions',
      'API access (coming soon)',
    ],
    cta: 'Go Power',
    href: '/dashboard',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <h1 className="text-4xl md:text-5xl font-normal leading-[1.1] tracking-[-1px] text-ink mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-body mb-16 max-w-xl mx-auto">
          Start free. Upgrade when you need more tasks and better AI models.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-ink text-canvas border-2 border-primary shadow-xl shadow-primary/10'
                  : 'bg-surface-card border border-hairline'
              }`}
            >
              <div className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-[1px] mb-3 ${plan.highlighted ? 'text-primary' : 'text-primary'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-semibold tracking-tight ${plan.highlighted ? 'text-canvas' : 'text-ink'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-canvas/60' : 'text-muted'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlighted ? 'text-canvas/70' : 'text-body'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                      <path d="M20 6L9 17l-5-5" stroke={plan.highlighted ? '#cc785c' : '#5db872'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`text-sm ${plan.highlighted ? 'text-canvas/80' : 'text-body'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center h-11 px-6 text-sm font-medium rounded-lg transition-all ${
                  plan.highlighted
                    ? 'bg-primary text-on-primary hover:bg-primary-hover'
                    : 'bg-canvas text-ink border border-hairline hover:bg-hairline-soft'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-hairline bg-canvas">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-semibold text-ink text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-8">
            {[
              { q: 'Is Dart safe to use?', a: 'Dart runs in your real browser but never accesses or stores your passwords. It uses your existing logged-in sessions. The agent never enters credentials and refuses to modify security settings.' },
              { q: 'What can Dart do?', a: 'Navigate websites, click buttons, fill forms, extract data, post to social media, manage emails — any task you\'d do manually in your browser.' },
              { q: 'Which AI model does Dart use?', a: 'Free tier uses Gemini Flash 2.0 for fast responses. Pro and Power tiers use Claude Sonnet 4 for higher accuracy on complex tasks.' },
              { q: 'Can I cancel anytime?', a: 'Yes! You can downgrade or cancel your subscription at any time. You\'ll keep access until the end of your billing period.' },
              { q: 'Does Dart work on mobile?', a: 'Not yet — Dart is a Chrome extension and currently works on desktop Chrome only. Mobile support is on our roadmap.' },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold text-ink mb-2">{faq.q}</h3>
                <p className="text-sm text-body leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
