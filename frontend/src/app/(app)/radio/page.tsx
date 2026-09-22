'use client';
import { Icon } from '@/components/Icon';

export default function RadioPage() {
  return (
    <>
      <div className="hero-greet">
        <div>
          <h1>Live Radio</h1>
          <div className="sub">Curated stations, always on.</div>
        </div>
      </div>
      <div className="banner info" style={{ maxWidth: 560 }}>
        <Icon name="radio" className="b-icon" />
        <div>
          <div className="b-title">Stations are coming online</div>
          <div className="b-text">
            Live radio streams will appear here as the catalogue grows.
          </div>
        </div>
      </div>
    </>
  );
}
