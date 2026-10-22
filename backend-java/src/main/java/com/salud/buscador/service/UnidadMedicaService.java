package com.salud.buscador.service;

import com.salud.buscador.dto.FiltrosResponseDto;
import com.salud.buscador.dto.UnidadCercanaDto;
import com.salud.buscador.model.UnidadMedica;
import com.salud.buscador.repository.UnidadMedicaRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio de lógica de negocio y cálculo geográfico
 */
@Service
public class UnidadMedicaService {

    private static final double RADIO_TIERRA_KM = 6371.0;

    private final UnidadMedicaRepository repository;

    public UnidadMedicaService(UnidadMedicaRepository repository) {
        this.repository = repository;
    }

    /**
     * Búsqueda flexible con filtros y paginación
     */
    public List<UnidadMedica> buscar(String termino, String institucion, String tipo, String entidad) {
        List<UnidadMedica> base;
        if (termino != null && !termino.trim().isEmpty()) {
            base = repository.buscarPorTexto(termino.trim());
        } else {
            base = repository.findAll();
        }

        return base.stream()
                .filter(u -> institucion == null || institucion.isEmpty() || institucion.equalsIgnoreCase(u.getInstitucion()))
                .filter(u -> tipo == null || tipo.isEmpty() || tipo.equalsIgnoreCase(u.getTipoUnidad()))
                .filter(u -> entidad == null || entidad.isEmpty() || entidad.equalsIgnoreCase(u.getEntidad()))
                .collect(Collectors.toList());
    }

    /**
     * Búsqueda por clave CLUES exacta
     */
    public Optional<UnidadMedica> obtenerPorClues(String clues) {
        if (clues == null) return Optional.empty();
        return repository.findById(clues.trim().toUpperCase());
    }

    /**
     * Cálculo geográfico de unidades más cercanas usando la fórmula de Haversine
     * Solo evalúa unidades con coordenadas válidas conocidas.
     */
    public List<UnidadCercanaDto> encontrarMasCercanas(double latitudUsuario, double longitudUsuario, int limite, Double radioMaxKm) {
        List<UnidadMedica> unidadesConGps = repository.findConCoordenadasValidas();

        return unidadesConGps.stream()
                .filter(UnidadMedica::tieneCoordenadasValidas)
                .map(u -> {
                    double dist = calcularHaversineKm(latitudUsuario, longitudUsuario, u.getLatitud(), u.getLongitud());
                    return new UnidadCercanaDto(u, dist);
                })
                .filter(dto -> radioMaxKm == null || radioMaxKm <= 0 || dto.getDistanciaKm() <= radioMaxKm)
                .sorted(Comparator.comparingDouble(UnidadCercanaDto::getDistanciaKm))
                .limit(limite > 0 ? limite : 15)
                .collect(Collectors.toList());
    }

    /**
     * Fórmula de Haversine para obtener distancia geodésica en kilómetros
     */
    public double calcularHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return RADIO_TIERRA_KM * c;
    }

    /**
     * Obtiene listas de valores únicos para los filtros de la interfaz
     */
    public FiltrosResponseDto obtenerFiltrosDisponibles() {
        return new FiltrosResponseDto(
                repository.findDistinctEntidades(),
                repository.findDistinctInstituciones(),
                repository.findDistinctTiposUnidad()
        );
    }
}
