import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { MapSearchLocation, UnidadMedica } from '../types.ts';

interface SearchSuggestionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  unidades: UnidadMedica[];
  isLoading: boolean;
  searchLocation: MapSearchLocation | null;
  onSelectUnit: (unidad: UnidadMedica) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  'PRIMER NIVEL': '#16A34A',
  'SEGUNDO NIVEL': '#F59E0B',
  'TERCER NIVEL': '#DC2626',
  'NO APLICA': '#6B7280'
};

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchTerm,
  onSearchChange,
  unidades,
  isLoading,
  searchLocation,
  onSelectUnit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showSuggestions = isOpen && Boolean(searchTerm.trim());

  return (
    <div className="relative w-full text-stone-100">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-white/15 bg-[#071512]/95 px-4 shadow-2xl backdrop-blur-xl focus-within:border-emerald-400/70">
        <Search className="h-4 w-4 shrink-0 text-emerald-300" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Buscar unidades médicas"
          aria-expanded={showSuggestions}
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar CLUES, unidad o localidad"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-stone-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="rounded p-1 text-stone-400 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-14 max-h-[min(55vh,440px)] overflow-y-auto rounded-xl border border-white/10 bg-[#071512]/97 py-1 shadow-2xl backdrop-blur-xl">
          {searchLocation && (
            <div className="border-b border-white/10 px-4 py-2 text-xs text-cyan-200">
              CLUES cercanas a <strong className="font-semibold text-white">{searchLocation.nombre}</strong>
              <span className="ml-1 text-stone-400">· {searchLocation.radioKm} km</span>
            </div>
          )}
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-stone-400">Buscando unidades...</p>
          ) : unidades.length === 0 ? (
            <p className="px-4 py-3 text-sm text-stone-400">Sin coincidencias</p>
          ) : (
            unidades.slice(0, 10).map((unidad) => {
              const color = LEVEL_COLORS[unidad.nivel_atencion.toUpperCase()] ?? '#6B7280';
              const displayName = unidad.nombre_comercial?.trim() || unidad.nombre_unidad;
              const location = [
                unidad.codigo_postal && `C.P. ${unidad.codigo_postal}`,
                unidad.direccion,
                unidad.municipio,
                unidad.entidad
              ].filter(Boolean).join(', ');
              return (
                <button
                  type="button"
                  key={unidad.clues}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setIsOpen(false);
                    onSelectUnit(unidad);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/8 focus:bg-white/8 focus:outline-none"
                >
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{displayName}</span>
                    <span className="mt-0.5 block truncate text-xs text-stone-400">
                      {unidad.clues} · {location}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};