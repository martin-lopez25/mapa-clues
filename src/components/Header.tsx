import React from 'react';
import { MapPin, Search, Navigation2 } from 'lucide-react';
import { MiniGlobe } from './MiniGlobe.tsx';

interface HeaderProps {
  onLocateUser: () => void;
  isLocating: boolean;
  activeTab: 'todos' | 'cercanas';
  setActiveTab: (tab: 'todos' | 'cercanas') => void;
  hasUserLocation: boolean;
  startGlobeIntro: boolean;
  onGlobeIntroComplete: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLocateUser,
  isLocating,
  activeTab,
  setActiveTab,
  hasUserLocation,
  startGlobeIntro,
  onGlobeIntroComplete
}) => {
  return (
    <header className="h-20 bg-[#081715] border-b border-[#142C26] px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8 shrink-0 z-30 select-none shadow-md">
      {/* Zone 1: Identidad Tecnológica & Geoespacial */}
      <div className="flex items-center gap-3.5 shrink-0">
        <MiniGlobe startIntro={startGlobeIntro} onIntroComplete={onGlobeIntroComplete} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              GEO·SALUD 3D
            </span>
          </div>
          <span className="text-[11px] text-stone-300 font-normal hidden sm:inline-block leading-none">
            Plataforma Tridimensional de Unidades Médicas de México
          </span>
        </div>
      </div>

      {/* Zone 2: Segmented Control Minimalista */}
      <nav className="hidden lg:flex items-center p-1 bg-[#0D221E] border border-[#16362F] rounded-xl text-xs font-medium text-stone-300">
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'todos'
              ? 'bg-[#173C33] text-white shadow-xs font-semibold border border-[#34D399]/30'
              : 'hover:text-white hover:bg-white/5 text-stone-300'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Explorar Catálogo</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cercanas');
            if (!hasUserLocation) {
              onLocateUser();
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cercanas'
              ? 'bg-[#9D2449] text-white shadow-xs font-semibold shadow-[#9D2449]/30 border border-[#F472B6]/40'
              : 'hover:text-white hover:bg-white/5 text-stone-300'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          <span>Unidades Cercanas</span>
        </button>
      </nav>

      {/* Zone 3: Botón de Telemetría GPS */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Botón principal de ubicación satelital */}
        <button
          onClick={onLocateUser}
          disabled={isLocating}
          aria-label={isLocating ? 'Detectando GPS' : hasUserLocation ? 'GPS conectado' : 'Localizar cerca de mí'}
          title={isLocating ? 'Detectando GPS' : hasUserLocation ? 'GPS conectado' : 'Localizar cerca de mí'}
          className={`relative group flex items-center gap-2 px-2.5 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md disabled:cursor-wait ${
            hasUserLocation
              ? 'bg-[#13322B] hover:bg-[#1A4239] border border-[#34D399]/40 text-[#34D399]'
              : 'bg-gradient-to-r from-[#9D2449] to-[#801B39] hover:from-[#B12953] hover:to-[#921F42] text-white shadow-[#9D2449]/30 active:scale-[0.98] border border-[#F472B6]/30'
          }`}
        >
          <Navigation2
            className={`w-4 h-4 transition-transform ${
              isLocating ? 'animate-spin text-amber-300' : 'group-hover:rotate-12'
            }`}
          />
          <span className="hidden whitespace-nowrap font-medium sm:inline">
            {isLocating
              ? 'Detectando GPS...'
              : hasUserLocation
              ? 'GPS Conectado'
              : 'Localizar cerca de mí'}
          </span>
          {hasUserLocation && (
            <span className="w-2 h-2 rounded-full bg-[#34D399] ring-4 ring-[#34D399]/25"></span>
          )}
        </button>
      </div>
    </header>
  );
};
