package com.salud.buscador.dto;

import com.salud.buscador.model.UnidadMedica;

/**
 * DTO que encapsula una Unidad Médica con la distancia geodésica calculada hacia el usuario.
 */
public class UnidadCercanaDto {

    private UnidadMedica unidad;
    private Double distanciaKm;
    private String distanciaFormateada;

    public UnidadCercanaDto() {}

    public UnidadCercanaDto(UnidadMedica unidad, Double distanciaKm) {
        this.unidad = unidad;
        this.distanciaKm = distanciaKm;
        this.distanciaFormateada = formatear(distanciaKm);
    }

    private String formatear(Double km) {
        if (km == null) return "";
        if (km < 1.0) {
            long metros = Math.round(km * 1000);
            return metros + " m";
        }
        return String.format(java.util.Locale.US, "%.1f km", km);
    }

    public UnidadMedica getUnidad() { return unidad; }
    public void setUnidad(UnidadMedica unidad) { this.unidad = unidad; }

    public Double getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(Double distanciaKm) {
        this.distanciaKm = distanciaKm;
        this.distanciaFormateada = formatear(distanciaKm);
    }

    public String getDistanciaFormateada() { return distanciaFormateada; }
    public void setDistanciaFormateada(String distanciaFormateada) { this.distanciaFormateada = distanciaFormateada; }
}
