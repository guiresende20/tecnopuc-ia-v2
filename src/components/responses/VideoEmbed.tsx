'use client';

import { useEffect, useRef, useState } from 'react';
import type { VideoEmbed as VideoEmbedData } from '@/lib/video-embeds';
import { buildEmbedUrl } from '@/lib/video-embeds';

const PROVIDER_LABEL: Record<VideoEmbedData['provider'], string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
};

interface VideoEmbedProps {
  video: VideoEmbedData;
}

// Player embutido abaixo da resposta. O iframe só monta quando o card entra
// na viewport (lazy-mount via IntersectionObserver) — evita carregar o player
// de vídeo em respostas que o usuário nem rolou até ver.
export function VideoEmbed({ video }: VideoEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const src = buildEmbedUrl(video);
  const label = PROVIDER_LABEL[video.provider];

  return (
    <div className="video-embed" ref={ref}>
      <div className="video-frame">
        {visible ? (
          <iframe
            src={src}
            title={`Vídeo (${label})`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="video-placeholder" aria-hidden="true">
            <span className="play-icon">▶</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .video-embed {
          margin-top: 12px;
        }
        .video-frame {
          position: relative;
          width: 100%;
          max-width: 460px;
          aspect-ratio: 16 / 9;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(0, 153, 255, 0.06);
          border: 1px solid rgba(0, 153, 255, 0.18);
        }
        .video-frame :global(iframe) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .video-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0, 153, 255, 0.55);
        }
        .play-icon {
          font-size: 30px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
