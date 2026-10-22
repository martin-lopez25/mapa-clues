import { UnidadMedica } from './unidadesMedicas.ts';

export interface Edificio3DFeature {
  type: 'Feature';
  properties: {
    id: string;
    clues: string;
    nombre: string;
    tipo: 'torre_hospital' | 'pabellon_urgencias' | 'area_clinica' | 'bloque_urbano' | 'helipuerto';
    height: number;
    min_height: number;
    color?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface EdificiosGeoJSON {
  type: 'FeatureCollection';
  features: Edificio3DFeature[];
}

/**
 * Genera bloques arquitectónicos tridimensionales realistas con geometría,
 * alturas proporcionales y pabellones para cada unidad médica y su manzana urbana.
 */
export function generarEdificios3D(unidades: UnidadMedica[]): EdificiosGeoJSON {
  const features: Edificio3DFeature[] = [];

  unidades.forEach((u, index) => {
    if (u.latitud === null || u.longitud === null) return;

    const lat = u.latitud;
    const lon = u.longitud;
    const offsetBase = 0.00045; // ~50 metros

    // Altura del edificio principal según el nivel de atención
    let alturaPrincipal = 28;
    if (u.nivel_atencion === 'Tercer Nivel') {
      alturaPrincipal = 54; // Torre médica alta
    } else if (u.nivel_atencion === 'Segundo Nivel') {
      alturaPrincipal = 34; // Hospital general mediano
    } else {
      alturaPrincipal = 14; // Centro de salud / clínica 2-3 niveles
    }

    // 1. Edificio Principal / Torre Hospitalaria
    features.push({
      type: 'Feature',
      properties: {
        id: `bld-${u.clues}-main`,
        clues: u.clues,
        nombre: `${u.nombre_unidad} - Torre Principal`,
        tipo: 'torre_hospital',
        height: alturaPrincipal,
        min_height: 0
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lon - offsetBase * 0.7, lat - offsetBase * 0.6],
            [lon + offsetBase * 0.7, lat - offsetBase * 0.6],
            [lon + offsetBase * 0.7, lat + offsetBase * 0.6],
            [lon - offsetBase * 0.7, lat + offsetBase * 0.6],
            [lon - offsetBase * 0.7, lat - offsetBase * 0.6]
          ]
        ]
      }
    });

    // 2. Pabellón de Urgencias y Consultorios (Estructura adyacente más baja)
    if (u.nivel_atencion !== 'Primer Nivel') {
      features.push({
        type: 'Feature',
        properties: {
          id: `bld-${u.clues}-urgencias`,
          clues: u.clues,
          nombre: `${u.nombre_unidad} - Pabellón Urgencias`,
          tipo: 'pabellon_urgencias',
          height: Math.round(alturaPrincipal * 0.45),
          min_height: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon + offsetBase * 0.85, lat - offsetBase * 0.5],
              [lon + offsetBase * 1.6, lat - offsetBase * 0.5],
              [lon + offsetBase * 1.6, lat + offsetBase * 0.5],
              [lon + offsetBase * 0.85, lat + offsetBase * 0.5],
              [lon + offsetBase * 0.85, lat - offsetBase * 0.5]
            ]
          ]
        }
      });
    }

    // 3. Bloques urbanos perimetrales inmediatos (Manzana urbana contextual)
    const offsetsUrbano = [
      { dLon: -offsetBase * 1.7, dLat: offsetBase * 1.2, h: 18 },
      { dLon: offsetBase * 1.4, dLat: offsetBase * 1.3, h: 22 },
      { dLon: -offsetBase * 1.6, dLat: -offsetBase * 1.4, h: 16 }
    ];

    offsetsUrbano.forEach((b, bIdx) => {
      features.push({
        type: 'Feature',
        properties: {
          id: `bld-${u.clues}-urb-${bIdx}`,
          clues: u.clues,
          nombre: `Estructura urbana circundante`,
          tipo: 'bloque_urbano',
          height: b.h,
          min_height: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon + b.dLon - offsetBase * 0.4, lat + b.dLat - offsetBase * 0.4],
              [lon + b.dLon + offsetBase * 0.4, lat + b.dLat - offsetBase * 0.4],
              [lon + b.dLon + offsetBase * 0.4, lat + b.dLat + offsetBase * 0.4],
              [lon + b.dLon - offsetBase * 0.4, lat + b.dLat + offsetBase * 0.4],
              [lon + b.dLon - offsetBase * 0.4, lat + b.dLat - offsetBase * 0.4]
            ]
          ]
        }
      });
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}
