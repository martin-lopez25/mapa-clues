import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(root, 'public', 'data', 'clues_json_por_nivel');
const outputDirectory = path.join(root, 'public', 'data');
const groups = [
  { file: 'clues_primer_nivel.json', level: 'Primer Nivel', count: 'primerNivel' },
  { file: 'clues_segundo_nivel.json', level: 'Segundo Nivel', count: 'segundoNivel' },
  { file: 'clues_tercer_nivel.json', level: 'Tercer Nivel', count: 'tercerNivel' },
  { file: 'clues_no_aplica.json', level: 'NO APLICA', count: 'otros' }
];

const summary = { total: 0, primerNivel: 0, segundoNivel: 0, tercerNivel: 0, otros: 0 };
const searchIndex = [];

for (const group of groups) {
  const contents = await readFile(path.join(dataDirectory, group.file), 'utf-8');
  const collection = JSON.parse(contents);
  summary[group.count] = collection.features.length;
  summary.total += collection.features.length;

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};
    const [longitude, latitude] = feature.geometry.coordinates;
    searchIndex.push({
      clues: String(properties.clues_imb ?? ''),
      nombre_unidad: String(properties.nombre_de_la_unidad ?? ''),
      nombre_comercial: String(properties.nombre_comercial ?? ''),
      tipo_unidad: String(properties.nombre_de_tipologia ?? 'Unidad médica'),
      institucion: 'OTRO',
      nivel_atencion: group.level,
      direccion: String(properties.direccion ?? properties.domicilio ?? properties.localidad ?? ''),
      localidad: String(properties.localidad ?? ''),
      municipio: String(properties.municipio ?? ''),
      entidad: String(properties.entidad ?? ''),
      codigo_postal: String(properties.codigo_postal ?? properties.cp ?? ''),
      latitud: Number(latitude),
      longitud: Number(longitude),
      estatus_operacion: String(properties.estatus_de_operacion ?? '')
    });
  }
}

await writeFile(path.join(outputDirectory, 'clues-search-index.json'), JSON.stringify(searchIndex));
await writeFile(path.join(outputDirectory, 'clues-summary.json'), JSON.stringify(summary));
console.log(`GitHub Pages data generated: ${summary.total} CLUES`);