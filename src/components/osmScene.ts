import bboxClip from '@turf/bbox-clip';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import type { BBox, Feature, LineString, MultiLineString, MultiPolygon, Polygon } from 'geojson';

type SceneGeometry = Polygon | MultiPolygon | LineString | MultiLineString;
type SceneFeature = Feature<SceneGeometry>;

export interface OsmSceneStatus {
  phase: 'overview' | 'loading' | 'ready' | 'error';
  buildings: number;
  roads: number;
  estimated: number;
  message?: string;
}

export interface OsmSceneController {
  refresh(): void;
  setNeonVisible(visible: boolean): void;
  exportGlb(): Promise<ArrayBuffer>;
  dispose(): void;
}

const OVERVIEW: OsmSceneStatus = { phase: 'overview', buildings: 0, roads: 0, estimated: 0 };
const SCENE_RADIUS_METERS = 700;
const MAX_BUILDING_FEATURES = 1600;
const MAX_ROAD_FEATURES = 800;

function geometryCenter(geometry: SceneGeometry): [number, number] | null {
  const positions: number[][] = [];
  const collect = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      positions.push(value as number[]);
      return;
    }
    value.forEach(collect);
  };

  collect(geometry.coordinates);
  if (positions.length === 0) return null;
  const total = positions.reduce(
    (sum, position) => [sum[0] + position[0], sum[1] + position[1]],
    [0, 0]
  );
  return [total[0] / positions.length, total[1] / positions.length];
}

