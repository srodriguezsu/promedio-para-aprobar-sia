import {
    loadCachedAsignaturas,
    loadAllGpaCachedSubjects,
    loadAllGpaSimulations,
    clearAllExtensionData
} from "../domain/historyManager.js";
import {
    loadSelectedSubjects,
    loadSelectedGroups
} from "../domain/scheduleManager.js";
import { renderGpa } from "./gpaUI.js";
import { renderHistoriaAcademica } from "./historia_academica/asignaturasUI.js";
import { renderCreditosProgress } from "./historia_academica/creditosUI.js";
import { renderAvanceProgress } from "./historia_academica/avanceUI.js";
import { renderHorario } from "./horarioUI.js";


/**
 * Converts headers and row arrays into a UTF-8 compatible CSV string with a BOM.
 * 
 * @param {Array.<string>} headers - CSV column names.
 * @param {Array.<Array.<*>>} rows - Two-dimensional array of row values.
 * @returns {string} The CSV formatted string.
 */
function convertToCSV(headers, rows) {
    const csvRows = [];
    // Format headers with quotes
    csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(","));

    // Format data rows
    rows.forEach(row => {
        csvRows.push(row.map(value => {
            const strVal = value === null || value === undefined ? "" : String(value);
            return `"${strVal.replace(/"/g, '""')}"`;
        }).join(","));
    });

    // Excel friendly UTF-8 prefix (BOM)
    return "\uFEFF" + csvRows.join("\n");
}

/**
 * Prompts the browser to download a text blob as a file.
 * 
 * @param {string} content - File content.
 * @param {string} filename - Target file name.
 * @param {string} contentType - MIME type of the file.
 * @returns {void}
 */
function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Renders the Export Data view and interactive Data Dictionary inside the modal tab.
 * 
 * @param {HTMLElement} container - The container element to render inside.
 * @returns {void}
 */
