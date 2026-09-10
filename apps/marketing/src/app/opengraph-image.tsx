import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #06101f 0%, #0b1f3a 50%, #1a3a66 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, fontWeight: 600, color: '#a5b4fc' }}>
          {site.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
            {site.tagline}
          </div>
          <div style={{ fontSize: 24, color: '#cbd5e1', maxWidth: 900 }}>
            Omnichannel publishing, conversations, campaigns, analytics, and automation.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
