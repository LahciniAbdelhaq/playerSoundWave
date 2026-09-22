import '@/styles/app.css';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { ActivityPanel } from '@/components/shell/ActivityPanel';
import { Player } from '@/components/shell/Player';
import { MobileTabs } from '@/components/shell/MobileTabs';
import { Scrim } from '@/components/shell/Scrim';
import { LyricsView } from '@/components/shell/LyricsView';
import { QueueView } from '@/components/shell/QueueView';

/**
 * Reproduces the SoundWave App shell (App.html):
 * 264px sidebar · top bar · scrollable main · 320px activity rail · 88px player.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Scrim />
      <div className="shell">
        <Sidebar />
        <Topbar />
        <main className="main surface" id="main" data-screen-label="Main Content">
          {children}
        </main>
        <ActivityPanel />
        <Player />
      </div>
      <MobileTabs />
      <LyricsView />
      <QueueView />
    </>
  );
}
