import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { AuraFooter } from '@/components/AuraFooter';

export const metadata: Metadata = {
  title: {
    default: 'Aura — Cinematic Gallery & Event Platform',
    template: '%s | Aura',
  },
  description:
    'Sleek visual intelligence platform for capturing, organizing, and discovering memories with AI.',
  keywords: ['Aura', 'cinematic gallery', 'event media', 'photos', 'facial recognition', 'AI search'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {children}
          </main>
          <AuraFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
