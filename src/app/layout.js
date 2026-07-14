import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "CodeSync - Real-time Collaborative Code Sharing",
  description: "Collaborate, edit, and execute code with anyone, anywhere in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        
        {/* CodeMirror styles */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css" />
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
