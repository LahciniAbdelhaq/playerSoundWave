import '@/styles/app.css';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { NowPlayingPanel } from '@/components/shell/NowPlayingPanel';
import { Player } from '@/components/shell/Player';
import { MobileTabs } from '@/components/shell/MobileTabs';
import { Scrim } from '@/components/shell/Scrim';
import { LyricsView } from '@/components/shell/LyricsView';
import { QueueView } from '@/components/shell/QueueView';

/**
 * Reproduces the SoundWave App shell (App.html):
 * 264px sidebar · top bar · scrollable main · 320px now-playing rail · 88px player.
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
        <NowPlayingPanel />
        <Player />
      </div>
      <MobileTabs />
      <LyricsView />
      <QueueView />
    </>
  );
}
