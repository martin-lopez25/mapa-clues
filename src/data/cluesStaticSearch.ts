import type { MapSearchLocation, UnidadMedica, UserCoordinates } from '../types.ts';
import { calcularDistanciaHaversineKm, formatearDistancia } from './unidadesMedicas.ts';

export interface CluesSearchResult {
  unidades: UnidadMedica[];
  origen: MapSearchLocation | null;
}

type PhotonResponse = {
  features?: Array<{
    geometry?: { coordinates?: unknown };
    properties?: Record<string, unknown>;
  }>;
};

const MAX_RESULTS = 10;
const PLACE_RADIUS_KM = 30;
const SEARCH_INDEX_URL = `${import.meta.env.BASE_URL}data/clues-search-index.json`;
let catalogPromise: Promise<UnidadMedica[]> | null = null;
let photonQueue: Promise<void> = Promise.resolve();
let lastPhotonRequestAt = 0;
const placeCache = new Map<string, MapSearchLocation | null>();

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function loadCatalog(): Promise<UnidadMedica[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(SEARCH_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el índice CLUES (${response.status}).`);
        return response.json() as Promise<UnidadMedica[]>;
      })
      .catch((error: unknown) => {
        catalogPromise = null;
        throw error;
      });
  }
  return catalogPromise;
}

function unitSearchText(unit: UnidadMedica): string {
  return normalize([
    unit.clues,
    unit.nombre_unidad,
    unit.nombre_comercial ?? '',
    unit.tipo_unidad,
    unit.direccion,
    unit.codigo_postal,
    unit.localidad,
    unit.municipio,
    unit.entidad
  ].join(' '));
}

async function geocodePlace(query: string): Promise<MapSearchLocation | null> {
  const key = normalize(query);
  if (placeCache.has(key)) return placeCache.get(key) ?? null;

  const request = photonQueue.then(async () => {
    const cached = placeCache.get(key);
    if (cached !== undefined) return cached;

    const waitMs = Math.max(0, 1000 - (Date.now() - lastPhotonRequestAt));
    if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    lastPhotonRequestAt = Date.now();

    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '5');
    url.searchParams.set('lang', 'default');
    const response = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!response.ok) throw new Error(`Photon respondió ${response.status}.`);
    const data = await response.json() as PhotonResponse;
    const feature = data.features?.find((item) =>
      String(item.properties?.countrycode ?? '').toLowerCase() === 'mx'
    ) ?? data.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    if (!feature || !Array.isArray(coordinates) || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      placeCache.set(key, null);
      return null;
    }

    const properties = feature.properties ?? {};
    const name = [
      properties.name,
      [properties.housenumber, properties.street].filter(Boolean).join(' '),
      properties.city ?? properties.district ?? properties.county,
      properties.state
    ].filter(Boolean).map(String).join(', ') || query;
    const result: MapSearchLocation = {
      nombre: name,
      longitud: coordinates[0],
      latitud: coordinates[1],
      radioKm: PLACE_RADIUS_KM
    };
    placeCache.set(key, result);
    return result;
  });

  photonQueue = request.then(() => undefined, () => undefined);
  return request;
}

export async function searchStaticClues(query: string): Promise<CluesSearchResult> {
  const normalizedQuery = normalize(query);
  const catalog = await loadCatalog();
  const exactMatches = catalog.filter((unit) => unitSearchText(unit).includes(normalizedQuery));
  const looksLikeClues = /^(?=.*\d)[a-z0-9-]{7,}$/i.test(query.replace(/\s/g, ''));

  if (exactMatches.length > 0 || looksLikeClues) {
    const units = exactMatches.length > 0
      ? exactMatches
      : catalog.filter((unit) => normalize(unit.clues).includes(normalizedQuery));
    return { unidades: units.slice(0, MAX_RESULTS), origen: null };
  }

  const origin = await geocodePlace(query);
  if (origin) {
    const nearby = catalog
      .filter((unit): unit is UnidadMedica & { latitud: number; longitud: number } =>
        unit.latitud !== null && unit.longitud !== null)
      .map((unit) => {
        const distanciaKm = calcularDistanciaHaversineKm(origin.latitud, origin.longitud, unit.latitud, unit.longitud);
        return {
          ...unit,
          distanciaKm: Number(distanciaKm.toFixed(2)),
          distanciaFormateada: formatearDistancia(distanciaKm)
        };
      })
      .filter((unit) => unit.distanciaKm <= PLACE_RADIUS_KM)
      .sort((first, second) => first.distanciaKm - second.distanciaKm);
    return { unidades: nearby.slice(0, MAX_RESULTS), origen: origin };
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const units = catalog.filter((unit) => {
    const text = unitSearchText(unit);
    return tokens.every((token) => text.includes(token));
  });
  return { unidades: units.slice(0, MAX_RESULTS), origen: null };
}

export async function findStaticCluesNear(
  location: UserCoordinates,
  limit = 30
): Promise<UnidadMedica[]> {
  const catalog = await loadCatalog();
  return catalog
    .filter((unit): unit is UnidadMedica & { latitud: number; longitud: number } =>
      unit.latitud !== null && unit.longitud !== null)
    .map((unit) => {
      const distanciaKm = calcularDistanciaHaversineKm(location.latitud, location.longitud, unit.latitud, unit.longitud);
      return {
        ...unit,
        distanciaKm: Number(distanciaKm.toFixed(2)),
        distanciaFormateada: formatearDistancia(distanciaKm)
      };
    })
    .sort((first, second) => first.distanciaKm - second.distanciaKm)
    .slice(0, limit);
}