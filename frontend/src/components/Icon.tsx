'use client';
import {
  Cast, ChevronLeft, ChevronRight, Check, CircleX, Clock, Compass, Download,
  Ellipsis, Headphones, Heart, History, House, Info, LibraryBig, ListMusic,
  ListPlus, Loader, Lock, LogOut, Mail, Maximize2, Menu, MicVocal, Moon, Music,
  Pause, Pencil, Play, Plus, Radio, Repeat, Repeat1, Search, Shuffle, SkipBack,
  SkipForward, Sparkles, Sun, Trash2, TriangleAlert, User, Users, Volume2,
  VolumeX, X, type LucideProps, type LucideIcon,
} from 'lucide-react';

// Curated registry — only the icons the app uses, imported by name so the
// bundler tree-shakes the rest of lucide out (previously the whole set shipped).
const REGISTRY: Record<string, LucideIcon> = {
  cast: Cast, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  check: Check, 'circle-x': CircleX, clock: Clock, compass: Compass,
  download: Download, ellipsis: Ellipsis, headphones: Headphones, heart: Heart,
  history: History, house: House, info: Info, 'library-big': LibraryBig,
  'list-music': ListMusic, 'list-plus': ListPlus, loader: Loader, lock: Lock,
  'log-out': LogOut, mail: Mail, 'maximize-2': Maximize2, menu: Menu,
  'mic-vocal': MicVocal, moon: Moon, music: Music, pause: Pause, pencil: Pencil,
  play: Play, plus: Plus, radio: Radio, repeat: Repeat, 'repeat-1': Repeat1,
  search: Search, shuffle: Shuffle, 'skip-back': SkipBack,
  'skip-forward': SkipForward, sparkles: Sparkles, sun: Sun, 'trash-2': Trash2,
  'triangle-alert': TriangleAlert, user: User, users: Users, 'volume-2': Volume2,
  'volume-x': VolumeX, x: X,
};

interface IconProps extends LucideProps {
  name: string;
  size?: number;
}

/** Renders a Lucide icon by its kebab name (matches the prototype's data-lucide). */
export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const Cmp = REGISTRY[name];
  if (!Cmp) return null;
  return (
    <Cmp
      width={size}
      height={size}
      className={['lucide', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
