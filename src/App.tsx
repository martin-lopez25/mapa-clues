import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Map3DContainer } from './components/Map3DContainer.tsx';
import { SearchSuggestions } from './components/SearchSuggestions.tsx';
import { UnitDetailModal } from './components/UnitDetailModal.tsx';
import { MapSearchLocation, UnidadMedica, UserCoordinates, GpsStatus } from './types.ts';
import { calcularDistanciaHaversineKm, formatearDistancia } from './data/unidadesMedicas.ts';
import { findStaticCluesNear, searchStaticClues } from './data/cluesStaticSearch.ts';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const [unidades, setUnidades] = useState<UnidadMedica[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnidadMedica | null>(null);
  const [detailModalUnit, setDetailModalUnit] = useState<UnidadMedica | null>(null);
  const [searchLocation, setSearchLocation] = useState<MapSearchLocation | null>(null);

  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [isLocating, setIsLocating] = useState(false);

  const [activeTab, setActiveTab] = useState<'todos' | 'cercanas'>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [globeIntroComplete, setGlobeIntroComplete] = useState(false);

  const handleSelectUnit = useCallback((unidad: UnidadMedica) => {
    setSelectedUnit(unidad);
  }, []);

  const handleOpenUnitDetails = useCallback((unidad: UnidadMedica) => {
    setSelectedUnit(unidad);
    setDetailModalUnit(unidad);
  }, []);

  const handleGlobeIntroComplete = useCallback(() => {
    setGlobeIntroComplete(true);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (!value.trim()) setSearchLocation(null);
  }, []);

  // Función principal para consultar unidades del backend
  const fetchUnidades = useCallback(async () => {
    if (activeTab === 'todos' && !searchTerm.trim()) {
      setUnidades([]);
      setSearchLocation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'cercanas' && userLocation) {
        const params = new URLSearchParams({
          latitud: userLocation.latitud.toString(),
          longitud: userLocation.longitud.toString(),
          limite: '30'
        });
        let list: UnidadMedica[];
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}api/unidades/cercanas?${params.toString()}`);
          if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
            throw new Error('La API de proximidad no está disponible.');
          }
          const data = await res.json();
          list = data.unidades || [];
        } catch {
          list = await findStaticCluesNear(userLocation, 30);
        }

        // Si hay búsqueda por texto adicional en modo cercanía, filtrar
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          list = list.filter(
            (u: UnidadMedica) =>
              u.clues.toLowerCase().includes(q) ||
              u.nombre_unidad.toLowerCase().includes(q) ||
              u.direccion.toLowerCase().includes(q) ||
              u.municipio.toLowerCase().includes(q)
          );
        }

        setUnidades(list);
      } else {
        const params = new URLSearchParams({ buscar: searchTerm.trim(), limit: '10' });
        let data: { unidades: UnidadMedica[]; origen: MapSearchLocation | null };
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}api/clues/busqueda?${params.toString()}`);
          if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
            throw new Error('La API de búsqueda no está disponible.');
          }
          data = await res.json();
        } catch {
          data = await searchStaticClues(searchTerm.trim());
        }
        let list = data.unidades || [];
        setSearchLocation(data.origen ?? null);

        // Si el usuario tiene ubicación obtenida, adjuntarle distancia calculada
        if (userLocation) {
          list = list.map((u: UnidadMedica) => {
            if (u.latitud !== null && u.longitud !== null) {
              const dist = calcularDistanciaHaversineKm(
                userLocation.latitud,
                userLocation.longitud,
                u.latitud,
                u.longitud
              );
              return {
                ...u,
                distanciaKm: Number(dist.toFixed(2)),
                distanciaFormateada: formatearDistancia(dist)
              };
            }
            return u;
          });
        }

        setUnidades(list);
      }
    } catch (err) {
      console.error('Error obteniendo unidades:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, userLocation, searchTerm]);

  // Actualizar resultados al cambiar filtros o modo con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnidades();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchUnidades]);

  // Manejador de Geolocalización GPS del Usuario
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGpsStatus('no_disponible');
      return;
    }

    setIsLocating(true);
    setGpsStatus('solicitando');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: UserCoordinates = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precision: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setUserLocation(coords);
        setGpsStatus('obtenido');
        setIsLocating(false);
        setActiveTab('cercanas');
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denegado');
        } else if (error.code === error.TIMEOUT) {
          setGpsStatus('timeout');
        } else {
          setGpsStatus('no_disponible');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100">
      {/* 1. Header Institucional (Top Bar Contract) */}
      <Header
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasUserLocation={!!userLocation}
        startGlobeIntro={!globeIntroComplete}
        onGlobeIntroComplete={handleGlobeIntroComplete}
      />

      <main className="relative flex-1 overflow-hidden">
        {globeIntroComplete && <>
          <Map3DContainer
            unidades={unidades}
            selectedUnit={selectedUnit}
            onSelectUnit={handleOpenUnitDetails}
            onSelectMapUnit={handleSelectUnit}
            searchLocation={searchLocation}
            userLocation={userLocation}
            onLocateUser={handleLocateUser}
            isLocating={isLocating}
          />

          <div className="absolute left-4 right-4 top-4 z-30 sm:left-6 sm:right-auto sm:w-[min(420px,calc(100%-3rem))]">
            <SearchSuggestions
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              unidades={unidades}
              isLoading={isLoading}
              searchLocation={searchLocation}
              onSelectUnit={handleSelectUnit}
            />
          </div>
        </>}
      </main>

      {/* 3. Ficha Técnica / Modal de Detalle */}
      {detailModalUnit && (
        <UnitDetailModal
          unidad={detailModalUnit}
          onClose={() => setDetailModalUnit(null)}
          onLocateOnMap={(unidad) => {
            setSelectedUnit(unidad);
          }}
          userLocation={userLocation}
        />
      )}
    </div>
  );
}
