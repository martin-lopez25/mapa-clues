package com.salud.buscador.dto;

import java.util.List;

/**
 * DTO que expone los filtros disponibles en la base de datos (Entidades, Instituciones, Tipos).
 */
public class FiltrosResponseDto {

    private List<String> entidades;
    private List<String> instituciones;
    private List<String> tiposUnidad;

    public FiltrosResponseDto() {}

    public FiltrosResponseDto(List<String> entidades, List<String> instituciones, List<String> tiposUnidad) {
        this.entidades = entidades;
        this.instituciones = instituciones;
        this.tiposUnidad = tiposUnidad;
    }

    public List<String> getEntidades() { return entidades; }
    public void setEntidades(List<String> entidades) { this.entidades = entidades; }

    public List<String> getInstituciones() { return instituciones; }
    public void setInstituciones(List<String> instituciones) { this.instituciones = instituciones; }

    public List<String> getTiposUnidad() { return tiposUnidad; }
    public void setTiposUnidad(List<String> tiposUnidad) { this.tiposUnidad = tiposUnidad; }
}
