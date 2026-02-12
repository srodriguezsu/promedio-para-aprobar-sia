import { SELECTORS } from "../../utils/selectors";

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

export function renderAsignaturasBySemester(data) {
    if (!data || typeof data !== "object") return;

    const hostContainer = document.querySelector(
        "span.row.asignaturas-expediente.clear.af_panelGroupLayout"
    );
    if (!hostContainer) return;

    hostContainer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "sia-semester-wrapper";

    // Ordenar semestres descendente (ej: 2025-2S > 2025-1S > 2024-2S)
    const sortedSemestres = Object.keys(data).sort().reverse();

    for (const semestre of sortedSemestres) {
        const semestreData = data[semestre];
        const materias = [...(semestreData.asignaturas || [])];

        // Ordenar por calificación descendente (null al final)
        materias.sort((a, b) => {
            if (a.calificacion == null) return 1;
            if (b.calificacion == null) return -1;
            return b.calificacion - a.calificacion;
        });

        const column = document.createElement("div");
        column.className = "sia-semester-column";

        const title = document.createElement("h3");
        title.textContent = semestre;
        title.className = "sia-semester-title";

        const metrics = document.createElement("div");
        metrics.className = "sia-semester-metrics";

        if (semestreData.creditosReprobados > 0){
            metrics.innerHTML = `
                <span>Total Créditos: ${semestreData.creditosReprobados + semestreData.creditosAprobados}</span>
                <span>Créditos Reprobados: ${semestreData.creditosReprobados}</span>
            `;
        } else {
            metrics.innerHTML = `
                <span>Total Créditos: ${semestreData.creditosAprobados}</span>
                <span>Total Asignaturas: ${semestreData.asignaturas.length}</span>
            `;
        }


        

        column.appendChild(title);
        column.appendChild(metrics);

        for (const asignatura of materias) {
            const card = document.createElement("div");
            card.className = "sia-asignatura-card";

            const estadoClass = asignatura.estado
                ?.toLowerCase()
                .replace(/\s+/g, "-");

            card.innerHTML = `
                <div class="sia-asig-nombre">${asignatura.nombre}</div>
                <div class="sia-asig-meta">
                    <span>${asignatura.creditos} créditos</span>
                    <span>${asignatura.componente}</span>
                </div>
                <div class="sia-asig-estado ${estadoClass}">
                    ${asignatura.calificacion ?? "-"} ${asignatura.estado}
                </div>
            `;

            column.appendChild(card);
        }

        wrapper.appendChild(column);
    }

    hostContainer.appendChild(wrapper);
}
