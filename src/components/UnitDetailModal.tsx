import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Copy,
  Check,
  Building2,
  Clock,
  Phone,
  Compass,
  AlertTriangle,
  ExternalLink,
  Car,
  Footprints,
  Box
} from 'lucide-react';
import { UnidadMedica, UserCoordinates } from '../types.ts';

interface UnitDetailModalProps {
  unidad: UnidadMedica | null;
  onClose: () => void;
  onLocateOnMap: (unidad: UnidadMedica) => void;
  userLocation: UserCoordinates | null;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unidad,
  onClose,
  onLocateOnMap,
  userLocation
}) => {
  if (!unidad) return null;

  const [copiedClues, setCopiedClues] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyClues = () => {
    navigator.clipboard.writeText(unidad.clues);
    setCopiedClues(true);
    setTimeout(() => setCopiedClues(false), 2000);
  };

  const handleCopyAddress = () => {
    const fullAddress = `${unidad.direccion}, Col. ${unidad.localidad}, ${unidad.municipio}, ${unidad.entidad}, C.P. ${unidad.codigo_postal}`;
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const hasGps = unidad.latitud !== null && unidad.longitud !== null;

  const estimarAutoMin = unidad.distanciaKm ? Math.max(2, Math.round(unidad.distanciaKm * 2.5)) : null;
  const estimarPieMin = unidad.distanciaKm ? Math.max(1, Math.round(unidad.distanciaKm * 13)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B1D1A] rounded-3xl shadow-2xl border border-[#183F36] overflow-hidden flex flex-col max-h-[92vh] text-stone-200 animate-in zoom-in-95 duration-200">
        {/* Banner Superior */}
        <div className="relative p-6 bg-gradient-to-br from-[#081715] via-[#0D2621] to-[#13322B] text-white border-b border-[#183F36]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#13322B] border border-[#34D399]/30 text-[11px] font-mono font-semibold text-[#34D399] mb-2">
                <span>{unidad.institucion}</span>
                <span className="opacity-40">·</span>
                <span>{unidad.nivel_atencion}</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                {unidad.nombre_unidad}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido de la Ficha Técnica */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-300">
          {/* Bloque CLUES */}
          <div className="p-4 bg-[#081715] rounded-2xl border border-[#163830] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Clave Única (CLUES Oficial)
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#F472B6]">
                {unidad.clues}
              </span>
            </div>
            <button
              onClick={handleCopyClues}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#102B25] hover:bg-[#163830] border border-[#34D399]/30 rounded-xl text-emerald-300 transition-all cursor-pointer shadow-xs"
            >
              {copiedClues ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedClues ? 'Copiada' : 'Copiar'}</span>
            </button>
          </div>

          {/* Estimación de traslado si el usuario tiene GPS */}
          {unidad.distanciaFormateada && (
            <div className="p-3.5 bg-gradient-to-r from-[#0E2621] to-[#12312A] rounded-2xl border border-[#34D399]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                  Distancia geodésica satelital
                </span>
                <span className="font-display font-bold text-base text-white font-mono">
                  {unidad.distanciaFormateada}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-300 font-medium font-mono">
                {estimarAutoMin && (
                  <div className="flex items-center gap-1 text-[#34D399]">
                    <Car className="w-4 h-4" />
                    <span>~{estimarAutoMin} min</span>
                  </div>
                )}
                {estimarPieMin && (
                  <div className="flex items-center gap-1 text-[#34D399]">
                    <Footprints className="w-4 h-4" />
                    <span>~{estimarPieMin} min</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid de Tipo y Operación */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#081715] rounded-2xl border border-[#163830]">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                Tipo de Establecimiento
              </span>
              <span className="font-semibold text-white block leading-tight">
                {unidad.tipo_unidad}
              </span>
            </div>
            <div className="p-3.5 bg-[#081715] rounded-2xl border border-[#163830]">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                Estatus Operativo
              </span>
              <span className="font-semibold text-[#34D399] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
                <span>{unidad.estatus_operacion || 'En Operación'}</span>
              </span>
            </div>
          </div>

          {/* Domicilio Completo */}
          <div className="p-4 bg-[#081715] rounded-2xl border border-[#163830] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                Dirección Oficial Registrada
              </span>
              <button
                onClick={handleCopyAddress}
                className="text-xs font-bold text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedAddress ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAddress ? 'Copiada' : 'Copiar dirección'}</span>
              </button>
            </div>
            <p className="text-stone-200 font-medium leading-relaxed">
              {unidad.direccion}
            </p>
            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-stone-400">
              <div>
                <span className="text-stone-500 block text-[10px]">Municipio / Alcaldía</span>
                <span className="font-semibold text-stone-200">{unidad.municipio}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Entidad Federativa</span>
                <span className="font-semibold text-stone-200">{unidad.entidad}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Código Postal</span>
                <span className="font-mono font-semibold text-stone-200">{unidad.codigo_postal}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Colonia / Localidad</span>
                <span className="font-semibold text-stone-200">{unidad.localidad}</span>
              </div>
            </div>
          </div>

          {/* Coordenadas Geográficas GPS */}
          <div className="p-3.5 bg-[#081715] rounded-2xl border border-[#163830]">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Coordenadas WGS84 & Altura de Extrusión 3D
            </span>
            {hasGps ? (
              <div className="flex items-center justify-between font-mono text-xs text-stone-300">
                <div>
                  LAT: <strong className="text-white">{unidad.latitud?.toFixed(6)}°</strong>
                </div>
                <div>
                  LON: <strong className="text-white">{unidad.longitud?.toFixed(6)}°</strong>
                </div>
                <div className="text-[#34D399]">
                  ALT: {unidad.nivel_atencion === 'Tercer Nivel' ? '54m' : '30m'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-600/40 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Registro en catálogo sin coordenadas satelitales validadas.</span>
              </div>
            )}
          </div>

          {/* Horario y Teléfono */}
          {(unidad.telefono || unidad.horario) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unidad.telefono && (
                <div className="p-3 bg-[#081715] rounded-2xl border border-[#163830] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#13322B] flex items-center justify-center text-[#34D399] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">Contacto</span>
                    <a href={`tel:${unidad.telefono.replace(/\s+/g, '')}`} className="text-xs font-bold text-[#34D399] hover:underline">
                      {unidad.telefono}
                    </a>
                  </div>
                </div>
              )}
              {unidad.horario && (
                <div className="p-3 bg-[#081715] rounded-2xl border border-[#163830] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#122A25] flex items-center justify-center text-stone-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">Horario</span>
                    <span className="text-xs font-semibold text-stone-200 leading-tight block">{unidad.horario}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones del Modal */}
        <div className="p-4 bg-[#081715] border-t border-[#183F36] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {hasGps && (
            <a
              href={
                userLocation
                  ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitud},${userLocation.longitud}&destination=${unidad.latitud},${unidad.longitud}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${unidad.latitud},${unidad.longitud}`
              }
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 text-xs font-bold text-stone-200 bg-[#102B25] border border-[#1E4D42] rounded-xl hover:bg-[#163931] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Cómo llegar</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          )}

          {hasGps && (
            <button
              onClick={() => {
                onLocateOnMap(unidad);
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#9D2449] to-[#801B39] hover:from-[#B12953] hover:to-[#921F42] border border-[#F472B6]/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <Box className="w-3.5 h-3.5 text-white" />
              <span>Ver en 3D</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
