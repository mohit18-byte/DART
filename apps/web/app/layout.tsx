import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dart — AI Browser Agent',
  description:
    'Your personal AI assistant that controls your real browser. Give natural language commands and watch Dart execute them step by step.',
  openGraph: {
    title: 'Dart — AI Browser Agent',
    description: 'Your AI assistant that controls your real browser.',
    type: 'website',
    siteName: 'Dart',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dart — AI Browser Agent',
    description: 'Your AI assistant that controls your real browser.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-canvas text-ink font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