export function renderExportTab(container) {
    if (!container) return;
    container.innerHTML = "";

    // Load active cached data
    const asignaturasCached = loadCachedAsignaturas();
    const gpaCached = loadAllGpaCachedSubjects();
    const gpaSims = loadAllGpaSimulations();
    const scheduleSubjects = loadSelectedSubjects();
    const scheduleSelections = loadSelectedGroups();

    // Calculate item counts for display states
    let historiaCount = 0;
    if (asignaturasCached) {
        Object.keys(asignaturasCached).forEach(semestre => {
            historiaCount += asignaturasCached[semestre].asignaturas.length;
        });
    }

    const gpaCount = Object.keys(gpaCached).length;
    const scheduleCount = scheduleSubjects.length;

    // Outer container
    const exportDiv = document.createElement("div");
    exportDiv.className = "sia-export-container";

    exportDiv.innerHTML = `
        <h2 class="sia-export-title">📥 Exportar Datos en CSV</h2>
        <p style="font-size:14px;color:#475569;margin-bottom:24px;">
            Descarga la información académica que has acumulado y raspado del SIA en formato CSV (compatible con Excel y Google Sheets).
        </p>

        <div class="sia-export-grid">
            <!-- Historia Académica Card -->
            <div class="sia-export-card">
                <div>
                    <div class="sia-export-card-title">📖 Historia Académica</div>
                    <div class="sia-export-card-desc">
                        Asignaturas cursadas históricamente, agrupadas por semestres con sus respectivos créditos, calificaciones finales y tipologías.
                    </div>
                </div>
                <div>
                    ${historiaCount === 0 ? `
                        <div class="sia-export-alert warning">
                            <span>⚠️ No hay datos guardados. Visita la sección <b>Historia académica</b> en el SIA para extraerla automáticamente.</span>
                        </div>
                    ` : `
                        <p style="font-size:12px;color:#0f6d59;font-weight:600;margin-bottom:12px;">✓ ${historiaCount} asignaturas encontradas en caché</p>
                    `}
                    <button id="btn-export-historia" class="sia-export-btn" ${historiaCount === 0 ? "disabled" : ""}>
                        Descargar Historia Académica
                    </button>
                </div>
            </div>

            <!-- Calificaciones Parciales Card -->
            <div class="sia-export-card">
                <div>
                    <div class="sia-export-card-title">📊 Calificaciones Parciales</div>
                    <div class="sia-export-card-desc">
                        Desglose de notas parciales de asignaturas activas (evaluaciones y porcentajes), incluyendo tus calificaciones reales y las simulaciones del promedio.
                    </div>
                </div>
                <div>
                    ${gpaCount === 0 ? `
                        <div class="sia-export-alert warning">
                            <span>⚠️ No hay calificaciones en caché. Visita <b>Mis calificaciones</b> y abre asignaturas para guardarlas.</span>
                        </div>
                    ` : `
                        <p style="font-size:12px;color:#0f6d59;font-weight:600;margin-bottom:12px;">✓ ${gpaCount} asignaturas encontradas en caché</p>
                    `}
                    <button id="btn-export-gpa" class="sia-export-btn" ${gpaCount === 0 ? "disabled" : ""}>
                        Descargar Calificaciones Parciales
                    </button>
                </div>
            </div>

            <!-- Horario Seleccionado Card -->
            <div class="sia-export-card">
                <div>
                    <div class="sia-export-card-title">🗓️ Horario & Preinscripción</div>
                    <div class="sia-export-card-desc">
                        Asignaturas seleccionadas en tu horario propuesto, detallando grupos, profesores, aulas y rangos de horarios en días de clase.
                    </div>
                </div>
                <div>
                    ${scheduleCount === 0 ? `
                        <div class="sia-export-alert warning">
                            <span>⚠️ No has agregado asignaturas al horario. Busca una disponible en el SIA y haz clic en "Agregar al horario".</span>
                        </div>
                    ` : `
                        <p style="font-size:12px;color:#0f6d59;font-weight:600;margin-bottom:12px;">✓ ${scheduleCount} asignaturas en el horario</p>
                    `}
                    <button id="btn-export-horario" class="sia-export-btn" ${scheduleCount === 0 ? "disabled" : ""}>
                        Descargar Horario Proyectado
                    </button>
                </div>
            </div>

            <!-- Limpiar Caché Card -->
            <div class="sia-export-card">
                <div>
                    <div class="sia-export-card-title">🗑️ Limpiar Caché y Datos</div>
                    <div class="sia-export-card-desc">
                        Borra toda la información guardada localmente por la extensión (historial, notas parciales, simulaciones y horario seleccionado).
                    </div>
                </div>
                <div>
                    ${(historiaCount === 0 && gpaCount === 0 && scheduleCount === 0) ? `
                        <div class="sia-export-alert success">
                            <span>✓ El almacenamiento local de la extensión está limpio.</span>
                        </div>
                    ` : `
                        <p style="font-size:12px;color:#b45309;font-weight:600;margin-bottom:12px;">⚠️ Hay datos guardados en caché local</p>
                    `}
                    <button id="btn-clear-cache" class="sia-export-btn danger" ${(historiaCount === 0 && gpaCount === 0 && scheduleCount === 0) ? "disabled" : ""}>
                        Limpiar Datos Guardados
                    </button>
                </div>
            </div>
        </div>

        <!-- Data Dictionary Section -->
        <div class="sia-dict-section">
            <div class="sia-dict-title">📘 Diccionario de Datos</div>
            <p style="font-size:13px;color:#64748b;margin-bottom:16px;">
                Selecciona una pestaña para ver el significado y tipo de dato de las columnas incluidas en cada uno de los archivos CSV descargados.
            </p>
            <div class="sia-dict-tabs">
                <button class="sia-dict-tab-btn active" data-dict="historia">Historia Académica</button>
                <button class="sia-dict-tab-btn" data-dict="gpa">Calificaciones Parciales</button>
                <button class="sia-dict-tab-btn" data-dict="horario">Horario & Preinscripción</button>
            </div>
            <div class="sia-dict-table-container">
                <table id="sia-dict-table-el" class="sia-dict-table">
                    <!-- Rendered dynamically -->
                </table>
            </div>
        </div>
    `;

    container.appendChild(exportDiv);

    // Bind exports
    const btnHistoria = exportDiv.querySelector("#btn-export-historia");
    if (btnHistoria) {
        btnHistoria.addEventListener("click", () => {
            const headers = ["Semestre", "Asignatura", "Créditos", "Tipología", "Calificación", "Estado"];
            const rows = [];
            if (asignaturasCached) {
                Object.keys(asignaturasCached).forEach(semestre => {
                    const list = asignaturasCached[semestre].asignaturas;
                    list.forEach(asig => {
                        rows.push([
                            semestre,
                            asig.nombre || "",
                            asig.creditos || "",
                            asig.componente || "",
                            asig.calificacion || "",
                            asig.estado || ""
                        ]);
                    });
                });
            }
            const csv = convertToCSV(headers, rows);
            downloadBlob(csv, "sia_pro_historia_academica.csv", "text/csv;charset=utf-8;");
        });
    }

    const btnGpa = exportDiv.querySelector("#btn-export-gpa");
    if (btnGpa) {
        btnGpa.addEventListener("click", () => {
            const headers = ["Asignatura", "Actividad", "Porcentaje", "Calificación Original", "Calificación Simulada"];
            const rows = [];
            Object.keys(gpaCached).forEach(subjectName => {
                const activities = gpaCached[subjectName];
                const subjSims = gpaSims[subjectName] || {};
                activities.forEach(act => {
                    const simGrade = subjSims[act.description];
                    rows.push([
                        subjectName,
                        act.description,
                        act.percentage !== undefined ? `${(act.percentage * 100).toFixed(1)}%` : "",
                        Number.isFinite(act.grade) ? act.grade.toFixed(2) : "",
                        simGrade !== undefined ? Number(simGrade).toFixed(2) : (Number.isFinite(act.grade) ? act.grade.toFixed(2) : "")
                    ]);
                });
            });
            const csv = convertToCSV(headers, rows);
            downloadBlob(csv, "sia_pro_calificaciones.csv", "text/csv;charset=utf-8;");
        });
    }

    const btnHorario = exportDiv.querySelector("#btn-export-horario");
    if (btnHorario) {
        btnHorario.addEventListener("click", () => {
            const headers = ["Asignatura", "Tipología", "Créditos", "Grupo", "Profesor", "Día", "Hora Inicio", "Hora Fin", "Aula"];
            const rows = [];
            scheduleSubjects.forEach(subj => {
                const selectedGroupName = scheduleSelections[subj.name];
                const group = subj.groups?.find(g => g.name === selectedGroupName);
                if (group) {
                    const schedules = group.horarios || [];
                    if (schedules.length === 0) {
                        rows.push([
                            subj.name,
                            subj.tipologia || "",
                            subj.creditos || "",
                            group.name,
                            group.profesor || "",
                            "", "", "", ""
                        ]);
                    } else {
                        schedules.forEach(sched => {
                            rows.push([
                                subj.name,
                                subj.tipologia || "",
                                subj.creditos || "",
                                group.name,
                                group.profesor || "",
                                sched.dia || "",
                                sched.horaInicio || "",
                                sched.horaFin || "",
                                sched.aula || ""
                            ]);
                        });
                    }
                } else {
                    rows.push([
                        subj.name,
                        subj.tipologia || "",
                        subj.creditos || "",
                        "Sin grupo seleccionado",
                        "", "", "", "", ""
                    ]);
                }
            });
            const csv = convertToCSV(headers, rows);
            downloadBlob(csv, "sia_pro_horario.csv", "text/csv;charset=utf-8;");
        });
    }

    const btnClearCache = exportDiv.querySelector("#btn-clear-cache");
    if (btnClearCache) {
        btnClearCache.addEventListener("click", () => {
            const confirmed = confirm("¿Estás seguro de que deseas borrar toda la caché y datos guardados de la extensión?\n\nEsto eliminará:\n- Tu historial académico raspado\n- El desglose de créditos y avance\n- Las notas parciales y simulaciones GPA\n- Las materias seleccionadas en tu horario\n\nEsta acción no se puede deshacer.");
            if (confirmed) {
                clearAllExtensionData();

                // Re-render current tab
                renderExportTab(container);

                // Re-render other tabs if elements are in the DOM
                const tab_historia = document.getElementById("tab-historia");
                if (tab_historia) renderHistoriaAcademica(tab_historia);

                const tab_creditos = document.getElementById("tab-creditos");
                if (tab_creditos) renderCreditosProgress(tab_creditos);

                const tab_gpa = document.getElementById("tab-gpa");
                if (tab_gpa) renderGpa(tab_gpa);

                const tab_avance = document.getElementById("tab-avance");
                if (tab_avance) renderAvanceProgress(tab_avance);

                const tab_horario = document.getElementById("tab-horario");
                if (tab_horario) renderHorario(tab_horario);
                
                alert("Toda la caché y datos de la extensión han sido borrados correctamente.");
            }
        });
    }

    // Data Dictionaries Definitions
    const dictionaries = {
        historia: {
            headers: ["Columna", "Descripción", "Tipo de Dato", "Ejemplo"],
            rows: [
                ["Semestre", "Identificador del semestre académico de la asignatura.", "Texto", "2024-1S"],
                ["Asignatura", "Nombre oficial de la asignatura.", "Texto", "Cálculo Diferencial"],
                ["Créditos", "Cantidad de créditos académicos que otorga la materia.", "Numérico (Entero)", "4"],
                ["Tipología", "Componente del plan de estudios al que pertenece la asignatura.", "Texto", "Fundamentación Obligatoria"],
                ["Calificación", "Calificación numérica final obtenida (de 0.0 a 5.0).", "Numérico (Decimal)", "4.3"],
                ["Estado", "Estado académico en el que finalizó (por ejemplo: APROBADA, REPROBADA, etc.).", "Texto", "APROBADA"]
            ]
        },
        gpa: {
            headers: ["Columna", "Descripción", "Tipo de Dato", "Ejemplo"],
            rows: [
                ["Asignatura", "Nombre de la asignatura con notas parciales.", "Texto", "Física Mecánica"],
                ["Actividad", "Descripción o nombre de la evaluación parcial.", "Texto", "Parcial 1"],
                ["Porcentaje", "Porcentaje de peso que equivale la evaluación en la materia.", "Texto (Porcentaje)", "25.0%"],
                ["Calificación Original", "La nota original extraída directamente del SIA.", "Numérico (Decimal)", "3.8"],
                ["Calificación Simulada", "La nota simulada en el GPA Calculator, incluyendo tus modificaciones.", "Numérico (Decimal)", "4.5"]
            ]
        },
        horario: {
            headers: ["Columna", "Descripción", "Tipo de Dato", "Ejemplo"],
            rows: [
                ["Asignatura", "Nombre de la asignatura en el horario.", "Texto", "Álgebra Lineal"],
                ["Tipología", "Componente o tipología de la materia.", "Texto", "Fundamentación Obligatoria"],
                ["Créditos", "Créditos de la materia.", "Numérico (Entero)", "4"],
                ["Grupo", "Grupo preinscrito o seleccionado.", "Texto", "Grupo 3"],
                ["Profesor", "Nombre del profesor asignado al grupo.", "Texto", "Juan Pérez"],
                ["Día", "Día en el que se dicta la clase correspondiente.", "Texto", "LUNES"],
                ["Hora Inicio", "Hora de inicio de la clase (formato de 24 horas).", "Texto", "14:00"],
                ["Hora Fin", "Hora de finalización de la clase (formato de 24 horas).", "Texto", "16:00"],
                ["Aula", "Edificio, bloque y salón donde se dicta la clase.", "Texto", "BLOQUE M8B - SALÓN 101"]
            ]
        }
    };

    const dictTableEl = exportDiv.querySelector("#sia-dict-table-el");

    /**
     * Renders a specific data dictionary in the table element.
     * 
     * @param {string} key - Dictionary key ('historia', 'gpa', or 'horario').
     */
    const renderDictionaryTable = (key) => {
        const dict = dictionaries[key];
        if (!dict) return;

        let html = `
            <thead>
                <tr>
                    ${dict.headers.map(h => `<th>${h}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${dict.rows.map(row => `
                    <tr>
                        ${row.map(val => `<td>${val}</td>`).join("")}
                    </tr>
                `).join("")}
            </tbody>
        `;
        dictTableEl.innerHTML = html;
    };

    // Initial render
    renderDictionaryTable("historia");

    // Bind Dictionary Tab Switchers
    const dictTabButtons = exportDiv.querySelectorAll(".sia-dict-tab-btn");
    dictTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            dictTabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderDictionaryTable(btn.dataset.dict);
        });
    });
}
