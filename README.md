# SIG-Terremotos Colombia - Backend API

Servidor backend desarrollado en **Node.js** con **TypeScript** y **Express** para el portal de geolocalización de sismos y gestión logística de damnificados. Almacena registros en **MongoDB Atlas** y se integra en tiempo real con la base de datos de la **USGS (United States Geological Survey)**.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu máquina local:
* **Node.js** (Versión 18 o superior recomendada)
* **npm** (Viene integrado con Node.js)
* **MongoDB** (Una cuenta en MongoDB Atlas o una base de datos local corriendo)

---

## ⚙️ Configuración del Entorno

El servidor maneja configuraciones dinámicas basadas en el entorno (`development` o `production`). Debes configurar los archivos de variables de entorno en la raíz del directorio `back_end/`.

Crea los archivos `.env.development` y `.env.production` según corresponda con el siguiente formato:

```env
PORT=4000
MONGO_URI=tu_cadena_de_conexion_mongodb_atlas
NODE_ENV=development
```

> ⚠️ **Importante**: Las variables de entorno están ignoradas en el archivo `.gitignore` para garantizar que no se expongan credenciales en repositorios públicos de GitHub.

---

## 🚀 Instalación y Ejecución

Sigue estos pasos para arrancar el backend localmente:

### 1. Instalar dependencias
Desde la carpeta `back_end/`, ejecuta:
```bash
npm install
```

### 2. Ejecutar en modo desarrollo (Hot Reload)
Arranca el servidor en modo desarrollo utilizando `nodemon` y `ts-node`:
```bash
npm run dev
```
El servidor levantará en el puerto configurado (ej: `http://localhost:4000`) y se reiniciará automáticamente ante cualquier cambio en el código fuente.

### 3. Compilar y ejecutar en producción
Para generar el bundle de producción y arrancar el servidor compilado:
```bash
# Compilar TypeScript a JavaScript (en la carpeta dist/)
npm run build

# Iniciar servidor en producción
npm start
```

---

## 🤖 Tareas Automatizadas

El backend incluye procesos en segundo plano autónomos:
1. **Sincronización al Bootear**: Al conectarse exitosamente a la base de datos, el servidor descarga y actualiza los sismos de los últimos 30 días en Colombia utilizando la API GeoJSON de la USGS.
2. **Sincronización Periódica**: Configura un intervalo de refresco de segundo plano cada **15 minutos** para capturar nuevos sismos de forma transparente.

---

## 🔌 Rutas del API (Endpoints)

El servidor expone los siguientes endpoints HTTP:

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/earthquakes` | Obtiene la lista completa de sismos con analíticas agregadas dinámicamente. |
| `POST` | `/api/earthquakes/sync` | Fuerza una sincronización inmediata con la USGS. |
| `POST` | `/api/earthquakes/seed` | Limpia las colecciones de la base de datos y carga datos históricos simulados de Colombia. |
| `GET` | `/api/reports` | Obtiene todos los reportes de damnificados registrados en el mapa. |
| `POST` | `/api/reports` | Crea un nuevo reporte ciudadano de afectados y necesidades de insumos. |
| `PATCH` | `/api/reports/:id/status` | Actualiza el estado de atención de un reporte (`pending`, `in_progress`, `resolved`). |
| `GET` | `/health` | Chequeo de estado de salud y entorno del servidor. |
