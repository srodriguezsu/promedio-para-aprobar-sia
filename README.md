![Logo SIA UNAL Pro](https://raw.githubusercontent.com/srodriguezsu/sia-pro/refs/heads/master/public/icon.png)

# SIA UNAL Pro - Extensión de Navegador

## Objetivo del Proyecto

SIA UNAL Pro calcula automáticamente el promedio de cada asignatura de los estudiantes de la Universidad Nacional de Colombia (UNAL) mientras navegan por el sistema de calificaciones y estima la calificación mínima necesaria en las actividades pendientes para alcanzar un promedio final de 3.0, facilitando la planificación académica y la toma de decisiones.
También incorpora un rediseño de la historia académica, presentando de manera clara y organizada el avance del estudiante, las calificaciones por semestre y el progreso por componente curricular.

## Características Principales

### 📊 Cálculo Automático de Promedio & Simulador
- Calcula el promedio basado en las calificaciones y pesos de cada actividad académica.
- Permite simular y modificar calificaciones parciales futuras para ver cómo impactan el promedio final de la asignatura.
- Guarda automáticamente tus simulaciones de manera persistente.

### 🎯 Cálculo de Calificación Mínima Requerida
- Determina la calificación promedio necesaria en actividades pendientes para alcanzar la aprobación (nota de **3.0**).
- Asume que todas las actividades restantes reciben la misma calificación.
- Identifica si es matemáticamente posible pasar (muestra un indicador visual con 💀 si es imposible).

### 📅 Simulación de Horarios y Preinscripción
- Agrega asignaturas al planeador directamente desde la interfaz de "Asignaturas disponibles para cursar" del SIA con un botón "➕ Agregar al Horario".
- Selecciona diferentes grupos y profesores para cada materia preinscrita.
- Visualiza la distribución semanal de clases en un calendario visual e interactivo.
- Detección automática de conflictos de horario: si seleccionas grupos cuyas clases se cruzan, se resalta en el calendario y se muestra una advertencia.

### 📥 Exportación de Datos a CSV
- Descarga tu información en archivos CSV compatibles con Excel o Google Sheets.
- Opciones de exportación:
  - **Historia Académica**: Todo tu avance histórico agrupado por semestre.
  - **Calificaciones (GPA)**: Listado de notas parciales originales y simuladas.
  - **Horario simulado**: Detalle de las clases, salones, días y horas de los grupos elegidos.
- Incluye un diccionario de datos interactivo para entender la estructura de las columnas.

### 💾 Caché Persistente Local
- Almacena de forma segura tu historia académica, créditos y simulaciones en el almacenamiento local de tu navegador (`localStorage`).
- Evita tener que recargar o raspar los datos cada vez que entras a la extensión.

## Cómo Funciona

1. **Scraping automático**: La extensión detecta el contexto del SIA en el que te encuentras (Calificaciones, Historia Académica, Avance de Créditos o Preinscripción) y extrae de forma segura la información visible.
2. **Caché y persistencia**: Almacena los datos extraídos localmente para que estén disponibles de forma instantánea en cualquier pestaña o momento.
3. **Simulador de Horario**: En la interfaz de preinscripción, agrega materias y elige los grupos deseados. El simulador te alertará de cualquier cruce de horario antes de tu cita de inscripción.
4. **Exportación**: En la pestaña "Exportar", haz clic en los botones correspondientes para descargar tus archivos CSV.

## Estructura del Proyecto

```
/
├── dist/                      # Código compilado listo para cargar en Chrome
├── public/                    # Archivos estáticos y estilos
│   ├── css/
│   │   ├── avance.css         # Estilos del avance académico
│   │   ├── box.css            # Estilos del widget principal
│   │   ├── export.css         # Estilos del módulo de exportación
│   │   ├── horario.css        # Estilos del calendario y horario
│   │   └── required-grade.css # Estilos de calificación mínima requerida
│   ├── icon.png               # Logotipo
│   └── manifest.json          # Manifiesto de la extensión (MV3)
├── src/
│   ├── content/
│   │   └── index.js           # Script de contenido (punto de entrada)
│   ├── domain/
│   │   ├── gpaCalculator.js   # Lógica del promedio y notas requeridas
│   │   ├── historiaAcademica.js # Lógica de avance y proyecciones académicas
│   │   ├── historyManager.js  # Gestor de caché y almacenamiento local
│   │   └── scheduleManager.js # Gestor de asignaturas y cruces de horario
│   ├── scraper/
│   │   └── domScraper.js      # Extracción y parsing del DOM del SIA
│   ├── ui/
│   │   ├── historia_academica/
│   │   │   ├── asignaturasUI.js # Interfaz de asignaturas cursadas
│   │   │   ├── avanceUI.js      # Renderizado de gráficos de avance
│   │   │   └── creditosUI.js    # Interfaz de resumen de créditos
│   │   ├── exportUI.js        # Interfaz de exportación y diccionario CSV
│   │   ├── gpaUI.js           # Interfaz de simulador de promedio (GPA)
│   │   ├── horarioUI.js       # Interfaz del calendario semanal
│   │   └── originalUiInjector.js # Inyección de botones en el SIA original
│   └── utils/
│       └── selectors.js       # Selectores CSS del DOM del SIA
├── vite.config.js             # Configuración de empaquetado Vite
├── package.json               # Dependencias del proyecto
└── README.md                  # Este archivo
```

## Requisitos

- Navegador compatible con extensiones (Chrome, Brave, Edge, Opera, etc.)
- Acceso al SIA de la Universidad Nacional de Colombia (UNAL)

## Instalación

1. Clona o descarga este repositorio.
2. Instala las dependencias y compila el proyecto:
   ```bash
   npm install
   npm run build
   ```
3. Abre el gestor de extensiones de tu navegador (`chrome://extensions/`).
4. Activa el **"Modo de desarrollador"** (Developer mode) en la esquina superior derecha.
5. Haz clic en **"Cargar descomprimida"** (Load unpacked) y selecciona la carpeta `dist` generada.

### Empaquetar para producción

```bash
cd dist && zip -r ../sia-pro.zip . * && cd ..
```

## Uso

1. Inicia sesión en el portal del SIA UNAL.
2. La extensión inyectará un botón flotante flotante (widget) en la esquina inferior derecha.
3. Haz clic en el widget para abrir el panel con pestañas:
   - **PA**: Simulador de notas parciales de la materia seleccionada.
   - **Avance**: Gráfico de avance e historial agrupado.
   - **Créditos**: Progreso por componentes curricular (Fundamentación, Disciplinar, Libre Elección).
   - **Horario**: Tu planeador y calendario semanal.
   - **Exportar**: Descarga de reportes CSV y diccionario de datos.

## Licencia

Este proyecto es de uso libre para la comunidad estudiantil de la Universidad Nacional de Colombia.



