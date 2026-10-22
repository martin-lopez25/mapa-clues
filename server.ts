import express, { Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UNIDADES_MEDICAS_DATA,
  calcularDistanciaHaversineKm,
  formatearDistancia,
  UnidadMedica
} from './src/data/unidadesMedicas.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLUES_GEOJSON_FILES = [
  'clues_primer_nivel.json',
  'clues_segundo_nivel.json',
  'clues_tercer_nivel.json',
  'clues_no_aplica.json'
];

type CluesGeoJsonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, unknown>;
};

type GeocodedPlace = {
  nombre: string;
  latitud: number;
  longitud: number;
};

type PhotonResponse = {
  features?: Array<{
    geometry?: { coordinates?: unknown };
    properties?: Record<string, unknown>;
  }>;
};

let cluesCatalogPromise: Promise<UnidadMedica[]> | null = null;
const geocodeCache = new Map<string, GeocodedPlace | null>();
let geocodeQueue: Promise<void> = Promise.resolve();
let lastGeocodeRequestAt = 0;

const normalizeSearchText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function loadCluesCatalog(): Promise<UnidadMedica[]> {
  if (!cluesCatalogPromise) {
    cluesCatalogPromise = Promise.all(
      CLUES_GEOJSON_FILES.map(async (fileName) => {
        const filePath = path.resolve(__dirname, 'public', 'data', 'clues_json_por_nivel', fileName);
        const contents = await readFile(filePath, 'utf-8');
        return (JSON.parse(contents) as { features: CluesGeoJsonFeature[] }).features;
      })
    ).then((collections) => collections.flat().map((feature): UnidadMedica => {
      const properties = feature.properties;
      const level = String(properties.nivel_atencion ?? '').toUpperCase();
      const levelNames: Record<string, UnidadMedica['nivel_atencion']> = {
        'PRIMER NIVEL': 'Primer Nivel',
        'SEGUNDO NIVEL': 'Segundo Nivel',
        'TERCER NIVEL': 'Tercer Nivel',
        'NO APLICA': 'NO APLICA'
      };

      return {
        clues: String(properties.clues_imb ?? ''),
        nombre_unidad: String(properties.nombre_de_la_unidad ?? ''),
        nombre_comercial: String(properties.nombre_comercial ?? ''),
        tipo_unidad: String(properties.nombre_de_tipologia ?? 'Unidad médica'),
        institucion: 'OTRO',
        nivel_atencion: levelNames[level] ?? 'NO APLICA',
        direccion: String(properties.direccion ?? properties.domicilio ?? properties.localidad ?? ''),
        localidad: String(properties.localidad ?? ''),
        municipio: String(properties.municipio ?? ''),
        entidad: String(properties.entidad ?? ''),
        codigo_postal: String(properties.codigo_postal ?? properties.cp ?? ''),
        latitud: feature.geometry.coordinates[1],
        longitud: feature.geometry.coordinates[0],
        estatus_operacion: String(properties.estatus_de_operacion ?? '')
      };
    }));
  }

  return cluesCatalogPromise;
}

