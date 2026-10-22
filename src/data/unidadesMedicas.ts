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
}

export const UNIDADES_MEDICAS_DATA: UnidadMedica[] = [
  // --- CIUDAD DE MÉXICO ---
  {
    clues: 'DFSSA000450',
    nombre_unidad: 'Hospital General de México Dr. Eduardo Liceaga',
    tipo_unidad: 'Hospital Regional de Alta Especialidad',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Calle Dr. Balmis No. 148, Colonia Doctores',
    localidad: 'Doctores',
    municipio: 'Cuauhtémoc',
    entidad: 'Ciudad de México',
    codigo_postal: '06720',
    latitud: 19.412842,
    longitud: -99.151785,
    telefono: '55 2789 2000',
    horario: 'Atención médica continua 24 horas',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFSSA003921',
    nombre_unidad: 'Instituto Nacional de Ciencias Médicas y Nutrición Salvador Zubirán',
    tipo_unidad: 'Instituto Nacional de Salud',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida Vasco de Quiroga No. 15, Colonia Belisario Domínguez Sección XVI',
    localidad: 'Tlalpan',
    municipio: 'Tlalpan',
    entidad: 'Ciudad de México',
    codigo_postal: '14080',
    latitud: 19.288924,
    longitud: -99.160142,
    telefono: '55 5487 0900',
    horario: '24 horas urgencias / Consultas 07:00 a 20:00',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFIMS000010',
    nombre_unidad: 'Centro Médico Nacional Siglo XXI - Hospital de Especialidades',
    tipo_unidad: 'Unidad Médica de Alta Especialidad (UMAE)',
    institucion: 'IMSS',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida Cuauhtémoc No. 330, Colonia Doctores',
    localidad: 'Doctores',
    municipio: 'Cuauhtémoc',
    entidad: 'Ciudad de México',
    codigo_postal: '06720',
    latitud: 19.406981,
    longitud: -99.155312,
    telefono: '55 5627 6900',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFIMS000080',
    nombre_unidad: 'Hospital General de Zona No. 1 Gabriel Mancera (IMSS)',
    tipo_unidad: 'Hospital General de Zona',
    institucion: 'IMSS',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Gabriel Mancera No. 222, Colonia Del Valle',
    localidad: 'Del Valle',
    municipio: 'Benito Juárez',
    entidad: 'Ciudad de México',
    codigo_postal: '03100',
    latitud: 19.395726,
    longitud: -99.163148,
    telefono: '55 5687 4000',
    horario: 'Urgencias 24 horas',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFIST000210',
    nombre_unidad: 'Hospital Regional Lic. Adolfo López Mateos (ISSSTE)',
    tipo_unidad: 'Hospital Regional',
    institucion: 'ISSSTE',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida Universidad No. 1321, Colonia Florida',
    localidad: 'Florida',
    municipio: 'Álvaro Obregón',
    entidad: 'Ciudad de México',
    codigo_postal: '01030',
    latitud: 19.362145,
    longitud: -99.176428,
    telefono: '55 5271 2100',
    horario: '24 horas urgencias y hospitalización',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFSSA001420',
    nombre_unidad: 'Centro de Salud T-III Dr. Galo Soberón y Parra',
    tipo_unidad: 'Centro de Salud Urbano T-III',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Calzada Camarones No. 485, Colonia Sindicato Mexicano de Electricistas',
    localidad: 'Azcapotzalco',
    municipio: 'Azcapotzalco',
    entidad: 'Ciudad de México',
    codigo_postal: '02060',
    latitud: 19.467412,
    longitud: -99.179321,
    telefono: '55 5038 1700',
    horario: 'Lunes a Domingo 08:00 a 20:00',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFSSA002511',
    nombre_unidad: 'Centro de Salud T-II Portales',
    tipo_unidad: 'Centro de Salud Urbano T-II',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Avenida San Simón No. 94, Colonia Portales Sur',
    localidad: 'Portales',
    municipio: 'Benito Juárez',
    entidad: 'Ciudad de México',
    codigo_postal: '03300',
    latitud: 19.368541,
    longitud: -99.146205,
    telefono: '55 5672 3412',
    horario: 'Lunes a Viernes 07:00 a 19:00',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFSSA004120',
    nombre_unidad: 'Hospital Pediátrico de Coyoacán',
    tipo_unidad: 'Hospital Pediátrico Especializado',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Prolongación Moctezuma No. 18, Colonia Del Carmen Coyoacán',
    localidad: 'Del Carmen Coyoacán',
    municipio: 'Coyoacán',
    entidad: 'Ciudad de México',
    codigo_postal: '04100',
    latitud: 19.352418,
    longitud: -99.162319,
    telefono: '55 5554 1357',
    horario: '24 horas urgencias pediátricas',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFIMS001240',
    nombre_unidad: 'Unidad de Medicina Familiar No. 28 Gabriel Mancera (IMSS)',
    tipo_unidad: 'Unidad de Medicina Familiar',
    institucion: 'IMSS',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Gabriel Mancera No. 222, Colonia Del Valle',
    localidad: 'Del Valle',
    municipio: 'Benito Juárez',
    entidad: 'Ciudad de México',
    codigo_postal: '03100',
    latitud: 19.395210,
    longitud: -99.163580,
    telefono: '55 5687 4000',
    horario: 'Lunes a Viernes 07:00 a 21:00',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'DFPMX000010',
    nombre_unidad: 'Hospital Central Sur de Alta Especialidad PEMEX Picacho',
    tipo_unidad: 'Hospital de Alta Especialidad',
    institucion: 'PEMEX',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Periférico Sur No. 4091, Colonia Fuentes del Pedregal',
    localidad: 'Fuentes del Pedregal',
    municipio: 'Tlalpan',
    entidad: 'Ciudad de México',
    codigo_postal: '14140',
    latitud: 19.308215,
    longitud: -99.213456,
    telefono: '55 5645 1684',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },

  // --- QUINTANA ROO (Explicitly referenced in user prompt examples: QRIMB000025, Cancún, etc.) ---
  {
    clues: 'QRIMB000025',
    nombre_unidad: 'Hospital General de Cancún "Dr. Jesús Kumate Rodríguez"',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Arco Vial Norte Supermanzana 248, Fraccionamiento Villas del Mar',
    localidad: 'Cancún',
    municipio: 'Benito Juárez',
    entidad: 'Quintana Roo',
    codigo_postal: '77516',
    latitud: 21.196324,
    longitud: -86.864512,
    telefono: '998 840 0100',
    horario: '24 horas urgencias y hospitalización',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'QRIMS000110',
    nombre_unidad: 'Hospital General Regional No. 17 IMSS Cancún',
    tipo_unidad: 'Hospital General Regional',
    institucion: 'IMSS',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Politécnico Nacional No. 509, Supermanzana 509',
    localidad: 'Cancún',
    municipio: 'Benito Juárez',
    entidad: 'Quintana Roo',
    codigo_postal: '77533',
    latitud: 21.139420,
    longitud: -86.862310,
    telefono: '998 884 1200',
    horario: '24 horas',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'QRSSA000620',
    nombre_unidad: 'Hospital General de Playa del Carmen',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Constituyentes s/n, Colonia Ejidal',
    localidad: 'Playa del Carmen',
    municipio: 'Solidaridad',
    entidad: 'Quintana Roo',
    codigo_postal: '77712',
    latitud: 20.643210,
    longitud: -87.091450,
    telefono: '984 206 1860',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'QRSSA000340',
    nombre_unidad: 'Hospital Comunitario Isla Mujeres',
    tipo_unidad: 'Hospital Comunitario',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Carretera Garrafón Km 3.5, Colonia Salina Chica',
    localidad: 'Isla Mujeres',
    municipio: 'Isla Mujeres',
    entidad: 'Quintana Roo',
    codigo_postal: '77400',
    latitud: 21.228410,
    longitud: -86.732150,
    telefono: '998 877 0117',
    horario: '24 horas',
    estatus_operacion: 'En Operación'
  },

  // --- JALISCO (Guadalajara, Zapopan, etc.) ---
  {
    clues: 'JCSSA000101',
    nombre_unidad: 'Hospital Civil de Guadalajara Fray Antonio Alcalde',
    tipo_unidad: 'Hospital de Alta Especialidad',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Calle Coronel Calderón No. 777, Colonia El Retiro',
    localidad: 'Guadalajara',
    municipio: 'Guadalajara',
    entidad: 'Jalisco',
    codigo_postal: '44280',
    latitud: 20.686521,
    longitud: -103.351280,
    telefono: '33 3883 2800',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'JCIMS000124',
    nombre_unidad: 'Hospital General Regional No. 46 IMSS Guadalajara',
    tipo_unidad: 'Hospital General Regional',
    institucion: 'IMSS',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida 8 de Julio No. 200, Colonia Morelos',
    localidad: 'Guadalajara',
    municipio: 'Guadalajara',
    entidad: 'Jalisco',
    codigo_postal: '44910',
    latitud: 20.655812,
    longitud: -103.360140,
    telefono: '33 3812 5555',
    horario: '24 horas',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'JCIST000240',
    nombre_unidad: 'Hospital Regional Dr. Valentín Gómez Farías (ISSSTE)',
    tipo_unidad: 'Hospital Regional',
    institucion: 'ISSSTE',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida Soledad Orozco No. 203, Colonia El Capullo',
    localidad: 'Zapopan',
    municipio: 'Zapopan',
    entidad: 'Jalisco',
    codigo_postal: '45100',
    latitud: 20.724180,
    longitud: -103.385410,
    telefono: '33 3836 0650',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'JCSSA001890',
    nombre_unidad: 'Centro de Salud Zapopan Norte',
    tipo_unidad: 'Centro de Salud Urbano',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Calle Dr. Luis Farah No. 550, Colonia Villa Universitaria',
    localidad: 'Zapopan',
    municipio: 'Zapopan',
    entidad: 'Jalisco',
    codigo_postal: '45110',
    latitud: 20.731245,
    longitud: -103.391280,
    telefono: '33 3633 1120',
    horario: 'Lunes a Viernes 08:00 a 16:00',
    estatus_operacion: 'En Operación'
  },

  // --- NUEVO LEÓN (Monterrey, San Nicolás, etc.) ---
  {
    clues: 'NLSSA000210',
    nombre_unidad: 'Hospital Metropolitano Dr. Bernardo Sepúlveda',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Adolfo López Mateos No. 4600, Colonia Bosques del Nogalar',
    localidad: 'San Nicolás de los Garza',
    municipio: 'San Nicolás de los Garza',
    entidad: 'Nuevo León',
    codigo_postal: '66480',
    latitud: 25.728912,
    longitud: -100.288415,
    telefono: '81 8305 6300',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'NLIMS000330',
    nombre_unidad: 'Hospital General de Zona No. 33 IMSS Monterrey',
    tipo_unidad: 'Hospital General de Zona',
    institucion: 'IMSS',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Félix U. Gómez s/n, Colonia Centro',
    localidad: 'Monterrey',
    municipio: 'Monterrey',
    entidad: 'Nuevo León',
    codigo_postal: '64000',
    latitud: 25.681420,
    longitud: -100.297840,
    telefono: '81 8150 3130',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'NLUAN000100',
    nombre_unidad: 'Hospital Universitario Dr. José Eleuterio González',
    tipo_unidad: 'Hospital de Alta Especialidad',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida Francisco I. Madero y Gonzalitos s/n, Colonia Mitras Centro',
    localidad: 'Monterrey',
    municipio: 'Monterrey',
    entidad: 'Nuevo León',
    codigo_postal: '64460',
    latitud: 25.690850,
    longitud: -100.351280,
    telefono: '81 8389 1111',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },

  // --- YUCATÁN (Mérida) ---
  {
    clues: 'YCSSA000180',
    nombre_unidad: 'Hospital General Dr. Agustín O\'Horán Mérida',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Jacinto Canek por Calle 59-A s/n, Colonia Sambulá',
    localidad: 'Mérida',
    municipio: 'Mérida',
    entidad: 'Yucatán',
    codigo_postal: '97000',
    latitud: 20.970821,
    longitud: -89.638510,
    telefono: '999 930 3320',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'YCIMS000100',
    nombre_unidad: 'UMAE Hospital de Especialidades No. 1 Mérida IMSS',
    tipo_unidad: 'Unidad Médica de Alta Especialidad (UMAE)',
    institucion: 'IMSS',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Calle 41 No. 439 por 34, Colonia Industrial',
    localidad: 'Mérida',
    municipio: 'Mérida',
    entidad: 'Yucatán',
    codigo_postal: '97150',
    latitud: 20.985610,
    longitud: -89.605210,
    telefono: '999 922 5656',
    horario: '24 horas',
    estatus_operacion: 'En Operación'
  },

  // --- PUEBLA ---
  {
    clues: 'PLSSA000320',
    nombre_unidad: 'Hospital General del Sur Dr. Eduardo Vázquez Navarro',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Antiguo Camino a Guadalupe Hidalgo No. 11350, Colonia Agua Santa',
    localidad: 'Puebla',
    municipio: 'Puebla',
    entidad: 'Puebla',
    codigo_postal: '72490',
    latitud: 18.995410,
    longitud: -98.243510,
    telefono: '222 241 3322',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },
  {
    clues: 'PLIMS000210',
    nombre_unidad: 'Hospital de Traumatología y Ortopedia IMSS Puebla',
    tipo_unidad: 'Unidad Médica de Alta Especialidad (UMAE)',
    institucion: 'IMSS',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Diagonal Defensores de la República No. 1105, Colonia Amor',
    localidad: 'Puebla',
    municipio: 'Puebla',
    entidad: 'Puebla',
    codigo_postal: '72140',
    latitud: 19.062140,
    longitud: -98.204510,
    telefono: '222 242 4520',
    horario: '24 horas urgencias traumatología',
    estatus_operacion: 'En Operación'
  },

  // --- VERACRUZ ---
  {
    clues: 'VZSSA000410',
    nombre_unidad: 'Hospital de Alta Especialidad de Veracruz',
    tipo_unidad: 'Hospital de Alta Especialidad',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Avenida 20 de Noviembre No. 1074, Colonia Centro',
    localidad: 'Veracruz',
    municipio: 'Veracruz',
    entidad: 'Veracruz',
    codigo_postal: '91700',
    latitud: 19.186520,
    longitud: -96.142310,
    telefono: '229 932 3700',
    horario: '24 horas',
    estatus_operacion: 'En Operación'
  },

  // --- GUANAJUATO ---
  {
    clues: 'GTSSA000150',
    nombre_unidad: 'Hospital General de León',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Calle 20 de Enero No. 927, Colonia Obregón',
    localidad: 'León',
    municipio: 'León',
    entidad: 'Guanajuato',
    codigo_postal: '37320',
    latitud: 21.145810,
    longitud: -101.698420,
    telefono: '477 716 3300',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },

  // --- BAJA CALIFORNIA ---
  {
    clues: 'BCSSA000110',
    nombre_unidad: 'Hospital General de Tijuana',
    tipo_unidad: 'Hospital General',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Segundo Nivel',
    direccion: 'Avenida Centenario No. 10851, Zona Urbana Río Tijuana',
    localidad: 'Tijuana',
    municipio: 'Tijuana',
    entidad: 'Baja California',
    codigo_postal: '22010',
    latitud: 32.529810,
    longitud: -117.018240,
    telefono: '664 684 0077',
    horario: '24 horas urgencias',
    estatus_operacion: 'En Operación'
  },

  // --- SEDENA & INSTITUCIONES MILITARES / ESPECIALES ---
  {
    clues: 'DFSED000010',
    nombre_unidad: 'Hospital Central Militar (SEDENA)',
    tipo_unidad: 'Hospital Militar de Especialidades',
    institucion: 'SEDENA',
    nivel_atencion: 'Tercer Nivel',
    direccion: 'Periférico Boulevard Manuel Ávila Camacho s/n, Colonia Lomas de Sotelo',
    localidad: 'Lomas de Sotelo',
    municipio: 'Miguel Hidalgo',
    entidad: 'Ciudad de México',
    codigo_postal: '11200',
    latitud: 19.438510,
    longitud: -99.217820,
    telefono: '55 5557 4500',
    horario: '24 horas urgencias militares y derechohabientes',
    estatus_operacion: 'En Operación'
  },

  // --- UNIDADES SIN COORDENADAS GPS (Casos de prueba obligatorios según regla 8 y 10) ---
  // "Gestionar las unidades que carezcan de coordenadas. Evitar mostrar unidades sin coordenadas
  // como si tuvieran una ubicación confirmada. Permitir que los registros con dirección pero sin
  // coordenadas sigan apareciendo en las búsquedas por texto."
  {
    clues: 'DFSSA009991',
    nombre_unidad: 'Centro de Salud Rural San Salvador Cuauhtenco (Registro Padrón)',
    tipo_unidad: 'Centro de Salud Rural',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Calle Morelos s/n, Pueblo San Salvador Cuauhtenco',
    localidad: 'San Salvador Cuauhtenco',
    municipio: 'Milpa Alta',
    entidad: 'Ciudad de México',
    codigo_postal: '12300',
    latitud: null, // Sin coordenadas geográficas validadas en padrón DGIS
    longitud: null,
    telefono: '55 5862 1010',
    horario: 'Lunes a Viernes 08:00 a 16:00',
    estatus_operacion: 'En Operación (En proceso de geolocalización catastral)'
  },
  {
    clues: 'QRSSA009992',
    nombre_unidad: 'Dispensario Médico Rural Punta Allen',
    tipo_unidad: 'Casa de Salud',
    institucion: 'SSA / IMSS-BIENESTAR',
    nivel_atencion: 'Primer Nivel',
    direccion: 'Avenida Pescadores s/n, Reserva de la Biosfera Sian Ka\'an',
    localidad: 'Javier Rojo Gómez (Punta Allen)',
    municipio: 'Tulum',
    entidad: 'Quintana Roo',
    codigo_postal: '77793',
    latitud: null, // Sin coordenadas geográficas validadas
    longitud: null,
    telefono: '984 871 2000',
    horario: 'Lunes a Sábado 09:00 a 15:00',
    estatus_operacion: 'En Operación'
  }
];

/**
 * Cálculo geodésico de distancia mediante la fórmula de Haversine
 * @param lat1 Latitud punto 1 en grados decimales
 * @param lon1 Longitud punto 1 en grados decimales
 * @param lat2 Latitud punto 2 en grados decimales
 * @param lon2 Longitud punto 2 en grados decimales
 * @returns Distancia en kilómetros
 */
export function calcularDistanciaHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio medio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formateo amigable de la distancia
 */
export function formatearDistancia(km: number | undefined | null): string {
  if (km === undefined || km === null) return '';
  if (km < 1) {
    const metros = Math.round(km * 1000);
    return `${metros} m`;
  }
  return `${km.toFixed(1)} km`;
}
