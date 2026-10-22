import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { MapSearchLocation, UnidadMedica, UserCoordinates } from '../types.ts';
import type { OsmSceneController, OsmSceneStatus } from './osmScene.ts';

maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { Navigation, Compass, Maximize2, Sparkles, Building2 } from 'lucide-react';

const NEON_MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const NORMAL_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function createClueMarkerImage(color: string): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return new ImageData(48, 48);

  context.beginPath();
  context.roundRect(9, 7, 30, 34, 8);
  context.fillStyle = '#07101f';
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.shadowColor = color;
  context.shadowBlur = 9;
  context.fill();
  context.stroke();
  context.shadowBlur = 0;

  context.beginPath();
  context.moveTo(24, 15);
  context.lineTo(24, 33);
  context.moveTo(15, 24);
  context.lineTo(33, 24);
  context.strokeStyle = '#ffffff';
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.stroke();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

interface Map3DContainerProps {
  unidades: UnidadMedica[];
  selectedUnit: UnidadMedica | null;
  onSelectUnit: (unidad: UnidadMedica) => void;
  onSelectMapUnit: (unidad: UnidadMedica) => void;
  searchLocation: MapSearchLocation | null;
  userLocation: UserCoordinates | null;
  onLocateUser: () => void;
  isLocating: boolean;
}