export function attachOsmScene(
  map: maplibregl.Map,
  onStatus: (status: OsmSceneStatus) => void
): OsmSceneController {
  const scene = new THREE.Scene();
  const content = new THREE.Group();
  content.name = 'OpenStreetMap - Mexico';
  scene.add(content, new THREE.AmbientLight('#ffffff', 2));

  const sun = new THREE.DirectionalLight('#ffffff', 2.5);
  sun.position.set(-200, -300, 500);
  scene.add(sun);

  const camera = new THREE.Camera();
  const buildingFillMaterial = new THREE.MeshStandardMaterial({
    color: '#0a1630',
    emissive: '#07152d',
    emissiveIntensity: 0.45,
    roughness: 0.38,
    metalness: 0.42,
    transparent: true,
    opacity: 0.72
  });
  const buildingEdgeColors = ['#ff4655', '#37e08e', '#3b82f6'];
  const buildingEdgeMaterials = buildingEdgeColors.map((color) => new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  }));
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: '#ffd34e',
    emissive: '#ad7210',
    emissiveIntensity: 0.9,
    roughness: 0.32
  });
  let renderer: THREE.WebGLRenderer | undefined;
  let transform = new THREE.Matrix4();
  let revision = '';
  let status = OVERVIEW;
  let neonVisible = true;
  let disposed = false;

  const clear = () => {
    for (const object of [...content.children]) {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) object.geometry.dispose();
      content.remove(object);
    }
  };

  const report = (next: OsmSceneStatus) => {
    status = next;
    if (!disposed) onStatus(next);
  };

  const setNativeBuildings = (hasCustomBuildings: boolean) => {
    if (map.getLayer('building-3d')) {
      const opacity = neonVisible ? (hasCustomBuildings ? 0.18 : 0.62) : 0.82;
      map.setPaintProperty('building-3d', 'fill-extrusion-opacity', opacity);
    }
  };

  map.addLayer({
    id: 'osm-country-scene',
    type: 'custom',
    renderingMode: '3d',
    onAdd(currentMap, gl) {
      renderer = new THREE.WebGLRenderer({
        canvas: currentMap.getCanvas(),
        context: gl,
        antialias: true
      });
      renderer.autoClear = false;
    },
    render(_gl, args) {
      if (!renderer || content.children.length === 0) return;
      camera.projectionMatrix = new THREE.Matrix4()
        .fromArray(args.defaultProjectionData.mainMatrix)
        .multiply(transform);
      renderer.resetState();
      renderer.render(scene, camera);
    },
    onRemove() {
      clear();
      buildingFillMaterial.dispose();
      buildingEdgeMaterials.forEach((material) => material.dispose());
      roadMaterial.dispose();
      renderer?.dispose();
      renderer = undefined;
    }
  });

  const rebuild = () => {
    if (disposed) return;
    if (map.getZoom() < 15) {
      if (revision === 'overview') return;
      revision = 'overview';
      clear();
      setNativeBuildings(false);
      report(OVERVIEW);
      map.triggerRepaint();
      return;
    }
    if (!map.isSourceLoaded('openmaptiles')) return;

    const bounds = map.getBounds();
    const center = map.getCenter();
    const latitudeDelta = SCENE_RADIUS_METERS / 111_320;
    const longitudeDelta = SCENE_RADIUS_METERS /
      (111_320 * Math.max(Math.cos(center.lat * Math.PI / 180), 0.01));
    const bbox: BBox = [
      Math.max(bounds.getWest(), center.lng - longitudeDelta),
      Math.max(bounds.getSouth(), center.lat - latitudeDelta),
      Math.min(bounds.getEast(), center.lng + longitudeDelta),
      Math.min(bounds.getNorth(), center.lat + latitudeDelta)
    ];
    if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) {
      clear();
      setNativeBuildings(false);
      report({ phase: 'ready', buildings: 0, roads: 0, estimated: 0 });
      map.triggerRepaint();
      return;
    }
    const nextRevision = `${map.getZoom().toFixed(3)}:${bbox.join(',')}`;
    if (nextRevision === revision) return;
    revision = nextRevision;
    report({ ...status, phase: 'loading' });

    try {
      const origin = maplibregl.MercatorCoordinate.fromLngLat(center, 0);
      const scale = origin.meterInMercatorCoordinateUnits();
      transform = new THREE.Matrix4()
        .makeTranslation(origin.x, origin.y, origin.z)
        .scale(new THREE.Vector3(scale, -scale, scale));

      const toLocal = (coordinates: number[]) => {
        const mercator = maplibregl.MercatorCoordinate.fromLngLat([coordinates[0], coordinates[1]]);
        return new THREE.Vector2((mercator.x - origin.x) / scale, (origin.y - mercator.y) / scale);
      };

      const buildingFeatures = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' })
        .sort((first, second) => {
          const height = (feature: typeof first) => Number(
            feature.properties?.render_height ?? feature.properties?.height ??
            Number(feature.properties?.['building:levels']) * 3
          ) || 0;
          return height(second) - height(first);
        })
        .slice(0, MAX_BUILDING_FEATURES)
        .map((feature) => ({ feature, sourceLayer: 'building' }));
      const roadPriority: Record<string, number> = {
        motorway: 5,
        trunk: 4,
        primary: 3,
        secondary: 2,
        tertiary: 1
      };
      const roadFeatures = map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' })
        .sort((first, second) =>
          (roadPriority[String(second.properties?.class)] ?? 0) -
          (roadPriority[String(first.properties?.class)] ?? 0)
        )
        .slice(0, MAX_ROAD_FEATURES)
        .map((feature) => ({ feature, sourceLayer: 'transportation' }));
      const features = [...buildingFeatures, ...roadFeatures];

      clear();
      const seen = new Set<string>();
      let buildings = 0;
      let roads = 0;
      let estimated = 0;

      for (const { feature, sourceLayer } of features) {
        if (sourceLayer === 'building' && buildings >= MAX_BUILDING_FEATURES) continue;
        if (sourceLayer === 'transportation' && roads >= MAX_ROAD_FEATURES) continue;
        if (!['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'].includes(feature.geometry.type)) continue;
        if (sourceLayer === 'transportation' && ['rail', 'transit'].includes(String(feature.properties?.class))) continue;

        const featureId = feature.id ?? feature.properties?.osm_id;
        if (featureId !== undefined && featureId !== null) {
          const key = `${sourceLayer}:${featureId}`;
          if (seen.has(key)) continue;
          seen.add(key);
        }

        const clipped = bboxClip(feature as unknown as SceneFeature, bbox);
        const featureCenter = geometryCenter(clipped.geometry);
        if (!featureCenter) continue;
        const latitudeDistance = (featureCenter[1] - center.lat) * 111_320;
        const longitudeDistance = (featureCenter[0] - center.lng) * 111_320 *
          Math.cos(center.lat * Math.PI / 180);
        if (Math.hypot(latitudeDistance, longitudeDistance) > SCENE_RADIUS_METERS) continue;
        const properties = feature.properties ?? {};
        const name = String(properties.name ?? `${sourceLayer}-${feature.id ?? seen.size}`);

        if (sourceLayer === 'building' && ['Polygon', 'MultiPolygon'].includes(clipped.geometry.type)) {
          const geometry = clipped.geometry as Polygon | MultiPolygon;
          const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
          const suppliedHeight = Number(properties.height ?? properties.render_height);
          const suppliedBase = Number(properties.min_height ?? properties.render_min_height);
          const levels = Number(properties['building:levels']);
          const height = Number.isFinite(suppliedHeight) && suppliedHeight > 0
            ? suppliedHeight
            : Number.isFinite(levels) && levels > 0 ? levels * 3 : 8;
          const base = Number.isFinite(suppliedBase) && suppliedBase >= 0 && suppliedBase < height ? suppliedBase : 0;
          const heightEstimated = !(Number.isFinite(suppliedHeight) && suppliedHeight > 0);

          for (const rings of polygons) {
            if (buildings >= MAX_BUILDING_FEATURES) break;
            if (!rings[0] || rings[0].length < 4) continue;
            const shape = new THREE.Shape(rings[0].map((coordinates) => toLocal(coordinates)));
            for (const hole of rings.slice(1)) {
              shape.holes.push(new THREE.Path(hole.map((coordinates) => toLocal(coordinates))));
            }

            const geometry = new THREE.ExtrudeGeometry(shape, { depth: height - base, bevelEnabled: false });
            const mesh = new THREE.Mesh(geometry, buildingFillMaterial);
            mesh.position.z = base;
            mesh.name = name;
            mesh.userData = {
              ...properties,
              height_m: height,
              height_source: heightEstimated ? 'estimated' : 'OSM vector tiles'
            };
            content.add(mesh);

            const colorIndex = [...name].reduce((hash, character) => hash + character.charCodeAt(0), 0) % buildingEdgeMaterials.length;
            const outline = new THREE.LineSegments(
              new THREE.EdgesGeometry(geometry, 15),
              buildingEdgeMaterials[colorIndex]
            );
            outline.position.z = base;
            outline.name = `${name}-neon-outline`;
            outline.userData = mesh.userData;
            content.add(outline);
            buildings++;
            if (heightEstimated) estimated++;
          }
        } else if (sourceLayer === 'transportation' && ['LineString', 'MultiLineString'].includes(clipped.geometry.type)) {
          const geometry = clipped.geometry as LineString | MultiLineString;
          const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
          const width = ['motorway', 'trunk'].includes(String(properties.class)) ? 7
            : ['primary', 'secondary'].includes(String(properties.class)) ? 5 : 2.5;

          for (const line of lines) {
            if (roads >= MAX_ROAD_FEATURES) break;
            if (line.length < 2) continue;
            const points = line.map((coordinates) => toLocal(coordinates))
              .map((point) => new THREE.Vector3(point.x, point.y, 0.12));
            const path = new THREE.CurvePath<THREE.Vector3>();
            for (let index = 1; index < points.length; index++) {
              if (!points[index - 1].equals(points[index])) {
                path.add(new THREE.LineCurve3(points[index - 1], points[index]));
              }
            }
            if (path.curves.length === 0) continue;

            const mesh = new THREE.Mesh(
              new THREE.TubeGeometry(path, Math.max(2, Math.min(points.length, 96)), width / 2, 3, false),
              roadMaterial
            );
            mesh.scale.z = 0.02;
            mesh.name = name;
            mesh.userData = { ...properties, source: 'OpenStreetMap', width_estimated: true };
            content.add(mesh);
            roads++;
          }
        }
      }

      content.userData = {
        source: 'OpenStreetMap contributors / OpenFreeMap',
        license: 'ODbL',
        center: center.toArray(),
        bbox,
        radius_m: SCENE_RADIUS_METERS,
        units: 'meters',
        up: 'Z',
        buildings,
        roads,
        estimated_heights: estimated
      };
      setNativeBuildings(buildings > 0);
      report({ phase: 'ready', buildings, roads, estimated });
      map.triggerRepaint();
    } catch {
      clear();
      setNativeBuildings(false);
      report({ ...OVERVIEW, phase: 'error', message: 'No se pudo generar la escena de esta zona.' });
    }
  };

  const markLoading = () => {
    revision = '';
    if (map.getZoom() >= 15) {
      clear();
      report({ ...status, phase: 'loading' });
      map.triggerRepaint();
    }
  };

  map.on('moveend', markLoading);
  map.on('idle', rebuild);
  rebuild();

  return {
    setNeonVisible(visible) {
      neonVisible = visible;
      if (map.getLayer('osm-country-scene')) {
        map.setLayoutProperty('osm-country-scene', 'visibility', visible ? 'visible' : 'none');
      }
      setNativeBuildings(status.phase === 'ready' && status.buildings > 0);
      map.triggerRepaint();
    },
    refresh() {
      markLoading();
      rebuild();
      map.triggerRepaint();
    },
    async exportGlb() {
      if (status.phase !== 'ready' || content.children.length === 0) {
        throw new Error('No hay una escena cargada para exportar.');
      }
      const output = await new GLTFExporter().parseAsync(content.clone(true), { binary: true, onlyVisible: true });
      if (!(output instanceof ArrayBuffer)) throw new Error('No se pudo generar el archivo GLB.');
      return output;
    },
    dispose() {
      disposed = true;
      map.off('moveend', markLoading);
      map.off('idle', rebuild);
      if (map.getLayer('osm-country-scene')) map.removeLayer('osm-country-scene');
    }
  };
}