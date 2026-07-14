import "./globals.css";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL('https://hivecode-k9ka.onrender.com'),
  title: {
    default: "HiveCode - Real-time Collaborative Code Sharing",
    template: "%s | HiveCode"
  },
  description: "Collaborate, edit, and share code with anyone, anywhere in real-time. Fast, secure, and built for developers with raw WebSockets presence tracking.",
  keywords: ["HiveCode", "collaborative coding", "real-time editor", "online code editor", "share code", "pair programming", "collaborative text editor", "websockets", "nextjs", "render"],
  authors: [{ name: "HiveCode Team" }],
  creator: "HiveCode",
  publisher: "HiveCode",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HiveCode - Real-time Collaborative Code Sharing',
    description: 'Collaborate, edit, and share code with anyone, anywhere in real-time. Fast, secure, and built for developers.',
    url: 'https://hivecode-k9ka.onrender.com',
    siteName: 'HiveCode',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HiveCode - Real-time Collaborative Code Sharing',
    description: 'Collaborate, edit, and share code with anyone, anywhere in real-time.',
    creator: '@hivecode',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'HiveCode',
    'url': 'https://hivecode-k9ka.onrender.com',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'All',
    'description': 'Collaborate, edit, and share code with anyone, anywhere in real-time with raw WebSockets presence tracking.',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

        {/* CodeMirror styles */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}

        {/* CodeMirror Scripts */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