function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  const key = normalizeSearchText(query);
  if (geocodeCache.has(key)) return Promise.resolve(geocodeCache.get(key) ?? null);

  const request = geocodeQueue.then(async () => {
    if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
    const waitMs = Math.max(0, 1000 - (Date.now() - lastGeocodeRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGeocodeRequestAt = Date.now();

    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '5');
    url.searchParams.set('lang', 'default');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GeoSaludCLUES/1.0', 'Accept-Language': 'es' }
    });
    if (!response.ok) throw new Error(`Photon respondió ${response.status}`);

    const data = await response.json() as PhotonResponse;
    const feature = data.features?.find((candidate) =>
      String(candidate.properties?.countrycode ?? '').toLowerCase() === 'mx'
    ) ?? data.features?.[0];
    if (!feature) {
      geocodeCache.set(key, null);
      return null;
    }
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      geocodeCache.set(key, null);
      return null;
    }

    const properties = feature.properties ?? {};
    const street = [properties.housenumber, properties.street].filter(Boolean).join(' ');
    const name = [
      properties.name,
      street,
      properties.city ?? properties.district ?? properties.county,
      properties.state
    ].filter(Boolean).map(String).join(', ');
    const result = {
      nombre: name || query,
      longitud: coordinates[0],
      latitud: coordinates[1]
    };
    geocodeCache.set(key, result);
    if (geocodeCache.size > 1500) {
      const oldestKey = geocodeCache.keys().next().value;
      if (oldestKey) geocodeCache.delete(oldestKey);
    }
    return result;
  });

  geocodeQueue = request.then(() => undefined, () => undefined);
  return request;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ==========================================
  // API REST: Endpoints de Unidades Médicas
  // (Mismo contrato que el backend Java Spring Boot)
  // ==========================================

  // 1. GET /api/unidades?buscar=&institucion=&tipo=&entidad=&municipio=&page=&limit=
  app.get('/api/unidades', (req: Request, res: Response) => {
    try {
      const { buscar, institucion, tipo, entidad, municipio, conCoordenadasSolo } = req.query;
      let resultados = [...UNIDADES_MEDICAS_DATA];

      // Búsqueda inteligente tolerante a minúsculas y acentos
      if (typeof buscar === 'string' && buscar.trim().length > 0) {
        const queryTerm = buscar.trim().toLowerCase();
        resultados = resultados.filter((u) => {
          const matchClues = u.clues.toLowerCase().includes(queryTerm);
          const matchNombre = u.nombre_unidad.toLowerCase().includes(queryTerm);
          const matchDireccion = u.direccion.toLowerCase().includes(queryTerm);
          const matchMunicipio = u.municipio.toLowerCase().includes(queryTerm);
          const matchLocalidad = u.localidad.toLowerCase().includes(queryTerm);
          const matchCp = u.codigo_postal.toLowerCase().includes(queryTerm);
          const matchEntidad = u.entidad.toLowerCase().includes(queryTerm);

          return (
            matchClues ||
            matchNombre ||
            matchDireccion ||
            matchMunicipio ||
            matchLocalidad ||
            matchCp ||
            matchEntidad
          );
        });
      }

      // Filtros estructurados
      if (typeof institucion === 'string' && institucion && institucion !== 'TODAS') {
        resultados = resultados.filter(
          (u) => u.institucion.toLowerCase() === institucion.toLowerCase()
        );
      }

      if (typeof tipo === 'string' && tipo && tipo !== 'TODOS') {
        resultados = resultados.filter(
          (u) => u.tipo_unidad.toLowerCase() === tipo.toLowerCase()
        );
      }

      if (typeof entidad === 'string' && entidad && entidad !== 'TODAS') {
        resultados = resultados.filter(
          (u) => u.entidad.toLowerCase() === entidad.toLowerCase()
        );
      }

      if (typeof municipio === 'string' && municipio && municipio !== 'TODOS') {
        resultados = resultados.filter(
          (u) => u.municipio.toLowerCase() === municipio.toLowerCase()
        );
      }

      if (conCoordenadasSolo === 'true') {
        resultados = resultados.filter((u) => u.latitud !== null && u.longitud !== null);
      }

      res.json({
        total: resultados.length,
        unidades: resultados
      });
    } catch (error) {
      console.error('Error al consultar unidades:', error);
      res.status(500).json({ error: 'Error interno del servidor al consultar unidades médicas.' });
    }
  });

  app.get('/api/clues/resumen', async (_req: Request, res: Response) => {
    try {
      const resumen = { primerNivel: 0, segundoNivel: 0, tercerNivel: 0, otros: 0 };
      const catalogo = await loadCluesCatalog();

      for (const unidad of catalogo) {
        switch (unidad.nivel_atencion) {
          case 'Primer Nivel':
            resumen.primerNivel++;
            break;
          case 'Segundo Nivel':
            resumen.segundoNivel++;
            break;
          case 'Tercer Nivel':
            resumen.tercerNivel++;
            break;
          default:
            resumen.otros++;
        }
      }

      res.json({ total: catalogo.length, ...resumen });
    } catch (error) {
      console.error('Error calculando resumen de CLUES:', error);
      res.status(500).json({ error: 'No se pudo consultar el resumen del catálogo CLUES.' });
    }
  });

  app.get('/api/clues', async (req: Request, res: Response) => {
    const query = typeof req.query.buscar === 'string' ? normalizeSearchText(req.query.buscar.trim()) : '';
    if (!query) {
      res.status(400).json({ error: 'Ingrese una CLUES o nombre para buscar.' });
      return;
    }

    try {
      const catalogo = await loadCluesCatalog();
      const searchableText = (unidad: UnidadMedica) => normalizeSearchText([
        unidad.clues,
        unidad.nombre_unidad,
        unidad.nombre_comercial ?? '',
        unidad.tipo_unidad,
        unidad.direccion,
        unidad.codigo_postal,
        unidad.localidad,
        unidad.municipio,
        unidad.entidad
      ].join(' '));
      const queryTokens = query.split(/\s+/).filter(Boolean);
      const knownTokens = queryTokens.filter((token) =>
        catalogo.some((unidad) => searchableText(unidad).includes(token))
      );
      const tokensToMatch = knownTokens.length > 0 ? knownTokens : queryTokens;
      let resultados = catalogo.filter((unidad) => {
        const text = searchableText(unidad);
        return tokensToMatch.every((token) => text.includes(token));
      });

      if (typeof req.query.entidad === 'string' && req.query.entidad !== 'TODAS') {
        const entidad = normalizeSearchText(req.query.entidad);
        resultados = resultados.filter((unidad) => normalizeSearchText(unidad.entidad) === entidad);
      }

      const requestedLimit = Number.parseInt(req.query.limit as string, 10);
      const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 500)
        : 100;
      res.json({ total: resultados.length, unidades: resultados.slice(0, limit) });
    } catch (error) {
      console.error('Error buscando en el catálogo CLUES:', error);
      cluesCatalogPromise = null;
      res.status(500).json({ error: 'No se pudo consultar el catálogo CLUES exportado.' });
    }
  });

  app.get('/api/clues/busqueda', async (req: Request, res: Response) => {
    const rawQuery = typeof req.query.buscar === 'string' ? req.query.buscar.trim() : '';
    const query = normalizeSearchText(rawQuery);
    if (query.length < 2) {
      res.status(400).json({ error: 'Escribe al menos dos caracteres para buscar.' });
      return;
    }

    const requestedLimit = Number.parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 50)
      : 10;
    const requestedRadius = Number.parseFloat(req.query.radioKm as string);
    const radiusKm = Number.isFinite(requestedRadius) && requestedRadius > 0
      ? Math.min(requestedRadius, 100)
      : 30;

    try {
      const catalogo = await loadCluesCatalog();
      const searchableText = (unidad: UnidadMedica) => normalizeSearchText([
        unidad.clues,
        unidad.nombre_unidad,
        unidad.nombre_comercial ?? '',
        unidad.tipo_unidad,
        unidad.direccion,
        unidad.codigo_postal,
        unidad.localidad,
        unidad.municipio,
        unidad.entidad
      ].join(' '));

      const exactMatches = catalogo.filter((unidad) => [
        unidad.clues,
        unidad.nombre_unidad,
        unidad.nombre_comercial ?? ''
      ].some((value) => normalizeSearchText(value) === query));
      const looksLikeClues = /^(?=.*\d)[a-z0-9-]{7,}$/i.test(rawQuery.replace(/\s/g, ''));
      if (exactMatches.length > 0 || looksLikeClues) {
        const matches = exactMatches.length > 0
          ? exactMatches
          : catalogo.filter((unidad) => normalizeSearchText(unidad.clues).includes(query));
        res.json({ tipo: 'unidades', origen: null, total: matches.length, unidades: matches.slice(0, limit) });
        return;
      }

      const origin = await geocodePlace(rawQuery);
      if (origin) {
        const near = catalogo
          .filter((unidad): unidad is UnidadMedica & { latitud: number; longitud: number } =>
            unidad.latitud !== null && unidad.longitud !== null)
          .map((unidad) => {
            const distanciaKm = calcularDistanciaHaversineKm(
              origin.latitud,
              origin.longitud,
              unidad.latitud,
              unidad.longitud
            );
            return {
              ...unidad,
              distanciaKm: Number(distanciaKm.toFixed(2)),
              distanciaFormateada: formatearDistancia(distanciaKm)
            };
          })
          .filter((unidad) => unidad.distanciaKm <= radiusKm)
          .sort((first, second) => first.distanciaKm - second.distanciaKm);

        res.json({
          tipo: 'lugar',
          origen: { ...origin, radioKm: radiusKm },
          total: near.length,
          unidades: near.slice(0, limit)
        });
        return;
      }

      const queryTokens = query.split(/\s+/).filter(Boolean);
      const knownTokens = queryTokens.filter((token) =>
        catalogo.some((unidad) => searchableText(unidad).includes(token))
      );
      const tokensToMatch = knownTokens.length > 0 ? knownTokens : queryTokens;
      const matches = catalogo.filter((unidad) => {
        const text = searchableText(unidad);
        return tokensToMatch.every((token) => text.includes(token));
      });
      res.json({ tipo: 'unidades', origen: null, total: matches.length, unidades: matches.slice(0, limit) });
    } catch (error) {
      console.error('Error buscando ubicación y CLUES cercanas:', error);
      cluesCatalogPromise = null;
      res.status(502).json({ error: 'No se pudo completar la búsqueda geográfica.' });
    }
  });

  // 2. GET /api/unidades/cercanas?latitud=&longitud=&limite=&radioKm=
  app.get('/api/unidades/cercanas', (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.latitud as string);
      const lon = parseFloat(req.query.longitud as string);
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 20;
      const radioKm = req.query.radioKm ? parseFloat(req.query.radioKm as string) : null;

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        res.status(400).json({
          error: 'Coordenadas GPS no válidas. Ingrese latitud [-90, 90] y longitud [-180, 180].'
        });
        return;
      }

      // Filtrar solo unidades con coordenadas válidas confirmadas
      const unidadesConGps = UNIDADES_MEDICAS_DATA.filter(
        (u): u is UnidadMedica & { latitud: number; longitud: number } =>
          u.latitud !== null && u.longitud !== null
      );

      // Calcular distancia geodésica mediante Haversine
      const calculadas = unidadesConGps.map((u) => {
        const distanciaKm = calcularDistanciaHaversineKm(lat, lon, u.latitud, u.longitud);
        return {
          ...u,
          distanciaKm: Number(distanciaKm.toFixed(2)),
          distanciaFormateada: formatearDistancia(distanciaKm)
        };
      });

      // Filtrar por radio si fue solicitado
      let filtradas = calculadas;
      if (radioKm !== null && radioKm > 0) {
        filtradas = calculadas.filter((u) => u.distanciaKm <= radioKm);
      }

      // Ordenar de menor a mayor distancia geodésica
      filtradas.sort((a, b) => a.distanciaKm - b.distanciaKm);

      const resultado = filtradas.slice(0, limite);

      res.json({
        origen: { latitud: lat, longitud: lon },
        totalEncontradas: filtradas.length,
        limiteAplicado: limite,
        radioKm: radioKm ?? 'sin_limite',
        unidades: resultado
      });
    } catch (error) {
      console.error('Error calculando proximidad:', error);
      res.status(500).json({ error: 'Error calculando proximidad geográfica.' });
    }
  });

  // 3. GET /api/unidades/filtros
  app.get('/api/unidades/filtros', (_req: Request, res: Response) => {
    try {
      const entidadesSet = new Set<string>();
      const institucionesSet = new Set<string>();
      const tiposSet = new Set<string>();
      const municipiosSet = new Set<string>();

      UNIDADES_MEDICAS_DATA.forEach((u) => {
        if (u.entidad) entidadesSet.add(u.entidad);
        if (u.institucion) institucionesSet.add(u.institucion);
        if (u.tipo_unidad) tiposSet.add(u.tipo_unidad);
        if (u.municipio) municipiosSet.add(u.municipio);
      });

      res.json({
        entidades: Array.from(entidadesSet).sort(),
        instituciones: Array.from(institucionesSet).sort(),
        tiposUnidad: Array.from(tiposSet).sort(),
        municipios: Array.from(municipiosSet).sort(),
        totalRegistros: UNIDADES_MEDICAS_DATA.length
      });
    } catch (error) {
      console.error('Error al obtener catálogo de filtros:', error);
      res.status(500).json({ error: 'Error interno al consultar filtros.' });
    }
  });

  // 4. GET /api/unidades/:clues
  app.get('/api/unidades/:clues', (req: Request, res: Response) => {
    try {
      const cluesParam = req.params.clues.trim().toUpperCase();
      const unidad = UNIDADES_MEDICAS_DATA.find(
        (u) => u.clues.toUpperCase() === cluesParam
      );

      if (!unidad) {
        res.status(404).json({ error: `No se encontró la unidad médica con CLUES: ${cluesParam}` });
        return;
      }

      res.json(unidad);
    } catch (error) {
      console.error('Error consultando CLUES:', error);
      res.status(500).json({ error: 'Error interno al consultar por CLUES.' });
    }
  });

  // 5. GET /api/backend-java-info (Documentación del backend Java)
  app.get('/api/backend-java-info', (_req: Request, res: Response) => {
    res.json({
      modulo: 'Backend Java Spring Boot 3.2.x',
      directorio: '/backend-java',
      paquete: 'com.salud.buscador',
      controlador: 'UnidadMedicaController.java',
      servicio: 'UnidadMedicaService.java',
      formula_distancia: 'Haversine (Radio terrestre = 6371 km)',
      entidad_jpa: 'UnidadMedica.java',
      persistencia: 'Spring Data JPA + H2 (memoria) / PostgreSQL (producción)',
      puerto_defecto: 8080,
      rutas_disponibles: [
        'GET /api/unidades?buscar=&institucion=&tipo=&entidad=',
        'GET /api/unidades/{clues}',
        'GET /api/unidades/cercanas?latitud=&longitud=&limite=&radioKm=',
        'GET /api/unidades/filtros'
      ]
    });
  });

  // ==========================================
  // Vite Integration (Dev o Prod)
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Buscador Unidades Médicas] Servidor activo en puerto ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error iniciando el servidor:', err);
});
