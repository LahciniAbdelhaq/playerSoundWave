'use client';
import { use } from 'react';
import { ArtistView } from '@/components/ArtistView';

/** Route wrapper: unwraps the async params, then renders the view. */
export default function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ArtistView slug={slug} />;
}
