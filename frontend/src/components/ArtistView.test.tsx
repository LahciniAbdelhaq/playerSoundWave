import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArtistView } from './ArtistView';
import type { Artist } from '@/lib/types';

// What GET /api/artists/:slug returns for an artist created by a YouTube
// import: no image, no albums, no bio, zero listeners, and tracks that carry
// no `artist` field of their own.
const IMPORTED = {
  id: 'a1',
  name: 'ElGrandeToto',
  slug: 'elgrandetoto',
  image: null,
  bio: null,
  listeners: 0,
  albums: [],
  topSongs: [
    {
      id: 's1',
      title: 'Imported track',
      duration: 192,
      plays: 0,
      cover: 'https://i.ytimg.com/vi/v22FrFFzRCI/hqdefault.jpg',
      streamUrl: '/api/songs/s1/stream',
      youtubeId: null,
    },
  ],
} as unknown as Artist;

const artistData = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/hooks/useCatalog', () => ({
  useArtist: () => ({ data: artistData.current, isLoading: false }),
}));
// Row menus use the app router, which only exists inside a Next app.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/artist/elgrandetoto',
  useSearchParams: () => new URLSearchParams(),
}));
// The YouTube section does its own fetching; not the subject of this test.
vi.mock('@/components/YoutubeResults', () => ({
  YoutubeResults: ({ query }: { query: string }) => <div>yt:{query}</div>,
}));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ArtistView slug="elgrandetoto" />
    </QueryClientProvider>,
  );
}

describe('artist page', () => {
  it('renders an artist imported from YouTube (no image, albums or listeners)', () => {
    artistData.current = IMPORTED;
    renderView();
    expect(screen.getByRole('heading', { name: 'ElGrandeToto' })).toBeTruthy();
    expect(screen.getByText('Imported track')).toBeTruthy();
    expect(screen.getByText('1 song in your library')).toBeTruthy();
    expect(screen.getByText('yt:ElGrandeToto')).toBeTruthy();
  });

  it('survives a payload missing the optional fields entirely', () => {
    artistData.current = { id: 'a2', name: 'Sparse', slug: 'sparse' } as unknown as Artist;
    renderView();
    expect(screen.getByRole('heading', { name: 'Sparse' })).toBeTruthy();
    expect(screen.getByText('Nothing from this artist saved yet.')).toBeTruthy();
  });
});
