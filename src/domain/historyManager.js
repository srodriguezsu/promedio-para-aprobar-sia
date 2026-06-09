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
