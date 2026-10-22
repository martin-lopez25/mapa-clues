package com.salud.buscador.controller;

import com.salud.buscador.dto.FiltrosResponseDto;
import com.salud.buscador.dto.UnidadCercanaDto;
import com.salud.buscador.model.UnidadMedica;
import com.salud.buscador.service.UnidadMedicaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para el buscador de Unidades Médicas
 * Rutas:
 *  GET /api/unidades?buscar=&institucion=&tipo=&entidad=
 *  GET /api/unidades/{clues}
 *  GET /api/unidades/cercanas?latitud=&longitud=&limite=&radioKm=
 *  GET /api/unidades/filtros
 */
@RestController
@RequestMapping("/api/unidades")
@CrossOrigin(origins = "*")
public class UnidadMedicaController {

    private final UnidadMedicaService service;

    public UnidadMedicaController(UnidadMedicaService service) {
        this.service = service;
    }

    /**
     * Búsqueda general por texto (CLUES, nombre, dirección, municipio, etc.)
     */
    @GetMapping
    public ResponseEntity<List<UnidadMedica>> buscarUnidades(
            @RequestParam(required = false) String buscar,
            @RequestParam(required = false) String institucion,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String entidad) {
        List<UnidadMedica> resultados = service.buscar(buscar, institucion, tipo, entidad);
        return ResponseEntity.ok(resultados);
    }

    /**
     * Consulta detallada de una unidad por su clave única CLUES
     */
    @GetMapping("/{clues}")
    public ResponseEntity<UnidadMedica> obtenerPorClues(@PathVariable String clues) {
        return service.obtenerPorClues(clues)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Búsqueda de proximidad geográfica mediante coordenadas GPS del usuario
     */
    @GetMapping("/cercanas")
    public ResponseEntity<?> obtenerUnidadesCercanas(
            @RequestParam Double latitud,
            @RequestParam Double longitud,
            @RequestParam(defaultValue = "15") Integer limite,
            @RequestParam(required = false) Double radioKm) {

        if (latitud == null || longitud == null || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
            return ResponseEntity.badRequest().body("Coordenadas GPS no válidas. Latitud [-90, 90], Longitud [-180, 180].");
        }

        List<UnidadCercanaDto> cercanas = service.encontrarMasCercanas(latitud, longitud, limite, radioKm);
        return ResponseEntity.ok(cercanas);
    }

    /**
     * Opciones de filtrado disponibles
     */
    @GetMapping("/filtros")
    public ResponseEntity<FiltrosResponseDto> obtenerFiltros() {
        return ResponseEntity.ok(service.obtenerFiltrosDisponibles());
    }
}
