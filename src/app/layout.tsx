import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider, themeBootstrapScript } from "./_components/theme-provider";
import { exo2, montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy Predict — Admin Console",
  description: "Admin dashboard for managing the Fantasy Predict platform",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Fantasy Predict — Admin Console",
    description: "Admin dashboard for managing the Fantasy Predict platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${exo2.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}