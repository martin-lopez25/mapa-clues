import React, { useState, useEffect } from 'react';
import { X, Code2, Server, Database, Check, Copy, Terminal, Box } from 'lucide-react';

interface JavaBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaBackendModal: React.FC<JavaBackendModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'arquitectura' | 'endpoints' | 'haversine' | 'bd'>('arquitectura');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/backend-java-info')
        .then((res) => res.json())
        .then((data) => setBackendInfo(data))
        .catch((err) => console.error('Error cargando info backend:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const haversineJavaCode = `package com.salud.buscador.service;

import org.springframework.stereotype.Service;

@Service
public class GeolocationService {

    private static final double RADIO_TIERRA_KM = 6371.0;

    /**
     * Fórmula de Haversine para cálculo geodésico exacto
     * Compatible con coordenadas WGS84 para visualización 3D
     */
    public double calcularDistanciaHaversineKm(
            double lat1, double lon1, double lat2, double lon2) {
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return RADIO_TIERRA_KM * c;
    }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(haversineJavaCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0B1D1A] rounded-3xl shadow-2xl border border-[#183F36] overflow-hidden flex flex-col max-h-[90vh] text-stone-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#081715] text-white flex items-center justify-between border-b border-[#183F36]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#13322B] border border-[#34D399]/40 rounded-xl text-[#34D399]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Módulo Backend: Java Spring Boot 3 & Servicios Geográficos 3D
              </h3>
              <p className="text-xs text-emerald-300 font-mono">
                Código fuente completo generado en <code className="text-white bg-[#102B25] px-1.5 py-0.5 rounded border border-[#34D399]/20">/backend-java</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación técnica */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#183F36] bg-[#091C18] text-xs">
          {[
            { id: 'arquitectura', label: 'Estructura & Arquitectura', icon: Code2 },
            { id: 'endpoints', label: 'API REST Endpoints', icon: Terminal },
            { id: 'haversine', label: 'Algoritmo Haversine Java', icon: Server },
            { id: 'bd', label: 'Conexión BD Oficial (DGIS)', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#34D399] text-[#34D399] bg-[#0E2420]'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido según pestaña */}
        <div className="p-6 overflow-y-auto text-xs text-stone-300 space-y-4">
          {activeTab === 'arquitectura' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#0E2621] border border-[#1D4A40] rounded-xl text-stone-200">
                <h4 className="font-display font-bold text-sm text-[#34D399] mb-1">Microservicio Java Spring Boot Desacoplado</h4>
                <p className="leading-relaxed">
                  Arquitectura empresarial desacoplada lista para compilar con Maven y conectar con PostgreSQL / PostGIS para servir datos geoespaciales a la plataforma 3D.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-[#081715] rounded-xl border border-[#163830]">
                  <span className="font-bold text-white block mb-1">📁 Paquete Principal</span>
                  <span className="text-[#34D399]">com.salud.buscador</span>
                  <div className="mt-2 text-stone-400 space-y-1">
                    <div>• BuscadorUnidadesApplication.java</div>
                    <div>• controller/UnidadMedicaController.java</div>
                    <div>• service/UnidadMedicaService.java</div>
                    <div>• repository/UnidadMedicaRepository.java</div>
                  </div>
                </div>

                <div className="p-3 bg-[#081715] rounded-xl border border-[#163830]">
                  <span className="font-bold text-white block mb-1">📦 Modelos & Persistencia</span>
                  <div className="text-stone-400 space-y-1">
                    <div>• model/UnidadMedica.java (JPA Entity)</div>
                    <div>• dto/UnidadCercanaDto.java</div>
                    <div>• dto/FiltrosResponseDto.java</div>
                    <div>• resources/application.properties</div>
                    <div>• resources/data.sql (Catálogo DGIS)</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#05100E] text-stone-200 p-4 rounded-xl font-mono text-xs border border-white/5">
                <div className="text-stone-500 mb-2"># Para ejecutar el backend Java localmente:</div>
                <div className="text-[#34D399]">$ cd backend-java</div>
                <div className="text-[#34D399]">$ mvn clean spring-boot:run</div>
                <div className="text-stone-400 mt-2"># Servidor Spring Boot activo en http://localhost:8080</div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-3">
              <div className="overflow-x-auto border border-[#183F36] rounded-xl bg-[#081715]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0D2621] text-[11px] font-mono font-bold text-emerald-300 uppercase">
                    <tr>
                      <th className="p-3">Método</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Parámetros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#183F36] text-xs font-mono">
                    <tr>
                      <td className="p-3 font-bold text-[#34D399]">GET</td>
                      <td className="p-3 text-white">/api/unidades</td>
                      <td className="p-3 font-sans text-stone-300">Búsqueda flexible por texto y filtros</td>
                      <td className="p-3 text-stone-400 text-[11px]">buscar, institucion, tipo, entidad</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#34D399]">GET</td>
                      <td className="p-3 text-white">/api/unidades/{'{clues}'}</td>
                      <td className="p-3 font-sans text-stone-300">Detalle único de una unidad médica</td>
                      <td className="p-3 text-stone-400 text-[11px]">clues (String exacto)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#34D399]">GET</td>
                      <td className="p-3 text-white">/api/unidades/cercanas</td>
                      <td className="p-3 font-sans text-stone-300">Cálculo de proximidad GPS con Haversine</td>
                      <td className="p-3 text-stone-400 text-[11px]">latitud, longitud, limite, radioKm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#34D399]">GET</td>
                      <td className="p-3 text-white">/api/unidades/filtros</td>
                      <td className="p-3 font-sans text-stone-300">Opciones disponibles para selectores</td>
                      <td className="p-3 text-stone-400 text-[11px]">Ninguno</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'haversine' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-200">
                  Implementación real en Java (UnidadMedicaService.java):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#102B25] hover:bg-[#163830] text-[#34D399] rounded border border-[#34D399]/30 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar código'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#05100E] text-emerald-300 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed border border-white/5">
                {haversineJavaCode}
              </pre>
            </div>
          )}

          {activeTab === 'bd' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-[#0E2621] border border-[#1D4A40] rounded-xl text-stone-200">
                <h4 className="font-display font-bold text-sm text-[#34D399] mb-1">Conexión con el Padrón Oficial SINAIS / DGIS</h4>
                <p className="leading-relaxed">
                  El catálogo maestro de CLUES de la Dirección General de Información en Salud de México se almacena en PostgreSQL con extensiones espaciales PostGIS.
                </p>
              </div>

              <div className="p-4 bg-[#05100E] text-stone-200 rounded-xl font-mono text-xs space-y-2 border border-white/5">
                <div className="text-stone-500">-- Migración a PostgreSQL / PostGIS:</div>
                <div className="text-[#34D399]">CREATE DATABASE salud_clues_db ENCODING 'UTF8';</div>
                <div className="text-[#34D399]">CREATE EXTENSION IF NOT EXISTS postgis;</div>
                <div className="text-stone-500 mt-2">-- Importación masiva desde CSV DGIS:</div>
                <div className="text-amber-300">
                  \copy unidades_medicas (clues, nombre_unidad, tipo_unidad, institucion, ...) FROM 'catalogo_clues.csv' WITH CSV HEADER;
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#081715] border-t border-[#183F36] flex items-center justify-between font-mono">
          <span className="text-[11px] text-stone-400">
            Spring Boot 3.2.4 · Java 17 LTS · Hibernate Spatial
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#13322B] text-[#34D399] border border-[#34D399]/40 hover:bg-[#183F35] rounded-lg transition-colors cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
