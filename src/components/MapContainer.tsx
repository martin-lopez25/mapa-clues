import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { UnidadMedica, UserCoordinates } from '../types.ts';
import { Navigation, Compass, Layers, Cross, Maximize2, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

interface MapContainerProps {
  unidades: UnidadMedica[];
  selectedUnit: UnidadMedica | null;
  onSelectUnit: (unidad: UnidadMedica) => void;
  userLocation: UserCoordinates | null;
  onLocateUser: () => void;
  isLocating: boolean;
}

const INSTITUTION_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  IMSS: { bg: '#13322B', border: '#0A1B17', glow: 'rgba(19, 50, 43, 0.35)' },
  ISSSTE: { bg: '#1E3A8A', border: '#172554', glow: 'rgba(30, 58, 138, 0.35)' },
  'SSA / IMSS-BIENESTAR': { bg: '#9D2449', border: '#67142E', glow: 'rgba(157, 36, 73, 0.35)' },
  PEMEX: { bg: '#C2410C', border: '#7C2D12', glow: 'rgba(194, 65, 12, 0.35)' },
  SEDENA: { bg: '#3F6212', border: '#1A2E05', glow: 'rgba(63, 98, 18, 0.35)' },
  PRIVADO: { bg: '#475569', border: '#1E293B', glow: 'rgba(71, 85, 105, 0.35)' },
  OTRO: { bg: '#52525B', border: '#27272A', glow: 'rgba(82, 82, 91, 0.35)' }
};

