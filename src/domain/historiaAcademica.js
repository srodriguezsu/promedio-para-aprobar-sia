/**
 * Builds accumulated academic progress data per semester from academic history.
 * Filters out non-regular semesters (only matches "Ordinaria") and sorts them chronologically.
 * 
 * @param {Object.<string, {
 *   asignaturas: Array.<Object>,
 *   creditosAprobados: number,
 *   creditosReprobados: number
 * }>} asignaturasPorSemestre - Object containing academic history grouped by semester key.
 * @returns {Array.<{
 *   semestre: string,
 *   acumulado: number,
 *   creditosDelSemestre: number
 * }>} List of semesters with their respective and accumulated approved credits.
 */
export function buildProgressData(asignaturasPorSemestre) {
    // Filter and sort semesters (only "Ordinaria" - regular semesters)
    const semestres = Object.keys(asignaturasPorSemestre)
        .filter(s => s.includes("Ordinaria"))
        .sort((a, b) => {
            // Extract year and semester number for proper sorting (e.g., "2024-1S" -> ['2024', '1'])
            const matchA = a.match(/(\d{4})-(\d)S/);
            const matchB = b.match(/(\d{4})-(\d)S/);

            if (matchA && matchB) {
                const yearDiff = parseInt(matchA[1]) - parseInt(matchB[1]);
                if (yearDiff !== 0) return yearDiff;
                // If years are identical, sort by semester number (1S vs 2S)
                return parseInt(matchA[2]) - parseInt(matchB[2]);
            }
            return a.localeCompare(b);
        });

    let acumulado = 0;
    const allSubjectsSoFar = [];

    // Map sorted semesters to progress objects with running accumulated credits and PAPA
    return semestres.map(semestre => {
        const semesterData = asignaturasPorSemestre[semestre];
        let creditosAprobados = semesterData.creditosAprobados || 0;

        if (semesterData.asignaturas) {
            creditosAprobados = semesterData.asignaturas
                .filter(asig => {
                    const normComponente = (asig.componente || "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toUpperCase()
                        .trim();
                    return asig.estado === "APROBADA" && normComponente !== "NIVELACION";
                })
                .reduce((sum, asig) => sum + (asig.creditos || 0), 0);
            
            // Accumulate all subjects from the start up to the current semester to calculate cumulative PAPA
            allSubjectsSoFar.push(...semesterData.asignaturas);
        }

        acumulado += creditosAprobados;

        // Calculate cumulative PAPA (Aritmético Ponderado Acumulado) up to this semester
        // Formula: Sum(Credits * Grade) / Sum(Credits) for all graded subjects
        let totalWeightedGrades = 0;
        let totalPapaCredits = 0;

        allSubjectsSoFar.forEach(asig => {
            if (Number.isFinite(asig.calificacion) && Number.isFinite(asig.creditos)) {
                totalWeightedGrades += asig.calificacion * asig.creditos;
                totalPapaCredits += asig.creditos;
            }
        });

        const papaAcumulado = totalPapaCredits > 0 ? (totalWeightedGrades / totalPapaCredits) : 0;

        return {
            semestre,
            acumulado,
            creditosDelSemestre: creditosAprobados,
            papaAcumulado: parseFloat(papaAcumulado.toFixed(2))
        };
    });
}

/**
 * Projects future semesters based on the student's historical average credit performance per semester.
 * 
 * @param {Array.<{
 *   semestre: string,
 *   acumulado: number,
 *   creditosDelSemestre: number
 * }>} progressData - Historical academic progress data.
 * @param {number} totalExigidos - Total credit requirements for the academic program.
 * @returns {Array.<{
 *   semestre: string,
 *   acumulado: number
 * }>} Array of projected future semesters with expected accumulated credits.
 */
export function proyectarSemestres(progressData, totalExigidos) {
    const rawPromedio = calcularPromedioPorSemestre(progressData);
    // Use at least 10 credits per semester (minimum load) for future projections
    const promedio = Math.max(10, rawPromedio);

    let ultimoAcumulado = progressData.at(-1).acumulado;
    let semestreIndex = 1;
    const proyeccion = [];

    // Safety limit to avoid infinite loops if projection doesn't progress
    const MAX_SEMESTRES = 20;

    // Simulate subsequent semesters until graduation requirements are satisfied
    while (ultimoAcumulado < totalExigidos && semestreIndex <= MAX_SEMESTRES) {
        ultimoAcumulado += promedio;

        proyeccion.push({
            semestre: `+ ${semestreIndex}`,
            // Cap the projection to the total required credits
            acumulado: Math.min(Math.round(ultimoAcumulado), totalExigidos)
        });

        semestreIndex++;
    }

    return proyeccion;
}

/**
 * Calculates the average credits approved per semester based on historical progress.
 * 
 * @param {Array.<{
 *   semestre: string,
 *   acumulado: number,
 *   creditosDelSemestre: number
 * }>} progressData - Historical progress data.
 * @returns {number} Average credits approved per semester.
 */
export function calcularPromedioPorSemestre(progressData) {
    const totalSemestres = progressData.length;
    // Get the most recent accumulated credits from the last element
    const totalCreditos = progressData.at(-1).acumulado;

    return totalCreditos / totalSemestres;
}