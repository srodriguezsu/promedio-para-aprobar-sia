# Promedio Para Aprobar (SIA UNAL) - Extensión de Navegador

## Objetivo del Proyecto

Esta extensión de navegador calcula automáticamente el **promedio ponderado** de cada asignatura de estudiantes de la Universidad Nacional de Colombia (UNAL) en tiempo real mientras navegan por el sistema de calificaciones.

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
2. Extrae las calificaciones, porcentajes y descripciones
3. Calcula el promedio actual con las actividades gradeadas
4. Muestra las calificaciones mínimas requeridas para las actividades pendientes

## Estructura del Proyecto

```
/
├── content.js        # Lógica principal de cálculo y DOM manipulation
├── styles.css        # Estilos de la interfaz de usuario
├── manifest.json     # Configuración de la extensión
└── README.md         # Este archivo
```

## Requisitos

- Navegador compatible con extensiones (Chrome, Firefox, Edge, etc.)
- Acceso al SIA de la UNAL

## Instalación

1. Clona o descarga este repositorio
2. Abre el gestor de extensiones de tu navegador
3. Activa el "Modo de desarrollador"
4. Carga la carpeta del proyecto como extensión no empaquetada

## Uso

1. Navega a la página de calificaciones de UNAL
2. La extensión se activará automáticamente después de 2 segundos
3. Verás una caja flotante con tu promedio calculado
4. Presiona el botón **🔄 Calcular** para actualizar los valores en cualquier momento


## Licencia

Este proyecto es de uso libre para estudiantes de UNAL.