export const Map3DContainer: React.FC<Map3DContainerProps> = ({
  unidades,
  selectedUnit,
  onSelectUnit,
  onSelectMapUnit,
  searchLocation,
  userLocation,
  onLocateUser,
  isLocating
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const selectedUnitMarkerRef = useRef<maplibregl.Marker | null>(null);
  const osmSceneControllerRef = useRef<OsmSceneController | null>(null);
  const neonModeRef = useRef(false);
  const mapStyleSwitcherRef = useRef<((useNeonStyle: boolean) => void) | null>(null);
  const [mapStyleRevision, setMapStyleRevision] = useState(0);
  const [clueCounts, setClueCounts] = useState({ total: 0, primerNivel: 0, segundoNivel: 0, tercerNivel: 0, otros: 0 });
  const [osmSceneStatus, setOsmSceneStatus] = useState<OsmSceneStatus>({
    phase: 'overview',
    buildings: 0,
    roads: 0,
    estimated: 0
  });

  // Estados de visualización y cámara 3D
  const [is3DMode, setIs3DMode] = useState(true);
  const [isNeonMode, setIsNeonMode] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(68);
  const [currentBearing, setCurrentBearing] = useState(-20);
  const [currentZoom, setCurrentZoom] = useState(5.4);

  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/clues/resumen`);
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('El endpoint API no está disponible.');
        }
        if (active) setClueCounts(await response.json());
      } catch {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/clues-summary.json`);
          if (!response.ok) throw new Error(`No se pudo cargar el resumen estático: ${response.status}`);
          if (active) setClueCounts(await response.json());
        } catch (error) {
          console.error('Error cargando conteos CLUES:', error);
        }
      }
    };

    void loadCounts();
    return () => {
      active = false;
    };
  }, []);

  // 1. Inicialización de MapLibre con estilo vectorial tecnológico oscuro
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: NORMAL_MAP_STYLE,
      center: [-102.5528, 23.6345],
      zoom: 5.4,
      pitch: 68,
      bearing: -20,
      maxPitch: 68
    });

    map.on('move', () => {
      setCurrentPitch(Math.round(map.getPitch()));
      setCurrentBearing(Math.round(map.getBearing()));
      setCurrentZoom(Number(map.getZoom().toFixed(1)));
    });

    let osmSceneController: OsmSceneController | null = null;
    let mapDisposed = false;
    let appliedNeonStyle = false;
    let sceneGeneration = 0;
    const addCluePointLayers = () => {
      const groups = [
        { id: 'primer-nivel', file: 'primer_nivel', color: '#37e08e', offset: [-10, 0] as [number, number] },
        { id: 'segundo-nivel', file: 'segundo_nivel', color: '#ff4655', offset: [0, -10] as [number, number] },
        { id: 'tercer-nivel', file: 'tercer_nivel', color: '#3b82f6', offset: [10, 0] as [number, number] },
        { id: 'otros', file: 'no_aplica', color: '#9ca3af', offset: [0, 10] as [number, number] }
      ];
      const levelNames: Record<string, UnidadMedica['nivel_atencion']> = {
        'PRIMER NIVEL': 'Primer Nivel',
        'SEGUNDO NIVEL': 'Segundo Nivel',
        'TERCER NIVEL': 'Tercer Nivel',
        'NO APLICA': 'NO APLICA'
      };

      groups.forEach(({ id, file, color, offset }) => {
        const sourceId = `clues-${id}-source`;
        const clusterLayerId = `clues-${id}-clusters`;
        const clusterCountLayerId = `clues-${id}-cluster-count`;
        const markerImageId = `clues-${id}-cross-box`;
        const pointLayerId = `clues-${id}-points`;
        if (map.getSource(sourceId)) return;

        map.addSource(sourceId, {
          type: 'geojson',
          data: `${import.meta.env.BASE_URL}data/clues_json_por_nivel/clues_${file}.json`,
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 42
        });

        map.addImage(markerImageId, createClueMarkerImage(color), { pixelRatio: 2 });
        map.addLayer({
          id: clusterLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'icon-image': markerImageId,
            'icon-size': ['step', ['get', 'point_count'], 0.62, 100, 0.76, 750, 0.9],
            'icon-anchor': 'center',
            'icon-offset': offset,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });

        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Noto Sans Bold'],
            'text-size': ['step', ['get', 'point_count'], 9, 100, 10, 750, 11],
            'text-offset': [0, 0.1],
            'text-ignore-placement': true
          },
          paint: { 'text-color': '#ffffff', 'text-halo-color': '#07101f', 'text-halo-width': 1 }
        });

        map.addLayer({
          id: pointLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': markerImageId,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.3, 14, 0.55, 17, 0.78],
            'icon-anchor': 'center',
            'icon-offset': offset,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });

        map.on('click', clusterLayerId, (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== 'Point') return;
          const clusterId = Number(feature.properties?.cluster_id);
          const coordinates = feature.geometry.coordinates as [number, number];
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({ center: coordinates, zoom });
          });
        });

        map.on('click', pointLayerId, (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== 'Point') return;
          const properties = feature.properties ?? {};
          const [longitude, latitude] = feature.geometry.coordinates as [number, number];
          const level = String(properties.nivel_atencion ?? '').toUpperCase();
          onSelectMapUnit({
            clues: String(properties.clues_imb ?? ''),
            nombre_unidad: String(properties.nombre_de_la_unidad ?? ''),
            tipo_unidad: String(properties.nombre_de_tipologia ?? 'Unidad médica'),
            institucion: 'OTRO',
            nivel_atencion: levelNames[level] ?? 'NO APLICA',
            direccion: String(properties.localidad ?? ''),
            localidad: String(properties.localidad ?? ''),
            municipio: String(properties.municipio ?? ''),
            entidad: String(properties.entidad ?? ''),
            codigo_postal: '',
            latitud: latitude,
            longitud: longitude,
            estatus_operacion: String(properties.estatus_de_operacion ?? '')
          });
        });
        map.on('mouseenter', clusterLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', clusterLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', pointLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', pointLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });
    };

    const initializeLayers = () => {
      if (!map.getLayer('building-3d')) {
        map.addLayer({
          id: 'building-3d',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': neonModeRef.current ? '#10182f' : '#8a969b',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
            'fill-extrusion-opacity': neonModeRef.current ? 0.48 : 0.78
          }
        });
      }

      addCluePointLayers();
      const generation = ++sceneGeneration;
      void import('./osmScene.ts')
        .then(({ attachOsmScene }) => {
          if (!mapDisposed && generation === sceneGeneration) {
            osmSceneController = attachOsmScene(map, setOsmSceneStatus, neonModeRef.current);
            osmSceneControllerRef.current = osmSceneController;
            osmSceneController.setNeonVisible(neonModeRef.current);
          }
        })
        .catch((error: unknown) => {
          console.error('No se pudo cargar la escena 3D:', error);
          if (!mapDisposed) {
            setOsmSceneStatus({
              phase: 'error',
              buildings: 0,
              roads: 0,
              estimated: 0,
              message: 'No se pudo cargar la escena 3D.'
            });
          }
        });
    };

    const applyMapStyle = (useNeonStyle: boolean) => {
      neonModeRef.current = useNeonStyle;
      if (mapDisposed || !map.isStyleLoaded() || appliedNeonStyle === useNeonStyle) return;

      const currentCenter = map.getCenter();
      const needsUrbanZoom = useNeonStyle && map.getZoom() < 15;
      const view = {
        center: needsUrbanZoom && map.getZoom() < 8
          ? maplibregl.LngLat.convert([-99.1517, 19.4128])
          : currentCenter,
        zoom: needsUrbanZoom ? 15.2 : map.getZoom(),
        pitch: useNeonStyle ? (is3DMode ? 68 : map.getPitch()) : map.getPitch(),
        bearing: useNeonStyle ? (is3DMode ? -20 : map.getBearing()) : map.getBearing()
      };
      osmSceneController?.dispose();
      osmSceneController = null;
      osmSceneControllerRef.current = null;
      sceneGeneration++;
      setOsmSceneStatus({ phase: 'overview', buildings: 0, roads: 0, estimated: 0 });
      appliedNeonStyle = useNeonStyle;

      map.once('style.load', () => {
        if (mapDisposed) return;
        map.jumpTo(view);
        initializeLayers();
        setMapStyleRevision((revision) => revision + 1);
      });
      map.setStyle(useNeonStyle ? NEON_MAP_STYLE : NORMAL_MAP_STYLE, { diff: false });
    };
    mapStyleSwitcherRef.current = applyMapStyle;

    map.once('load', initializeLayers);

    mapRef.current = map;

    return () => {
      mapDisposed = true;
      sceneGeneration++;
      osmSceneController?.dispose();
      osmSceneControllerRef.current = null;
      mapStyleSwitcherRef.current = null;
      map.off('load', initializeLayers);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectedUnitMarkerRef.current?.remove();
    selectedUnitMarkerRef.current = null;
    const map = mapRef.current;
    if (!map || !selectedUnit || selectedUnit.latitud === null || selectedUnit.longitud === null) return;

    const levelColors: Record<string, string> = {
      'PRIMER NIVEL': '#37e08e',
      'SEGUNDO NIVEL': '#ff4655',
      'TERCER NIVEL': '#3b82f6',
      'NO APLICA': '#9ca3af'
    };
    const markerColor = levelColors[selectedUnit.nivel_atencion.toUpperCase()] ?? '#9ca3af';
    const markerElement = document.createElement('div');
    markerElement.className = 'selected-unit-marker';
    markerElement.style.setProperty('--selected-marker-color', markerColor);
    markerElement.innerHTML = `
      <span class="selected-unit-marker__pulse"></span>
      <span class="selected-unit-marker__pin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M12 6v12m-6-6h12" />
        </svg>
      </span>
    `;

    const popupContent = document.createElement('div');
    popupContent.className = 'unit-map-popup';
    const level = document.createElement('span');
    level.className = 'unit-map-popup__level';
    level.textContent = selectedUnit.nivel_atencion;
    const name = document.createElement('strong');
    name.className = 'unit-map-popup__name';
    name.textContent = selectedUnit.nombre_unidad;
    const clues = document.createElement('span');
    clues.className = 'unit-map-popup__clues';
    clues.textContent = `CLUES ${selectedUnit.clues}`;
    const openDetails = document.createElement('button');
    openDetails.className = 'unit-map-popup__action';
    openDetails.textContent = 'Abrir ficha';
    openDetails.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelectUnit(selectedUnit);
    });
    popupContent.append(level, name, clues, openDetails);

    const marker = new maplibregl.Marker({ element: markerElement, anchor: 'bottom' })
      .setLngLat([selectedUnit.longitud, selectedUnit.latitud])
      .setPopup(new maplibregl.Popup({ offset: 24, closeButton: false, className: 'unit-map-popup-container' }).setDOMContent(popupContent))
      .addTo(map);
    selectedUnitMarkerRef.current = marker;
    marker.togglePopup();
  }, [selectedUnit, onSelectUnit, mapStyleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchLocation) return;

    map.flyTo({
      center: [searchLocation.longitud, searchLocation.latitud],
      zoom: 15.2,
      pitch: is3DMode ? 68 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 1300,
      essential: true
    });
  }, [searchLocation, is3DMode, mapStyleRevision]);

  // 7. Marcador 3D del Usuario (Baliza satelital GPS con onda radar)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-beacon-3d';
      el.innerHTML = `
        <div class="user-beacon-pulse"></div>
        <div class="user-beacon-core" title="Tu posición actual"></div>
      `;

      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.longitud, userLocation.latitud])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.longitud, userLocation.latitud]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // 9. Centrado suave y elevación de cámara al seleccionar una unidad
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedUnit || selectedUnit.latitud === null || selectedUnit.longitud === null) return;

    map.flyTo({
      center: [selectedUnit.longitud, selectedUnit.latitud],
      zoom: 16.5,
      pitch: is3DMode ? 68 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 1600,
      essential: true
    });
  }, [selectedUnit, is3DMode, mapStyleRevision]);

  // Conmutador de modo 3D / 2D
  const toggle3DMode = () => {
    const map = mapRef.current;
    if (!map) return;

    if (is3DMode) {
      // Pasar a vista superior 2D
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 900
      });
      setIs3DMode(false);
    } else {
      // Pasar a perspectiva tridimensional
      map.easeTo({
        pitch: 68,
        bearing: -18,
        duration: 900
      });
      setIs3DMode(true);
    }
  };

  // Ciclo de inclinación de cámara
  const cycleTilt = () => {
    const map = mapRef.current;
    if (!map) return;

    const nextPitch = currentPitch === 68 ? 0 : 68;
    map.easeTo({ pitch: nextPitch, duration: 600 });
    setIs3DMode(nextPitch === 68);
  };

  // Restablecer brújula hacia el norte
  const resetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 500 });
  };

  // Encuadrar todos los resultados
  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;

    const coords = unidades
      .filter((u): u is UnidadMedica & { latitud: number; longitud: number } => u.latitud !== null && u.longitud !== null)
      .map((u) => [u.longitud, u.latitud] as [number, number]);

    if (userLocation) {
      coords.push([userLocation.longitud, userLocation.latitud]);
    }

    if (coords.length > 0) {
      const bounds = coords.reduce(
        (b, coord) => b.extend(coord),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1200 });
    } else {
      map.flyTo({ center: [-102.5528, 23.6345], zoom: 5.4, pitch: is3DMode ? 68 : 0, bearing: -20, duration: 1000 });
    }
  };

  // Centrar en ubicación del usuario
  const handleCenterUser = () => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation) {
      map.flyTo({
        center: [userLocation.longitud, userLocation.latitud],
        zoom: 15.5,
        pitch: is3DMode ? 68 : 0,
        bearing: -15,
        duration: 1400
      });
    } else {
      onLocateUser();
    }
  };

  const toggleNeonMode = () => {
    const nextMode = !neonModeRef.current;
    neonModeRef.current = nextMode;
    setIsNeonMode(nextMode);
    mapStyleSwitcherRef.current?.(nextMode);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#081715] overflow-hidden select-none">
      {/* Contenedor MapLibre GL */}
      <div ref={mapContainerRef} data-map-zoom={currentZoom} className="w-full h-full z-10" />

      {(osmSceneStatus.phase === 'loading' || osmSceneStatus.phase === 'error') && (
        <div className="absolute left-4 top-20 z-20 flex items-center gap-2 rounded-md border border-cyan-900/60 bg-[#07101f]/90 px-3 py-2 text-[10px] font-semibold text-stone-200 shadow-lg">
          <span className={`h-1.5 w-1.5 rounded-full ${osmSceneStatus.phase === 'loading' ? 'animate-pulse bg-cyan-300' : 'bg-rose-400'}`} />
          {osmSceneStatus.phase === 'loading' ? 'Generando escena urbana...' : osmSceneStatus.message}
        </div>
      )}

      {/* Floating Glass Dock de Controles 3D (Minimalista & Futurista) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Conmutador 3D / 2D de alta prioridad */}
        <div className="bg-[#0B1D1A]/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-emerald-950/60 flex flex-col gap-1.5">
          <button
            onClick={toggle3DMode}
            title={is3DMode ? 'Cambiar a vista 2D superior' : 'Cambiar a vista 3D perspectiva'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs transition-all cursor-pointer ${
              is3DMode
                ? 'bg-gradient-to-br from-[#13322B] to-[#1C433A] text-[#34D399] border border-[#34D399]/40 shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {is3DMode ? '3D' : '2D'}
          </button>

          <button
            onClick={toggleNeonMode}
            title={isNeonMode ? 'Cambiar a 3D normal' : 'Cambiar a 3D neón'}
            aria-label={isNeonMode ? 'Cambiar a 3D normal' : 'Cambiar a 3D neón'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isNeonMode
                ? 'bg-[#10182f] text-cyan-300 border border-cyan-400/45 shadow-[0_0_12px_rgba(56,217,255,0.22)]'
                : 'bg-[#10182f] text-stone-300 border border-white/10 hover:text-white'
            }`}
          >
            {isNeonMode ? <Sparkles className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
          </button>

        </div>

        {/* Dock de navegación y cámara */}
        <div className="bg-[#0B1D1A]/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-emerald-950/60 flex flex-col gap-1.5">
          <button
            onClick={handleCenterUser}
            disabled={isLocating}
            title="Centrar en mi ubicación GPS"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-[#34D399] hover:bg-white/10 transition-all cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={cycleTilt}
            title={`Inclinación: ${currentPitch}° (Clic para alternar)`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-xs font-mono font-bold"
          >
            {currentPitch}°
          </button>

          <button
            onClick={resetNorth}
            title="Orientar mapa al norte"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Compass
              className="w-4 h-4 transition-transform duration-300"
              style={{ transform: `rotate(${-currentBearing}deg)` }}
            />
          </button>

          <button
            onClick={handleFitAll}
            title="Encuadrar todas las unidades"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 grid grid-cols-2 gap-1.5 rounded-lg border border-cyan-900/50 bg-[#07101f]/90 p-2 shadow-xl backdrop-blur-md sm:flex sm:gap-3">
        {[
          { label: 'Total CLUES', count: clueCounts.total, color: '#38d9ff' },
          { label: 'Primer nivel', count: clueCounts.primerNivel, color: '#64FF9B' },
          { label: 'Segundo nivel', count: clueCounts.segundoNivel, color: '#FFD34E' },
          { label: 'Tercer nivel', count: clueCounts.tercerNivel, color: '#FF38CF' },
          { label: 'Otros', count: clueCounts.otros, color: '#9CA3AF' }
        ].map(({ label, count, color }) => (
          <div key={label} className="flex min-w-[112px] items-center gap-2 px-2 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]" style={{ color, backgroundColor: color }} />
            <span className="text-[10px] uppercase text-stone-300">{label}</span>
            <strong className="ml-auto text-xs font-mono text-white">{count.toLocaleString('es-MX')}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};
