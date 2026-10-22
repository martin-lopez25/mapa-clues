package com.salud.buscador.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Entidad JPA representativa de una Unidad Médica en el catálogo oficial (DGIS).
 * La CLUES es tratada estrictamente como String para preservar ceros iniciales y caracteres alfanuméricos.
 */
@Entity
@Table(name = "unidades_medicas", indexes = {
    @Index(name = "idx_unidad_clues", columnList = "clues"),
    @Index(name = "idx_unidad_municipio", columnList = "municipio"),
    @Index(name = "idx_unidad_entidad", columnList = "entidad")
})
public class UnidadMedica {

    @Id
    @Column(name = "clues", length = 30, nullable = false, unique = true)
    @NotBlank(message = "La CLUES es obligatoria y debe ser una cadena alfanumérica")
    private String clues;

    @Column(name = "nombre_unidad", length = 255, nullable = false)
    @NotBlank(message = "El nombre de la unidad médica es obligatorio")
    private String nombreUnidad;

    @Column(name = "tipo_unidad", length = 120)
    private String tipoUnidad;

    @Column(name = "institucion", length = 80)
    private String institucion;

    @Column(name = "nivel_atencion", length = 60)
    private String nivelAtencion;

    @Column(name = "direccion", length = 500)
    private String direccion;

    @Column(name = "localidad", length = 150)
    private String localidad;

    @Column(name = "municipio", length = 150)
    private String municipio;

    @Column(name = "entidad", length = 100)
    private String entidad;

    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    // Coordenadas geográficas reales en grados decimales (pueden ser nulas)
    @Column(name = "latitud")
    private Double latitud;

    @Column(name = "longitud")
    private Double longitud;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "horario", length = 150)
    private String horario;

    @Column(name = "estatus_operacion", length = 100)
    private String estatusOperacion;

    public UnidadMedica() {}

    public UnidadMedica(String clues, String nombreUnidad, String tipoUnidad, String institucion,
                        String nivelAtencion, String direccion, String localidad, String municipio,
                        String entidad, String codigoPostal, Double latitud, Double longitud,
                        String telefono, String horario, String estatusOperacion) {
        this.clues = clues;
        this.nombreUnidad = nombreUnidad;
        this.tipoUnidad = tipoUnidad;
        this.institucion = institucion;
        this.nivelAtencion = nivelAtencion;
        this.direccion = direccion;
        this.localidad = localidad;
        this.municipio = municipio;
        this.entidad = entidad;
        this.codigoPostal = codigoPostal;
        this.latitud = latitud;
        this.longitud = longitud;
        this.telefono = telefono;
        this.horario = horario;
        this.estatusOperacion = estatusOperacion;
    }

    /**
     * Valida si la unidad cuenta con coordenadas geográficas decimales válidas
     */
    public boolean tieneCoordenadasValidas() {
        return latitud != null && longitud != null &&
               latitud >= -90.0 && latitud <= 90.0 &&
               longitud >= -180.0 && longitud <= 180.0;
    }

    // Getters y Setters explícitos para no depender forzosamente de Lombok en tiempo de compilación
    public String getClues() { return clues; }
    public void setClues(String clues) { this.clues = clues; }

    public String getNombreUnidad() { return nombreUnidad; }
    public void setNombreUnidad(String nombreUnidad) { this.nombreUnidad = nombreUnidad; }

    public String getTipoUnidad() { return tipoUnidad; }
    public void setTipoUnidad(String tipoUnidad) { this.tipoUnidad = tipoUnidad; }

    public String getInstitucion() { return institucion; }
    public void setInstitucion(String institucion) { this.institucion = institucion; }

    public String getNivelAtencion() { return nivelAtencion; }
    public void setNivelAtencion(String nivelAtencion) { this.nivelAtencion = nivelAtencion; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getLocalidad() { return localidad; }
    public void setLocalidad(String localidad) { this.localidad = localidad; }

    public String getMunicipio() { return municipio; }
    public void setMunicipio(String municipio) { this.municipio = municipio; }

    public String getEntidad() { return entidad; }
    public void setEntidad(String entidad) { this.entidad = entidad; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }

    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public String getEstatusOperacion() { return estatusOperacion; }
    public void setEstatusOperacion(String estatusOperacion) { this.estatusOperacion = estatusOperacion; }
}
