import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GlobeInstance } from 'globe.gl';
import { X } from 'lucide-react';

const GlobeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let globe: GlobeInstance | null = null;
    let observer: ResizeObserver | null = null;
    const loadGlobe = window.setTimeout(() => {
      void import('globe.gl').then(({ default: Globe }) => {
        if (cancelled) return;

        globe = new Globe(container, {
          rendererConfig: { alpha: true, antialias: true, powerPreference: 'low-power' }
        })
          .width(container.clientWidth)
          .height(container.clientHeight)
          .backgroundColor('rgba(0,0,0,0)')
          .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
          .showAtmosphere(true)
          .atmosphereColor('#38d9ff')
          .atmosphereAltitude(0.18)
          .pointOfView({ lat: 20, lng: -100, altitude: 2.5 }, 0)
          .enablePointerInteraction(false);

        observer = new ResizeObserver(() => {
          if (!globe || !container.clientWidth || !container.clientHeight) return;
          globe.width(container.clientWidth).height(container.clientHeight);
        });
        observer.observe(container);

        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.45;
        globe.controls().enableZoom = false;
        globe.controls().enablePan = false;
      }).catch((error: unknown) => {
        console.error('No se pudo cargar el globo 3D:', error);
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(loadGlobe);
      observer?.disconnect();
      globe?.pauseAnimation();
      globe?._destructor();
      container.replaceChildren();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
};

interface MiniGlobeProps {
  startIntro?: boolean;
  onIntroComplete?: () => void;
}

export const MiniGlobe: React.FC<MiniGlobeProps> = ({ startIntro = false, onIntroComplete }) => {
  const [expanded, setExpanded] = useState(startIntro);
  const tapSequence = useRef({ count: 0, lastTap: 0 });
  const finishIntro = useCallback(() => {
    setExpanded(false);
    if (startIntro) onIntroComplete?.();
  }, [startIntro, onIntroComplete]);

  useEffect(() => {
    if (!startIntro || !expanded) return;
    const timer = window.setTimeout(finishIntro, 2800);
    return () => window.clearTimeout(timer);
  }, [startIntro, expanded, finishIntro]);

  const registerTap = () => {
    const now = Date.now();
    if (now - tapSequence.current.lastTap > 900) tapSequence.current.count = 0;
    tapSequence.current.count++;
    tapSequence.current.lastTap = now;
    if (tapSequence.current.count === 3) {
      tapSequence.current.count = 0;
      if (startIntro && expanded) finishIntro();
      else setExpanded((current) => !current);
    }
  };

  const closeGlobe = () => {
    if (startIntro) finishIntro();
    else setExpanded(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      registerTap();
    }
  };

  return expanded ? (
    <div
      role="dialog"
      aria-label="Globo terráqueo a pantalla completa"
      aria-modal="true"
      onClick={registerTap}
      className="fixed inset-0 z-[80] grid place-items-center bg-[#020711]"
    >
      <div className="h-[min(88vw,88vh,820px)] w-[min(88vw,88vh,820px)] overflow-hidden">
        <GlobeCanvas />
      </div>
      {!startIntro && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            closeGlobe();
          }}
          aria-label="Cerrar globo"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  ) : (
    <div
      role="button"
      tabIndex={0}
      aria-label="Globo terráqueo giratorio. Tres toques para pantalla completa."
      onClick={registerTap}
      onKeyDown={handleKeyDown}
      className="h-[64px] w-[64px] shrink-0 cursor-pointer overflow-hidden rounded-full sm:h-[72px] sm:w-[72px]"
    >
      <GlobeCanvas />
    </div>
  );
};