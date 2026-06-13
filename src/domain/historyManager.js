const STORAGE_KEY_ASIGNATURAS = "sia_pro_cached_asignaturas";
const STORAGE_KEY_CREDITOS = "sia_pro_cached_creditos";

/**
 * Saves the academic history subjects data to localStorage cache.
 * 
 * @param {Object} asignaturas - Scraped subject data grouped by semester.
 * @returns {void}
 */
export function saveCachedAsignaturas(asignaturas) {
    if (!asignaturas || Object.keys(asignaturas).length === 0) return;
    try {
        localStorage.setItem(STORAGE_KEY_ASIGNATURAS, JSON.stringify(asignaturas));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar asignaturas en caché:", e);
    }
}

/**
 * Loads the cached academic history subjects data from localStorage.
 * 
 * @returns {Object|null} Cached subject data or null if not present.
 */
export function loadCachedAsignaturas() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_ASIGNATURAS);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("[SIA Pro] Error al cargar asignaturas de caché:", e);
        return null;
    }
}

/**
 * Saves the credits breakdown data to localStorage cache.
 * 
 * @param {Array.<Object>} creditos - Scraped credits summary array.
 * @returns {void}
 */
export function saveCachedCreditos(creditos) {
    if (!creditos || creditos.length === 0) return;
    try {
        localStorage.setItem(STORAGE_KEY_CREDITOS, JSON.stringify(creditos));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar créditos en caché:", e);
    }
}

/**
 * Loads the cached credits breakdown data from localStorage.
 * 
 * @returns {Array.<Object>|null} Cached credits data or null if not present.
 */
export function loadCachedCreditos() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_CREDITOS);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("[SIA Pro] Error al cargar créditos de caché:", e);
        return null;
    }
}

const STORAGE_KEY_GPA_SIMULATIONS = "sia_pro_gpa_simulations";

/**
 * Loads all GPA simulations from localStorage.
 * 
 * @returns {Object.<string, Object.<string, number>>} Dictionary of subject names to their respective activity-grade mappings.
 */
export function loadAllGpaSimulations() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_GPA_SIMULATIONS);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("[SIA Pro] Error al cargar simulaciones de promedio:", e);
        return {};
    }
}

/**
 * Saves all GPA simulations to localStorage.
 * 
 * @param {Object.<string, Object.<string, number>>} simulations - The simulations dictionary to save.
 * @returns {void}
 */
export function saveAllGpaSimulations(simulations) {
    try {
        localStorage.setItem(STORAGE_KEY_GPA_SIMULATIONS, JSON.stringify(simulations));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar simulaciones GPA:", e);
    }
}

/**
 * Saves the simulated grades for a specific subject.
 * 
 * @param {string} subjectName - Name of the subject.
 * @param {Object.<string, number>} activitySimulations - Object mapping activity description to simulated grade.
 * @returns {void}
 */
export function saveGpaSimulationForSubject(subjectName, activitySimulations) {
    if (!subjectName) return;
    const simulations = loadAllGpaSimulations();
    simulations[subjectName] = activitySimulations;
    saveAllGpaSimulations(simulations);
}

/**
 * Loads the simulated grades for a specific subject.
 * 
 * @param {string} subjectName - Name of the subject.
 * @returns {Object.<string, number>} Object mapping activity description to simulated grade, or empty object if none.
 */
export function loadGpaSimulationForSubject(subjectName) {
    if (!subjectName) return {};
    const simulations = loadAllGpaSimulations();
    return simulations[subjectName] || {};
}

const STORAGE_KEY_GPA_CACHED_SUBJECTS = "sia_pro_gpa_cached_subjects";

/**
 * Saves the scraped subject data (original activities and grades) to localStorage.
 * Filters out DOM references to prevent circular serialization errors.
 * 
 * @param {string} subjectName - Name of the subject.
 * @param {Array.<Object>} activities - Scraped activities array.
 * @returns {void}
 */
export function saveGpaCachedSubject(subjectName, activities) {
    if (!subjectName || !activities) return;
    try {
        const subjects = loadAllGpaCachedSubjects();
        // Keep only descriptions, percentages, and grade values, ignoring DOM elements
        subjects[subjectName] = activities.map(activity => ({
            description: activity.description,
            percentage: activity.percentage,
            grade: activity.grade
        }));
        localStorage.setItem(STORAGE_KEY_GPA_CACHED_SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar asignatura GPA en caché:", e);
    }
}

/**
 * Loads all GPA cached subjects from localStorage.
 * 
 * @returns {Object.<string, Array.<{description: string, percentage: number, grade: number}>>} Dictionary of cached subject names.
 */
export function loadAllGpaCachedSubjects() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_GPA_CACHED_SUBJECTS);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("[SIA Pro] Error al cargar asignaturas GPA de caché:", e);
        return {};
    }
}

/**
 * Clears all cached academic, GPA, and schedule data from localStorage.
 * 
 * @returns {void}
 */
export function clearAllExtensionData() {
    const keys = [
        STORAGE_KEY_ASIGNATURAS,
        STORAGE_KEY_CREDITOS,
        STORAGE_KEY_GPA_SIMULATIONS,
        STORAGE_KEY_GPA_CACHED_SUBJECTS,
        "sia_pro_gpa_selected_subject",
        "sia_pro_selected_subjects",
        "sia_pro_selected_groups"
    ];
    keys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`[SIA Pro] Error al eliminar clave ${key} de localStorage:`, e);
        }
    });
}


