import { BentoStats } from '@/components/BentoStats';
import { Dashboard } from '@/components/Dashboard';
import { DemoTestimonials } from '@/components/DemoTestimonials';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { TerminalShowcase } from '@/components/TerminalShowcase';
import { TopNav } from '@/components/TopNav';
import { VaultProvider } from '@/components/VaultProvider';
import { VoiceBot } from '@/components/VoiceBot';
import { WorkspaceTiers } from '@/components/WorkspaceTiers';

export default function HomePage() {
  return (
    <VaultProvider>
      <TopNav />
      <main>
        <Hero />
        <Features />
        <Dashboard />
        <BentoStats />
        <TerminalShowcase />
        <WorkspaceTiers />
        <DemoTestimonials />
      </main>
      <Footer />
      <VoiceBot />
    </VaultProvider>
  );
}
