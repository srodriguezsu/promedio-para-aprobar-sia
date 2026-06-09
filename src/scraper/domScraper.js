import { SELECTORS } from "../utils/selectors.js";

export function extractAsignaturasFromDom() {
    const asignaturasRaw = document.querySelectorAll(SELECTORS.historyRow);

    const semestres = {};

    for (const asignatura of asignaturasRaw) {
        const nombre = asignatura
            .querySelector(SELECTORS.historyNameCell)
            ?.textContent.trim() || null;

        const creditosRaw = asignatura
            .querySelector(SELECTORS.historyCreditsCell)
            ?.textContent.trim();

        const creditos = creditosRaw ? parseInt(creditosRaw, 10) : null;

        const componente = asignatura
            .querySelector(SELECTORS.historyComponentCell)
            ?.textContent.trim() || null;

        const semestre = asignatura
            .querySelector(SELECTORS.historySemesterCell)
            ?.textContent.trim() || "";

        const calificacionEstadoRaw = asignatura
            .querySelector(SELECTORS.historyGradeCell)
            ?.textContent.trim() || "";

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
    const asignaturasRaw = document.querySelectorAll(SELECTORS.historyRow);
    return asignaturasRaw.length > 0;
}

export function extractCreditosFromDom() {
    const rows = document.querySelectorAll(SELECTORS.creditsRow);

    const creditos = [];

    for (const row of rows) {
        const componente = row.querySelector(SELECTORS.creditsComponentCell)
            ?.textContent.trim() || "";

        const creditosCells = row.querySelectorAll(SELECTORS.creditsDataCells);

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

export function areCreditosAvailable() {
    const rows = document.querySelectorAll(SELECTORS.creditsRow);
    return rows.length > 0;
}

export function extractActivitiesFromDom() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    const activities = [];

    gradeContainers.forEach((container) => {
        const descriptionSpan = container.querySelector(SELECTORS.description);
        const description = descriptionSpan ? descriptionSpan.textContent.trim() : "N/A";

        const percentageSpan = container.querySelector(SELECTORS.percentage);
        const percentageText = percentageSpan ? percentageSpan.textContent.trim() : "";
        const percentageValue = percentageSpan ? parseFloat(percentageText.replace("%", "")) : NaN;

        const gradeSpan = container.querySelector(SELECTORS.grade);
        const gradeValue = gradeSpan ? parseFloat(gradeSpan.textContent.trim()) : NaN;

        activities.push({
            description,
            percentage: percentageValue / 100,
            grade: gradeValue,
            container
        });
    });

    return activities;
}

export function extractSubjectName() {
    const subjectNameElement = document.querySelector(SELECTORS.subjectName);
    return subjectNameElement ? subjectNameElement.textContent : "N/A";
}

export function areGradeContainersAvailable() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    return gradeContainers && gradeContainers.length > 0;
}
