export function extractAsignaturasFromDom() {
    const asignaturasRaw = document.querySelectorAll("tr.af_table_data-row");

    const semestres = {};

    for (const asignatura of asignaturasRaw) {

        const nombre = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-des, td.af_column_banded-data-cell.ex-asig-des"
            )?.textContent.trim() || null;

        const creditosRaw = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-cre.text-right, td.af_column_banded-data-cell.ex-asig-cre.text-right"
            )?.textContent.trim();

        const creditos = creditosRaw ? parseInt(creditosRaw, 10) : null;

        const componente = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-tip, td.af_column_banded-data-cell.ex-asig-tip"
            )?.textContent.trim() || null;

        const semestre = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-conv, td.af_column_banded-data-cell.ex-asig-conv"
            )
            ?.textContent.trim() || "";


        const calificacionEstadoRaw = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-cal.text-center, td.af_column_banded-data-cell.ex-asig-cal.text-center"
            )?.textContent.trim() || "";

        let calificacion = null;
        let estado = null;

        const match = calificacionEstadoRaw.match(/\d+\.\d/);

        if (match) {
            calificacion = parseFloat(match[0]);
            estado = calificacionEstadoRaw.replace(match[0], "").trim();
        } else {
            estado = calificacionEstadoRaw || null;
        }

        if (!nombre || !semestre) continue;

        if (!semestres[semestre]) {
            semestres[semestre] = {
                asignaturas: [],
                creditosAprobados: 0,
                creditosReprobados: 0

            };
        }

        semestres[semestre].asignaturas.push({
            nombre,
            creditos,
            componente,
            semestre,
            calificacion,
            estado
        });



        if (estado === "APROBADA") {
            semestres[semestre].creditosAprobados += creditos || 0;
        } else {
            semestres[semestre].creditosReprobados += creditos || 0;
        }

    }


    return semestres;
}


export function areAsignaturasAvailable() {
    const asignaturasRaw = document.querySelectorAll("tr.af_table_data-row");
    return asignaturasRaw.length > 0;
}

export function extractCreditosFromDom() {
    const rows = document.querySelectorAll(
        "#pt1\\:r1\\:0\\:t10\\:\\:db table.af_table_data-table tbody > tr.af_table_data-row"
    );

    const creditos = [];

    for (const row of rows) {
        const componente = row.querySelector(
            "td.af_column_data-cell.text-left, td.af_column_banded-data-cell.text-left"
        )?.textContent.trim() || "";

        const creditosCells = row.querySelectorAll(
            "td.af_column_data-cell.text-center, td.af_column_banded-data-cell.text-center"
        );

        creditos.push({
            componente,
            exigidos: creditosCells[0] ? parseInt(creditosCells[0].textContent.trim()) : 0,
            aprobados: creditosCells[1] ? parseInt(creditosCells[1].textContent.trim()) : 0,
            pendientes: creditosCells[2] ? parseInt(creditosCells[2].textContent.trim()) : 0,
            inscritos: creditosCells[3] ? parseInt(creditosCells[3].textContent.trim()) : 0,
            cursados: creditosCells[4] ? parseInt(creditosCells[4].textContent.trim()) : 0
        });
    }

    return creditos;
}

export function areCreditosAvailable() {
    const rows = document.querySelectorAll(
        "#pt1\\:r1\\:0\\:t10\\:\\:db table.af_table_data-table tbody > tr.af_table_data-row"
    );
    return rows.length > 0;
}

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