/**
 * Builds progress data from academic history, filtering and sorting regular semesters
 * @param {Object} asignaturasPorSemestre - Object with semesters as keys and course data as values
 * @returns {Array} Array of progress data with accumulated credits per semester
 */
export function buildProgressData(asignaturasPorSemestre) {
    // Filter and sort semesters (only "Ordinaria" - regular semesters)
    const semestres = Object.keys(asignaturasPorSemestre)
        .filter(s => s.includes("Ordinaria"))
        .sort((a, b) => {
            // Extract year and semester number for proper sorting
            const matchA = a.match(/(\d{4})-(\d)S/);
            const matchB = b.match(/(\d{4})-(\d)S/);

            if (matchA && matchB) {
                const yearDiff = parseInt(matchA[1]) - parseInt(matchB[1]);
                if (yearDiff !== 0) return yearDiff;
                return parseInt(matchA[2]) - parseInt(matchB[2]);
            }
            return a.localeCompare(b);
        });

    let acumulado = 0;

    return semestres.map(semestre => {
        const creditosAprobados = asignaturasPorSemestre[semestre].creditosAprobados || 0;
        acumulado += creditosAprobados;

        return {
            semestre,
            acumulado,
            creditosDelSemestre: creditosAprobados
        };
    });
}

/**
 * Projects future semesters based on current average performance
 * @param {Array} progressData - Historical progress data
 * @param {number} totalExigidos - Total credits required for graduation
 * @returns {Array} Array of projected semester data
 */
export function proyectarSemestres(progressData, totalExigidos) {
    const promedio = calcularPromedioPorSemestre(progressData);

    // If average is 0 or negative, can't project
    if (promedio <= 0) {
        return [];
    }

    let ultimoAcumulado = progressData.at(-1).acumulado;
    let semestreIndex = 1;
    const proyeccion = [];

    // Safety limit to avoid infinite loops
    const MAX_SEMESTRES = 20;

    while (ultimoAcumulado < totalExigidos && semestreIndex <= MAX_SEMESTRES) {
        ultimoAcumulado += promedio;

        proyeccion.push({
            semestre: `+ ${semestreIndex}`,
            acumulado: Math.min(Math.round(ultimoAcumulado), totalExigidos)
        });

        semestreIndex++;
    }

    return proyeccion;
}

/**
 * Calculates the average credits approved per semester
 * @param {Array} progressData - Historical progress data
 * @returns {number} Average credits per semester
 */
export function calcularPromedioPorSemestre(progressData) {
    const totalSemestres = progressData.length;
    const totalCreditos = progressData.at(-1).acumulado;

    return totalCreditos / totalSemestres;
}