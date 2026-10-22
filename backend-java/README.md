# Backend Java Spring Boot - Buscador Geográfico de Unidades Médicas

Módulo de servicios geográficos y API REST desarrollado con **Java 17**, **Spring Boot 3.2+**, **Spring Data JPA** y cálculo geodésico de distancias con la **fórmula de Haversine**.

---

## 1. Requisitos previos

* Java Development Kit (JDK) 17 o superior.
* Apache Maven 3.8+ (o el wrapper `./mvnw` incluido).
* (Opcional) PostgreSQL 14+ con extensión PostGIS para grandes volúmenes de datos nacionales.

---

## 2. Instrucciones para ejecutar localmente

### Opción A: Ejecución directa con Maven (H2 en memoria precargada)
Por defecto, la aplicación utiliza una base de datos en memoria H2 configurada en `src/main/resources/application.properties` y carga automáticamente el catálogo inicial verificado de unidades médicas en `src/main/resources/data.sql`.

```bash
cd backend-java
mvn clean spring-boot:run
```

El servidor iniciará en el puerto `8080`.
Consola interactiva H2: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:saluddb`, Usuario: `sa`, Contraseña en blanco).

### Opción B: Construcción de paquete JAR ejecutable
```bash
mvn clean package -DskipTests
java -jar target/buscador-unidades-medicas-1.0.0.jar
```

---

## 3. Conexión con la Base de Datos Oficial de la Secretaría de Salud (DGIS / SINAIS)

El catálogo oficial de CLUES de México se publica periódicamente por la Dirección General de Información en Salud (DGIS) a través de datos abiertos del Gobierno de México (`datos.gob.mx` / `dgis.salud.gob.mx`).

### Pasos para conectar la base de datos oficial en PostgreSQL:
1. Crear la base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE salud_clues_db ENCODING 'UTF8';
   ```
2. Modificar `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/salud_clues_db
   spring.datasource.username=postgres
   spring.datasource.password=tu_password_seguro
   spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
   spring.jpa.hibernate.ddl-auto=update
   ```
3. Importar el archivo CSV oficial descargado de DGIS:
   ```sql
   COPY unidades_medicas (clues, nombre_unidad, tipo_unidad, institucion, nivel_atencion, direccion, localidad, municipio, entidad, codigo_postal, latitud, longitud, telefono, horario, estatus_operacion)
   FROM '/ruta/al/catalogo_clues_oficial.csv'
   WITH (FORMAT csv, HEADER true, DELIMITER ',');
   ```

---

## 4. Endpoints de la API REST

### A. Búsqueda de Unidades Médicas
* **Ruta:** `GET /api/unidades`
* **Parámetros de consulta:**
  * `buscar` (string, opcional): Búsqueda por CLUES parcial o exacta, nombre, dirección, municipio, código postal o entidad.
  * `institucion` (string, opcional): Filtrar por IMSS, ISSSTE, SSA / IMSS-BIENESTAR, PEMEX, SEDENA, etc.
  * `tipo` (string, opcional): Filtrar por tipo de unidad (Hospital General, Centro de Salud, UMF, etc.).
  * `entidad` (string, opcional): Filtrar por entidad federativa.
* **Ejemplo:**
  ```http
  GET /api/unidades?buscar=Hospital+General&entidad=Ciudad+de+M%C3%A9xico
  ```

### B. Detalle por Clave CLUES
* **Ruta:** `GET /api/unidades/{clues}`
* **Ejemplo:**
  ```http
  GET /api/unidades/QRIMB000025
  ```

### C. Unidades Más Cercanas (Geolocalización GPS)
* **Ruta:** `GET /api/unidades/cercanas`
* **Parámetros:**
  * `latitud` (double, obligatorio): Coordenada GPS latitud del usuario.
  * `longitud` (double, obligatorio): Coordenada GPS longitud del usuario.
  * `limite` (int, opcional, por defecto 15): Cantidad máxima de unidades a devolver.
  * `radioKm` (double, opcional): Radio máximo en kilómetros (ej. 1, 5, 10, 25).
* **Ejemplo:**
  ```http
  GET /api/unidades/cercanas?latitud=19.4128&longitud=-99.1517&limite=10&radioKm=5.0
  ```
* **Cálculo:** Implementado en `UnidadMedicaService.java` mediante la fórmula geodésica de Haversine con un radio medio terrestre de $R = 6371\text{ km}$. Solo se calculan distancias para registros que disponen de coordenadas válidas confirmadas.

### D. Catálogo de Filtros Disponibles
* **Ruta:** `GET /api/unidades/filtros`
* Retorna las listas únicas de entidades, instituciones y tipos de unidad para poblar selectores de la interfaz gráfica.

---

## 5. Reglas de Negocio Implementadas

1. **Inalterabilidad de la CLUES:** La CLUES se almacena como `VARCHAR(30)` estricto para evitar pérdidas de ceros iniciales o truncamientos.
2. **Tratamiento de coordenadas nulas:** Si una unidad no tiene coordenadas validadas en el padrón, `latitud` y `longitud` son `null`. Sigue apareciendo en búsquedas de texto y por entidad, pero se excluye de cálculos de distancia GPS erróneos y no se grafica en el mapa con coordenadas ficticias (0,0).
3. **Manejo de errores:** Validación de rangos geográficos `[-90, 90]` y `[-180, 180]` con respuestas HTTP `400 Bad Request` en caso de anomalías.
