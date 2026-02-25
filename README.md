![Logo SIA UNAL Pro](https://raw.githubusercontent.com/srodriguezsu/sia-pro/refs/heads/master/icon512.png)

# SIA UNAL Pro - Extensión de Navegador

## Objetivo del Proyecto

SIA UNAL Pro calcula automáticamente el promedio de cada asignatura de los estudiantes de la Universidad Nacional de Colombia (UNAL) mientras navegan por el sistema de calificaciones y estima la calificación mínima necesaria en las actividades pendientes para alcanzar un promedio final de 3.0, facilitando la planificación académica y la toma de decisiones.
También incorpora un rediseño de la historia académica, presentando de manera clara y organizada el avance del estudiante, las calificaciones por semestre y el progreso por componente curricular.

## Características Principales

### 📊 Cálculo Automático de Promedio
- Calcula el promedio basado en las calificaciones y pesos de cada actividad académica
- Solo considera actividades con calificación y porcentaje definidos
- Suma ponderada de todas las notas obtenidas

### 🎯 Cálculo de Calificación Mínima Requerida
- Determina la calificación mínima necesaria en actividades pendientes para alcanzar un promedio de **3.0**
- Asume que todas las actividades restantes reciben la misma calificación
- Identifica si es posible pasar o no (marca con 💀 si no es posible)

## Cómo Funciona

1. La extensión detecta automáticamente las actividades académicas en la página
2. Extrae calificaciones, porcentajes y descripciones
3. Calcula el promedio actual con las actividades calificadas
4. Muestra las calificaciones mínimas requeridas para las actividades pendientes

## Estructura del Proyecto

```
/
├── css/
│   ├── box.css                 # Estilos del widget principal
│   └── required-grade.css      # Estilos de calificación requerida
├── src/
│   ├── content/
│   │   └── index.js             # Entry point (content script)
│   ├── domain/
│   │   └── gpaCalculator.js     # Extracción de datos y lógica de cálculo
│   └── ui/
│        └── gpaUI.js             # Manipulación de DOM, renderizado de los modulos
├── manifest.json                # Configuración de la extensión
└── README.md                    # Este archivo
```

## Requisitos

- Navegador compatible con extensiones (Chrome, Edge, etc.)
- Acceso al SIA de la UNAL

## Instalación

1. Clona o descarga este repositorio
2. Abre el gestor de extensiones de tu navegador
3. Activa el "Modo de desarrollador"
4. Ejectua ```npx vite build```
5. Carga la carpeta dist como extensión no empaquetada

## Uso

1. Navega a la página de calificaciones de UNAL
2. La extensión se activará automáticamente cuando la página esté lista
3. Verás una caja flotante en la parte inferior derecha
4. En la caja encontrarás los distintos módulos disponibles


## Licencia

Este proyecto es de uso libre para estudiantes de UNAL.


