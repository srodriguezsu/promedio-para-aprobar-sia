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


function extractPrerequisitesFromDom(element) {
    const prerequisites = [];
    console.log("[SIA Pro] Elemento de prerrequisitos:", element);

    const headerElement = element.querySelector(SELECTORS.prerequisitesHeader);
    if (headerElement) {
        console.log("[SIA Pro] Sección de prerrequisitos encontrada:", headerElement.textContent.trim());
    } else {
        console.warn("[SIA Pro] No se encontró el encabezado de prerrequisitos en el elemento proporcionado.");
    }
}

/**
 * Scrapes all details and academic groups of the subject currently displayed in the enrollment view.
 * Extracts metadata like typology, credits, faculty, career/program, and details for each class group 
 * (including professor name, schedule, duration, shift, and seat availability).
 *
 * @returns {{
 *   name: string,
 *   tipologia?: string,
 *   creditos?: string,
 *   facultad?: string,
 *   carrera?: string,
 *   groups: Array.<{
 *     name: string,
 *     profesor?: string,
 *     fechaInicio?: string,
 *     fechaFin?: string,
 *     horarios?: Array.<{
 *       dia: string,
 *       horaInicio: string,
 *       horaFin: string,
 *       aula: string
 *     }>,
 *     duracion?: string,
 *     jornada?: string,
 *     cuposDisponibles?: string
 *   }>
 * }|null} Object containing parsed course details and its groups, or null if not found.
 */
