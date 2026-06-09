import { SELECTORS } from "../utils/selectors.js";

/**
 * Scrapes and extracts academic history data (subjects/courses) from the SIA DOM.
 * 
 * Iterates through the rows of the academic history table, parses each subject's details
 * (name, credits, component/typology, semester, grade, and status), and aggregates
 * them grouped by semester along with calculated approved and failed credit metrics.
 * 
 * @returns {Object.<string, {
 *   asignaturas: Array.<{
 *     nombre: string|null,
 *     creditos: number|null,
 *     componente: string|null,
 *     semestre: string,
 *     calificacion: number|null,
 *     estado: string|null
 *   }>,
 *   creditosAprobados: number,
 *   creditosReprobados: number
 * }>} An object mapping semester names to their respective course lists and credits summaries.
 */
export function extractAsignaturasFromDom() {
    // Select all table rows containing academic history data
    const asignaturasRaw = document.querySelectorAll(SELECTORS.historyRow);

    const semestres = {};

    for (const asignatura of asignaturasRaw) {
        // Extract the subject name from the specified cell
        const nombre = asignatura
            .querySelector(SELECTORS.historyNameCell)
            ?.textContent.trim() || null;

        // Parse and validate the credit count
        const creditosRaw = asignatura
            .querySelector(SELECTORS.historyCreditsCell)
            ?.textContent.trim();

        const creditos = creditosRaw ? parseInt(creditosRaw, 10) : null;

        // Extract the academic component/typology (e.g., Obligatoria, Optativa, etc.)
        const componente = asignatura
            .querySelector(SELECTORS.historyComponentCell)
            ?.textContent.trim() || null;

        // Extract the semester identifier (e.g., '2024-1S')
        const semestre = asignatura
            .querySelector(SELECTORS.historySemesterCell)
            ?.textContent.trim() || "";

        // Extract the raw cell text containing grade and status
        const calificacionEstadoRaw = asignatura
            .querySelector(SELECTORS.historyGradeCell)
            ?.textContent.trim() || "";

        let calificacion = null;
        let estado = null;

        // Parse numeric grade using a regex pattern (e.g., '4.5')
        const match = calificacionEstadoRaw.match(/\d+\.\d/);

        if (match) {
            calificacion = parseFloat(match[0]);
            // Status is the text remaining after removing the numeric grade
            estado = calificacionEstadoRaw.replace(match[0], "").trim();
        } else {
            // If no numeric grade is found, the whole cell content represents the status (e.g., 'APROBADA')
            estado = calificacionEstadoRaw || null;
        }

        // Skip records without a valid name or semester
        if (!nombre || !semestre) continue;

        // Initialize semester group if it doesn't exist yet
        if (!semestres[semestre]) {
            semestres[semestre] = {
                asignaturas: [],
                creditosAprobados: 0,
                creditosReprobados: 0
            };
        }

        // Add the parsed subject to the list of the corresponding semester
        semestres[semestre].asignaturas.push({
            nombre,
            creditos,
            componente,
            semestre,
            calificacion,
            estado
        });

        // Accumulate approved and failed credits based on the subject's status
        if (estado === "APROBADA") {
            semestres[semestre].creditosAprobados += creditos || 0;
        } else {
            semestres[semestre].creditosReprobados += creditos || 0;
        }
    }

    return semestres;
}

/**
 * Checks if academic history (subjects) rows are present in the DOM.
 * 
 * @returns {boolean} True if at least one academic history row is found, false otherwise.
 */
export function areAsignaturasAvailable() {
    const asignaturasRaw = document.querySelectorAll(SELECTORS.historyRow);
    return asignaturasRaw.length > 0;
}

/**
 * Scrapes and extracts academic credits summary by component/typology from the DOM.
 * 
 * Extracts data from the credit distribution table including required, approved,
 * pending, enrolled, and completed credits for each component type.
 * 
 * @returns {Array.<{
 *   componente: string,
 *   exigidos: number,
 *   aprobados: number,
 *   pendientes: number,
 *   inscritos: number,
 *   cursados: number
 * }>} Array of objects representing the credit details for each typology/component.
 */
export function extractCreditosFromDom() {
    const rows = document.querySelectorAll(SELECTORS.creditsRow);

    const creditos = [];

    for (const row of rows) {
        // Extract the component/typology name (e.g., 'Fundamentación Obligatoria')
        const componente = row.querySelector(SELECTORS.creditsComponentCell)
            ?.textContent.trim() || "";

        const creditosCells = row.querySelectorAll(SELECTORS.creditsDataCells);

        // Map cells to their respective numerical values representing credit statistics
        creditos.push({
            componente,
            exigidos: creditosCells[0] ? parseInt(creditosCells[0].textContent.trim(), 10) : 0,
            aprobados: creditosCells[1] ? parseInt(creditosCells[1].textContent.trim(), 10) : 0,
            pendientes: creditosCells[2] ? parseInt(creditosCells[2].textContent.trim(), 10) : 0,
            inscritos: creditosCells[3] ? parseInt(creditosCells[3].textContent.trim(), 10) : 0,
            cursados: creditosCells[4] ? parseInt(creditosCells[4].textContent.trim(), 10) : 0
        });
    }

    return creditos;
}

