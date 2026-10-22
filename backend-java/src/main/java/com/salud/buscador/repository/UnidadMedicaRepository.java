package com.salud.buscador.repository;

import com.salud.buscador.model.UnidadMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio Spring Data JPA para la entidad UnidadMedica
 */
@Repository
public interface UnidadMedicaRepository extends JpaRepository<UnidadMedica, String> {

    /**
     * Búsqueda integral por texto en CLUES, Nombre, Dirección, Municipio o Entidad
     */
    @Query("SELECT u FROM UnidadMedica u WHERE " +
           "LOWER(u.clues) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.nombreUnidad) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.direccion) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.municipio) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.localidad) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.codigoPostal) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.entidad) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<UnidadMedica> buscarPorTexto(@Param("query") String query);

    /**
     * Obtiene solo las unidades que poseen coordenadas geográficas válidas para cálculo geodésico
     */
    @Query("SELECT u FROM UnidadMedica u WHERE u.latitud IS NOT NULL AND u.longitud IS NOT NULL")
    List<UnidadMedica> findConCoordenadasValidas();

    @Query("SELECT DISTINCT u.entidad FROM UnidadMedica u WHERE u.entidad IS NOT NULL ORDER BY u.entidad ASC")
    List<String> findDistinctEntidades();

    @Query("SELECT DISTINCT u.institucion FROM UnidadMedica u WHERE u.institucion IS NOT NULL ORDER BY u.institucion ASC")
    List<String> findDistinctInstituciones();

    @Query("SELECT DISTINCT u.tipoUnidad FROM UnidadMedica u WHERE u.tipoUnidad IS NOT NULL ORDER BY u.tipoUnidad ASC")
    List<String> findDistinctTiposUnidad();
}
