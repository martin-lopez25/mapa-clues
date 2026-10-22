export interface UnidadMedica {
  clues: string;
  nombre_unidad: string;
  nombre_comercial?: string;
  tipo_unidad: string;
  institucion: 'IMSS' | 'ISSSTE' | 'SSA / IMSS-BIENESTAR' | 'PEMEX' | 'SEDENA' | 'PRIVADO' | 'OTRO';
  nivel_atencion: 'Primer Nivel' | 'Segundo Nivel' | 'Tercer Nivel' | 'NO APLICA';
  direccion: string;
  localidad: string;
  municipio: string;
  entidad: string;
  codigo_postal: string;
  latitud: number | null;
  longitud: number | null;
  telefono?: string;
  horario?: string;
  estatus_operacion?: string;
  distanciaKm?: number;
  distanciaFormateada?: string;
}

export type GpsStatus =
  | 'idle'
  | 'solicitando'
  | 'obtenido'
  | 'denegado'
  | 'no_disponible'
  | 'timeout'
  | 'error';

export interface UserCoordinates {
  latitud: number;
  longitud: number;
  precision?: number;
  timestamp: number;
}

export interface MapSearchLocation {
  nombre: string;
  latitud: number;
  longitud: number;
  radioKm: number;
}

export interface FiltrosCatalogo {
  entidades: string[];
  instituciones: string[];
  tiposUnidad: string[];
  municipios: string[];
  totalRegistros: number;
}