/**
 * Checks if credit summary table rows are present in the DOM.
 * 
 * @returns {boolean} True if at least one credits summary row is found, false otherwise.
 */
export function areCreditosAvailable() {
    const rows = document.querySelectorAll(SELECTORS.creditsRow);
    return rows.length > 0;
}

/**
 * Scrapes and extracts individual evaluation activities (partial grades) for the selected course.
 * 
 * @returns {Array.<{
 *   description: string,
 *   percentage: number,
 *   grade: number,
 *   container: HTMLElement
 * }>} List of evaluation activities with description, weight (as a decimal fraction), grade, and container DOM element.
 */
export function extractActivitiesFromDom() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    const activities = [];

    gradeContainers.forEach((container) => {
        // Extract description of the partial evaluation
        const descriptionSpan = container.querySelector(SELECTORS.description);
        const description = descriptionSpan ? descriptionSpan.textContent.trim() : "N/A";

        // Extract and parse evaluation percentage (e.g., '20%')
        const percentageSpan = container.querySelector(SELECTORS.percentage);
        const percentageText = percentageSpan ? percentageSpan.textContent.trim() : "";
        const percentageValue = percentageSpan ? parseFloat(percentageText.replace("%", "")) : NaN;

        // Extract and parse the grade value received
        const gradeSpan = container.querySelector(SELECTORS.grade);
        const gradeValue = gradeSpan ? parseFloat(gradeSpan.textContent.trim()) : NaN;

        activities.push({
            description,
            percentage: percentageValue / 100, // Convert percentage to a 0-1 range
            grade: gradeValue,
            container
        });
    });

    return activities;
}

/**
 * Extracts the name of the currently selected course/subject from the grades screen.
 * 
 * @returns {string} The name of the subject, or "N/A" if it cannot be found.
 */
export function extractSubjectName() {
    const subjectNameElement = document.querySelector(SELECTORS.subjectName);
    return subjectNameElement ? subjectNameElement.textContent : "N/A";
}

/**
 * Checks if evaluation/grade containers are present in the DOM.
 * 
 * @returns {boolean} True if at least one grade container element is found, false otherwise.
 */
export function areGradeContainersAvailable() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    return gradeContainers && gradeContainers.length > 0;
}

/**
 * Scrapes all subjects/courses available for enrollment in the current DOM view
 * and prints their name text content to the developer console.
 * 
 * @returns {Array.<string>} An array of the scraped subject names.
 */
export function extractAsignaturaParaCursar() {
    const subjectName = document.querySelector(SELECTORS.subjectNameToEnroll);
    
    const subjectGroups = document.querySelectorAll(SELECTORS.subjectGroupsToEnroll);

    console.log("Asignatura para cursar:", subjectName ? subjectName.textContent.trim() : "N/A");

    subjectGroups.forEach((group, index) => {

        const groupName = group.querySelector("h2")?.textContent.trim();

        console.log(`- ${groupName}`);

        const groupDetails = group.querySelectorAll(SELECTORS.subjectGroupDetails);

        groupDetails.forEach((detail, detailIndex) => {

            const text = detail.textContent.trim()

            if (text.includes("Profesor")) {
                console.log(`    * Profesor: ${text.replace("Profesor:", "").trim()}`);
            } if (text.includes("Facultad")) {
                console.log(`    * Facultad: ${text.replace("Facultad:", "").trim()}`);
            } if (text.includes("Horarios/Aula")) {

                detail.querySelectorAll(SELECTORS.subjectGroupSchedule).forEach((schedule, scheduleIndex) => {
                    console.log(`        - Horario ${scheduleIndex + 1}: ${schedule.textContent.trim()}`);
                }

            );
            } if (text.includes("Duración")) {
                console.log(`    * Duración: ${text.replace("Duración:", "").trim()}`);
            } if (text.includes("Jornada")) {
                console.log(`    * Jornada: ${text.replace("Jornada:", "").trim()}`);
            } if (text.includes("Cupos disponibles")) {
                console.log(`    * Cupos disponibles: ${text.replace("Cupos disponibles:", "").trim()}`);
            }
            
        });

    });

    return subjectNames;
}
