import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dart — AI Browser Agent',
  description:
    'Your personal AI assistant that controls your real browser. Give natural language commands and watch Dart execute them step by step.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
