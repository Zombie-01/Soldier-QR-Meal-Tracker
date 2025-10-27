import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/sonner';
import { OfflineSync } from '@/components/offline-sync';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Хоолны хяналтын систем',
  description: 'Цэргийн хоолны хуваарилалтын систем',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className={`${inter.className} min-h-screen flex flex-col relative`}>
        {/* ✅ Background image section (behind everything, only 60vh tall) */}
       <div className="absolute top-0 left-0 w-full h-screen overflow-hidden -z-10">
          <img
              src="/bg.jpeg"
              alt="Background"
              className="absolute top-1/2 left-1/2 max-h-[80vh] -translate-x-1/2 -translate-y-1/2 object-contain"
            />

          <div className="absolute inset-0 bg-white/10" />
        </div>


        {/* ✅ Main app content */}
        <div className="relative z-10 flex-1">
          <AuthProvider>
            {children}
            <Toaster richColors />
            <OfflineSync />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
