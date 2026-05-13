import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '180IQ Math Trainer',
  description: 'Train your mental math skills with precision',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '180IQ' },
};

export const viewport: Viewport = {
  themeColor: '#0F75BC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-[#F4FAFF] dark:bg-slate-950 min-h-screen antialiased`}>
        <ServiceWorkerRegister />
        <AuthProvider>{children}</AuthProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
