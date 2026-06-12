# WorkHub Monterrey - SpotOn — Frontend
 
Plataforma de reservas de espacios de oficina y estacionamiento para empresas. Construida con **React + Vite**, combina gestión de recursos internos con gamificación y análisis impulsado por IA.
 
---
 
## Índice
 
- [Arquitectura](#arquitectura)
- [Módulos del sistema](#módulos-del-sistema)
- [Uso del sistema](#uso-del-sistema)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Dependencias clave](#dependencias-clave)
- [Enlaces clave](#enlaces-clave)
---
 
## Arquitectura
```
Browser (Employee / Admin / Guard)
      │
      │  Renders index.html → mounts React app
      ▼
┌─────────────────────────────────────┐
│  React + Vite                        │   src/main.jsx
│  Context global                      │
│  AuthContext · ThemeContext ·        │
│  UserContext                         │
└────────────────┬────────────────────┘
                 │  React Router DOM
        ┌────────┼─────────┐
        ▼        ▼         ▼
┌────────────┐ ┌──────────────┐ ┌──────────────┐
│  Employee  │ │    Admin     │ │    Guard     │
│  routes    │ │   routes     │ │   routes     │
│ PrivateRoute│ │ PrivateRoute │ │ PrivateRoute │
└─────┬──────┘ └──────┬───────┘ └──────┬───────┘
      │               │                │
      ▼               ▼                ▼
┌──────────┐  ┌──────────────┐  ┌────────────┐
│Sugerencias│  │AdminDashboard│  │ Guard View │
│Crear      │  │FloorEditor   │  │ (QR scan)  │
│Reservación│  │Gestión       │  └────────────┘
│Mis Reservas│ │Usuarios      │
│Mercado    │  │Perfil        │
│Perfil     │  └──────────────┘
└─────┬─────┘
      │
      ▼
┌─────────────────────────────────────┐
│  src/api  (fetch wrapper instances)  │
│  reservationsApi · authApi ·         │
│  suggestionsApi · marketApi          │
└──────┬─────────────┬────────────────┘
       │             │
       ▼             ▼
WorkHub Backend   WorkHub AI
(port 5500)       (port 8001)
REST API          FastAPI /suggest

```
## Estructura del proyecto
```
docs/
public/
scripts/
src/
├── api
├── assets/
|   ├── floors/
├── components/
├── context/
├── data/                
|   ├── floor-editor/
├── lib/
├── pages/
│   ├── adminDashboard/
│   ├── CrearReservacion/
│   ├── Error/
│   ├── FloorEditor/
|   ├── GuardView/
|   ├── LandingPage/
|   ├── ManageReservations
|   ├── Mercado
|   ├── Perfil
|   ├── SignInPage
|   ├── Sugerencias
│   └── UserLayout/
└── styles/
```
 
---
 
## Módulos del sistema
 
### Autenticación
Pantalla de login con validación de credenciales. El token JWT recibido se distribuye a través del contexto global para autorizar peticiones subsecuentes.
 
### Sugerencias IA
Vista que consume envia peticiones a la FastAPI que se interactua con el servidor MCP para mostrar recomendaciones personalizadas de espacios. El análisis considera historial de reservas, patrones de uso, y contexto de ruta (integración TomTom).
 
### Reservas
Dos formularios independientes:
- **Estacionamiento** — selección de fecha y horario con validación de disponibilidad en tiempo real y asignación automatica.
- **Oficina** — selección de piso, espacio y franja horaria a partir del mapa interactivo del edificio.
Vista de **Mis Reservas** con historial, estado (`activa`, `pendiente`, `pasada`) y opción de cancelación, modificacion dentro de cierto tiempo, check-in y check-out .
 
### Mercado (Gamificación)
Al completar reservas, el usuario acumula puntos canjeables en el mercado por:
- **Temas de plataforma** — cambia la paleta visual del sistema.
- **Banners de perfil** — personalización de la cabecera del perfil.
- **Fotos de perfil** — avatares exclusivos.
### Panel de administrador
 
| Sección | Función |
|---|---|
| **Dashboard de análisis** | Flujo de reservas por día de la semana, tasa de no-shows, ocupación por zona |
| **Reservas del día** | Vista operativa de qué espacios están activos en tiempo real |
| **Gestión de usuarios** | Alta, baja y modificación de empleados y administradores; vista de reservas por usuario |
| **Editor de mapas** | Herramienta visual tipo plano de concierto/cine para mapear pisos: el admin dibuja zonas y etiqueta espacios seleccionables |
 
---
 
## Uso del sistema
 
### Empleado

1. Inicia sesión con tus credenciales corporativas.
2. Revisa las **sugerencias personalizadas** generadas por IA en la pantalla principal.
3. Reserva un espacio desde el formulario de **Estacionamiento** u **Oficina**.
4. Consulta el estado de tus reservas en **Mis Reservas**.
5. Canjea tus puntos acumulados en el **Mercado**.
### Administrador
 
1. Accede al **Dashboard** para monitorear ocupación y patrones de la semana.
2. Gestiona usuarios desde **Administración de Usuarios** (crear, editar, eliminar).
3. Visualiza las reservas activas del día en tiempo real.
4. Cuando se agrega un nuevo piso, usa el **Editor de Mapas** para definir los espacios disponibles.

###Guardia

1. Escanea un codigo qr de una reservación de estacionamiento.
2. Inicia sesión con sus credenciales.
3. Visualiza los datos de la reserva de un empleado. 
---
 
## Variables de entorno
 
Crea un archivo `.env` en la raíz del proyecto:
 
```env
VITE_API_URL=https://tu-backend.com/api
VITE_AI_API_URL=https://tu-servidor-mcp.com
VITE_MAPS_API_KEY=AIza...
```
 
---
 
## Scripts disponibles
 
```bash
# Instalar dependencias
npm install
 
# Servidor de desarrollo
npm run dev
 
# Build de producción
npm run build
 
# Vista previa del build
npm run preview
```
 
---
 
## Dependencias clave
 
| Paquete | Uso |
|---|---|
| `react` + `vite` | Base del proyecto |
| `react-router-dom` | Navegación y rutas protegidas |
| `recharts` | Gráficas del dashboard de admin |
| `react-qr-code` | Creación de codigos QR |
| `socket.io-client` | Manejo de clientes de websocket |
| `@vis.gl/react-google-maps` | Creación de mapas y rutas de google maps |

---
 
## Enlaces clave
 
- **Repositorio Backend** → [github.com/Eldeibit97/WorkHub_Backend](https://github.com/Eldeibit97/WorkHub_Backend)
- **Repositorio MCP Server** → [github.com/Eldeibit97/WorkHub_Backend](https://github.com/Eldeibit97/WorkHub_AI)
- **TomTom Developer Portal** → [developer.tomtom.com](https://developer.tomtom.com)
