# SIA UNAL Pro - Extensión de Navegador

## Objetivo del Proyecto

SIA UNAL Pro calcula automáticamente el **promedio de cada asignatura** de estudiantes de la Universidad Nacional de Colombia (UNAL) en tiempo real mientras navegan por el sistema de calificaciones.

## Características Principales

### 📊 Cálculo Automático de Promedio
- Calcula el promedio basado en las calificaciones y pesos de cada actividad académica
- Solo considera actividades con calificación y porcentaje definidos
- Suma ponderada de todas las notas obtenidas

### 🎯 Cálculo de Calificación Mínima Requerida
- Determina la calificación mínima necesaria en actividades pendientes para alcanzar un promedio de **3.0**
- Asume que todas las actividades restantes reciben la misma calificación
- Identifica si es posible pasar o no (marca con 💀 si no es posible)

### 🔄 Botón de Actualización
- Permite recalcular el promedio en cualquier momento
- Actualiza dinámicamente todos los valores sin recargar la página

### 📌 Interfaz Limpia y Minimalista
- Caja flotante fija en la esquina superior derecha
- Tema oscuro para mejor legibilidad
- Diseño responsivo y no invasivo

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
│   │   └── gpaCalculator.js     # Lógica pura de GPA (sin DOM)
│   ├── ui/
│   │   └── gpaUI.js             # Manipulación de DOM
│   └── utils/
│       └── selectors.js         # Selectores y constantes
├── styles.css                   # Importa estilos modulares
├── manifest.json                # Configuración de la extensión (MV3)
└── README.md                    # Este archivo
```

## Requisitos

- Navegador compatible con extensiones (Chrome, Edge, etc.)
- Acceso al SIA de la UNAL

## Instalación

1. Clona o descarga este repositorio
2. Abre el gestor de extensiones de tu navegador
3. Activa el "Modo de desarrollador"
4. Carga la carpeta del proyecto como extensión no empaquetada

## Uso

1. Navega a la página de calificaciones de UNAL
2. La extensión se activará automáticamente cuando la página esté lista
3. Verás una caja flotante con tu promedio calculado
4. Presiona el botón **🔄 Calcular** para actualizar los valores en cualquier momento

## Arquitectura

- **domain/** contiene solo lógica pura (sin DOM)
- **ui/** contiene solo manipulación de DOM
- **content/index.js** orquesta el flujo y usa un `MutationObserver` para inicializar de forma segura
- Se usan **ES Modules** compatibles con Manifest V3


## Licencia

Este proyecto es de uso libre para estudiantes de UNAL.


