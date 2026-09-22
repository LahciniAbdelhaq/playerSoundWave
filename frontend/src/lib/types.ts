export interface ArtistRef {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface AlbumRef {
  id: string;
  title: string;
  cover?: string | null;
}

export interface Song {
  id: string;
  title: string;
  duration: number;
  plays?: number;
  likes?: number;
  cover?: string | null;
  streamUrl: string;
  artist: ArtistRef;
  album?: AlbumRef | null;
}

export interface Artist extends ArtistRef {
  bio?: string | null;
  listeners: number;
  albums?: AlbumRef[];
  topSongs?: Song[];
}

export interface Album extends AlbumRef {
  releaseDate?: string | null;
  artist: ArtistRef;
  tracks?: Song[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  isPublic: boolean;
  songCount?: number;
  tracks?: Song[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