export function extractAsignaturaParaCursar() {
    const subjectTitleElement = document.querySelector(SELECTORS.subjectNameToEnroll);
    if (!subjectTitleElement) {
        console.warn("[SIA Pro] No se pudo encontrar el título de la asignatura para inscripción.");
        return null;
    }

    const scrapedSubject = {
        name: subjectTitleElement.textContent.trim(),
    };

    const detailElements = document.querySelectorAll(SELECTORS.subjectDetailsToEnroll);

    // Parse main subject metadata fields (typology, credits, faculty, career)
    detailElements.forEach((detailElement) => {
        const detailText = detailElement.textContent.trim();
        
        if (detailText.includes("Tipología")) {
            scrapedSubject.tipologia = detailText.replace("Tipología:", "").trim();
        } else if (detailText.includes("Créditos")) {
            scrapedSubject.creditos = detailText.replace("Créditos:", "").trim();
        } else if (detailText.includes("Facultad")) {
            scrapedSubject.facultad = detailText.replace("Facultad:", "").trim();
        } else {
            // Assume any other unclassified text block is the career/program name
            scrapedSubject.carrera = detailText;
        }
    });

    let groupElementsArray = Array.from(document.querySelectorAll(SELECTORS.subjectGroupsToEnroll));
    const groups = [];

    // Remove the first element (contenido de la asignatura) as it is not a real group
    if (groupElementsArray.length > 0) {
        groupElementsArray.shift();
    }

    // Remove the last element (Prerrequisitos) as it is not a real group
    if (groupElementsArray.length > 0) {
        const prerequisitesSection = groupElementsArray.pop();
        console.log("[SIA Pro] Eliminando sección de prerrequisitos...");
        if (prerequisitesSection) {
            scrapedSubject.prerequisites = extractPrerequisitesFromDom(prerequisitesSection);
        }
    }

    if (groupElementsArray.length === 0) {
        console.warn("[SIA Pro] No se encontraron grupos de la asignatura para inscripción.");
        return scrapedSubject;
    }

    // Parse each class group section
    groupElementsArray.forEach((groupElement) => {
        const groupNameText = groupElement.querySelector("h2")?.textContent.trim();
        if (!groupNameText) {
            return;
        }

        const scrapedGroup = {
            name: groupNameText
        };

        const groupDetailElements = groupElement.querySelectorAll(SELECTORS.subjectGroupDetails);

        // Parse attributes for the active group
        groupDetailElements.forEach((groupDetailElement) => {
            const groupDetailText = groupDetailElement.textContent.trim();

            if (groupDetailText.includes("Profesor")) {
                scrapedGroup.profesor = groupDetailText.replace("Profesor:", "").trim();
            } else if (groupDetailText.includes("Horarios/Aula")) {

                // Extract start date and end date for the group
                const dateElements = groupDetailElement.querySelectorAll("span");

                // Second element is expected to contain the start date and the third element the end date
                if (dateElements.length >= 3) {
                    // Regex to search for a date part from strings like "30/05/2026" (ignoring ADF scripts/comments)
                    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
                    const startDateMatch = dateElements[1].textContent.trim().match(dateRegex);
                    const endDateMatch = dateElements[2].textContent.trim().match(dateRegex);

                    if (startDateMatch) {
                        scrapedGroup.fechaInicio = startDateMatch[1];
                    } else {
                        console.warn(`[SIA Pro] No se pudo extraer la fecha de inicio para el grupo ${scrapedGroup.name}.`, dateElements[1].textContent.trim());
                    }

                    if (endDateMatch) {
                        scrapedGroup.fechaFin = endDateMatch[1];
                    } else {
                        console.warn(`[SIA Pro] No se pudo extraer la fecha de fin para el grupo ${scrapedGroup.name}.`);
                    }
                    
                } else {
                    console.warn(`[SIA Pro] No se encontraron las fechas de inicio y fin para el grupo ${scrapedGroup.name}.`);
                }

                const scrapedSchedules = [];
                
                // Select only direct schedule rows within the group details
                const scheduleElements = groupDetailElement.querySelectorAll(`:scope > span > ${SELECTORS.subjectGroupSchedule}`);
                
                scheduleElements.forEach((scheduleElement, scheduleIndex) => {
                    const scheduleText = scheduleElement.textContent.trim();
                    
                    // Regex pattern to match schedule format like "Lunes de 8:00 a 10:00 Aula 101"
                    const scheduleRegex = /^([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s+de\s+(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})\.?(.*)$/i;
                    const scheduleMatch = scheduleText.match(scheduleRegex);

                    const scrapedSchedule = {
                        dia: "",
                        horaInicio: "",
                        horaFin: "",
                        aula: ""
                    };

                    if (scheduleMatch) {
                        scrapedSchedule.dia = scheduleMatch[1].trim();
                        scrapedSchedule.horaInicio = scheduleMatch[2].trim();
                        scrapedSchedule.horaFin = scheduleMatch[3].trim();
                        scrapedSchedule.aula = scheduleMatch[4].trim();
                    } else {
                        // Fallback: assign the raw string to the classroom field if structure differs
                        scrapedSchedule.aula = scheduleText;
                    }
                    
                    scrapedSchedules.push(scrapedSchedule);
                });
                scrapedGroup.horarios = scrapedSchedules;
            } else if (groupDetailText.includes("Duración")) {
                scrapedGroup.duracion = groupDetailText.replace("Duración:", "").trim();
            } else if (groupDetailText.includes("Jornada")) {
                scrapedGroup.jornada = groupDetailText.replace("Jornada:", "").trim();
            } else if (groupDetailText.includes("Cupos disponibles")) {
                // Convert available seats to integer
                const cuposText = groupDetailText.replace("Cupos disponibles:", "").trim();
                const cuposInt = parseInt(cuposText.replace(/[^0-9-]/g, ""), 10);
                scrapedGroup.cuposDisponibles = Number.isNaN(cuposInt) ? null : cuposInt;
            }
        });

        if (!scrapedGroup.horarios || scrapedGroup.horarios.length === 0) {
            console.warn(`[SIA Pro] No se encontraron horarios válidos para el grupo ${scrapedGroup.name}.`);
            return;
        }

        groups.push(scrapedGroup);
    });

    scrapedSubject.groups = groups;

    return scrapedSubject;
}
