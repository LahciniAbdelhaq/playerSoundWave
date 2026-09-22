import '@/styles/app.css';

/** Minimal centered chrome for auth screens (no player shell). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
      }}
    >
      {children}
    </div>
  );
}
