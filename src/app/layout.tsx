import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TelemetryTracker } from "@/components/providers/telemetry-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tamarcado-agendamento.com'),
  title: "TáMarcado - Agendamento Online para Negócios & Especialistas",
  description: "A plataforma completa de agendamento online inteligente para escritórios de advocacia, clínicas, salões, barbearias, consultorias e profissionais autônomos no Brasil.",
  keywords: [
    "agendamento online",
    "sistema de agendamento",
    "marcar horario online",
    "agenda online barbearia",
    "agenda online clinica",
    "agenda online salao",
    "agenda online consultorio",
    "software de agendamento brasil",
    "agendamento de clientes",
    "tamarcado",
  ],
  authors: [{ name: "TáMarcado" }],
  creator: "TáMarcado",
  publisher: "TáMarcado",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://tamarcado-agendamento.com",
    languages: {
      "pt-BR": "https://tamarcado-agendamento.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://tamarcado-agendamento.com",
    siteName: "TáMarcado",
    title: "TáMarcado - Agendamento Online Inteligente para Negócios no Brasil",
    description: "Automatize seus agendamentos, envie lembretes por e-mail e tenha sua página personalizada pronta em 2 minutos.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "TáMarcado - Sistema de Agendamento Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TáMarcado - Agendamento Online para Negócios",
    description: "Plataforma completa de agendamento online inteligente para negócios e especialistas no Brasil.",
    images: ["/icon.png"],
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icon.png',
  },
  verification: {
    google: [
      'qtN5FuI_0ryTpnB0Zkqbl3jfpyxKxL7iQm6dCfvrC8U',
      '9DMDT4wpxflQDnwZoLPCJbwUqSwr8CfIUXiY3YBFh64',
      'google6b3ef84142767305',
    ],
  },
  other: {
    'geo.region': 'BR',
    'geo.placename': 'Brasil',
    'geo.position': '-14.2350;-51.9253',
    'ICBM': '-14.2350, -51.9253',
    'DC.Language': 'pt-BR',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18409831535"
        />
        <Script
          id="google-ads-gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18409831535');
            `,
          }}
        />
        <TelemetryTracker />
        {children}
      </body>
    </html>
  );
}