export const MapContainer: React.FC<MapContainerProps> = ({
  unidades,
  selectedUnit,
  onSelectUnit,
  userLocation,
  onLocateUser,
  isLocating
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Centro inicial: México
    const defaultCenter: L.LatLngExpression = [23.6345, -102.5528];
    const defaultZoom = 5;

    const map = L.map(mapElementRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false
    });

    // Cartografía OpenStreetMap de alta definición
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar marcador de posición del usuario
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const userLatLng: L.LatLngExpression = [userLocation.latitud, userLocation.longitud];

      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="user-pulse-ring"></div>
          <div class="user-dot" title="Tu posición GPS"></div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(
            `<div class="p-1 font-sans">
              <span class="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">📍 Tu Posición Actual</span>
              <span class="text-xs font-semibold text-slate-800">Coordenadas GPS confirmadas</span>
              <div class="text-[11px] font-mono text-slate-500 mt-0.5">${userLocation.latitud.toFixed(5)}, ${userLocation.longitud.toFixed(5)}</div>
            </div>`
          );
      } else {
        userMarkerRef.current.setLatLng(userLatLng);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Actualizar marcadores modernos de las unidades médicas
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const unidadesConCoordenadas = unidades.filter(
      (u): u is UnidadMedica & { latitud: number; longitud: number } =>
        u.latitud !== null && u.longitud !== null
    );

    unidadesConCoordenadas.forEach((unidad) => {
      const latLng: L.LatLngExpression = [unidad.latitud, unidad.longitud];
      const isSelected = selectedUnit?.clues === unidad.clues;
      const theme = INSTITUTION_COLORS[unidad.institucion] || INSTITUTION_COLORS.OTRO;

      const markerHtml = `
        <div class="medical-unit-marker relative flex items-center justify-center cursor-pointer">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform"
               style="background: linear-gradient(135deg, ${theme.bg}, ${theme.border}); border: 2.5px solid ${isSelected ? '#F59E0B' : '#FFFFFF'}; box-shadow: 0 8px 16px ${isSelected ? 'rgba(245, 158, 11, 0.4)' : theme.glow};">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6v12m-6-6h12"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 w-2.5 h-2.5 rotate-45" style="background: ${theme.border};"></div>
          ${isSelected ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-xs"></div>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-medical-icon',
        html: markerHtml,
        iconSize: [36, 40],
        iconAnchor: [18, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupContent = `
        <div class="p-2 max-w-[280px] font-sans">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              ${unidad.institucion} · ${unidad.nivel_atencion}
            </span>
            ${unidad.distanciaFormateada ? `<span class="text-[11px] font-bold font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">⚡ ${unidad.distanciaFormateada}</span>` : ''}
          </div>
          <h4 class="font-display font-bold text-sm text-slate-900 leading-snug mb-1">
            ${unidad.nombre_unidad}
          </h4>
          <p class="text-xs text-slate-600 mb-2 line-clamp-2">
            ${unidad.direccion}, ${unidad.municipio}
          </p>
          <div class="flex items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-100 pt-1.5 mb-2.5">
            <span>CLUES: <strong class="text-slate-800">${unidad.clues}</strong></span>
          </div>
          <div class="flex gap-2">
            <button id="btn-popup-ver-${unidad.clues}" class="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-[#13322B] text-white rounded-lg hover:bg-[#0C231E] transition-all text-center cursor-pointer shadow-xs">
              Ver ficha completa
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${unidad.latitud},${unidad.longitud}" target="_blank" rel="noreferrer" class="py-1.5 px-2.5 text-xs font-semibold border border-slate-200 bg-slate-50 rounded-lg text-slate-700 hover:bg-slate-100 transition-all text-center">
              Cómo llegar
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-ver-${unidad.clues}`);
        if (btn) {
          btn.onclick = () => {
            onSelectUnit(unidad);
          };
        }
      });

      marker.on('click', () => {
        onSelectUnit(unidad);
      });

      marker.addTo(markersGroup);
    });
  }, [unidades, selectedUnit, onSelectUnit]);

  // Centrado suave cuando se selecciona una unidad
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedUnit || selectedUnit.latitud === null || selectedUnit.longitud === null) return;

    map.flyTo([selectedUnit.latitud, selectedUnit.longitud], 15, {
      duration: 1.2
    });
  }, [selectedUnit]);

  // Ajustar vista general de resultados
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords = unidades
      .filter((u): u is UnidadMedica & { latitud: number; longitud: number } => u.latitud !== null && u.longitud !== null)
      .map((u) => [u.latitud, u.longitud] as [number, number]);

    if (userLocation) {
      coords.push([userLocation.latitud, userLocation.longitud]);
    }

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([23.6345, -102.5528], 5);
    }
  };

  const handleCenterUser = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      map.flyTo([userLocation.latitud, userLocation.longitud], 14, { duration: 1.2 });
    } else {
      onLocateUser();
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Contenedor Leaflet */}
      <div ref={mapElementRef} className="w-full h-full z-10" />

      {/* Floating Glass Dock de Controles Figma en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            title="Acercar mapa"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer font-bold text-lg"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Alejar mapa"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer font-bold text-lg"
          >
            −
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col gap-1">
          <button
            onClick={handleCenterUser}
            disabled={isLocating}
            title="Centrar en mi posición GPS"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#13322B] hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleFitAll}
            title="Encuadrar todos los resultados"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#13322B] hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            title="Ver leyenda institucional"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              showLegend
                ? 'bg-[#13322B] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#13322B] hover:bg-emerald-50'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leyenda flotante tipo Figma */}
      {showLegend && (
        <div className="absolute top-44 right-4 z-20 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-display font-bold text-slate-900 mb-2.5 pb-2 border-b border-slate-100">
            <span>Marcadores Institucionales</span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-normal"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-[#13322B] shadow-2xs"></span>
              <span className="text-slate-700">IMSS (Seguro Social)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-[#1E3A8A] shadow-2xs"></span>
              <span className="text-slate-700">ISSSTE</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-[#9D2449] shadow-2xs"></span>
              <span className="text-slate-700">SSA / IMSS-BIENESTAR</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-[#C2410C] shadow-2xs"></span>
              <span className="text-slate-700">PEMEX</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-[#3F6212] shadow-2xs"></span>
              <span className="text-slate-700">SEDENA (Militar)</span>
            </div>
            <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-200"></span>
              <span className="text-slate-800 font-semibold">Tu ubicación GPS actual</span>
            </div>
          </div>
        </div>
      )}

      {/* Pill inferior informativo sobre registros catastrales */}
      {unidades.some((u) => u.latitud === null || u.longitud === null) && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-950 shadow-lg flex items-center gap-2.5 max-w-sm">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div>
            <span className="font-bold block">Padrón DGIS:</span>
            <span className="text-slate-600">Algunas unidades con dirección oficial están pendientes de georreferenciación satelital y se listan en texto.</span>
          </div>
        </div>
      )}
    </div>
  );
};
