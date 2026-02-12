import { SELECTORS } from "../../utils/selectors";

export function extractAsignaturasFromDom() {
    const asignaturasRaw = document.querySelectorAll("tr.af_table_data-row");

    const asignaturas = [];

    for (const asignatura of asignaturasRaw) {


        const nombre = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-des, td.af_column_banded-data-cell.ex-asig-des"
            )?.textContent.trim();

            
        const creditos = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-cre.text-right, td.af_column_banded-data-cell.ex-asig-cre.text-right"
            )?.textContent.trim();

        const componente = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-tip, td.af_column_banded-data-cell.ex-asig-tip"
            )?.textContent.trim();
        
        const semestreRaw = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-conv, td.af_column_banded-data-cell.ex-asig-conv"
            )
            ?.textContent.trim() || "";

        const semestreMatch = semestreRaw?.match(/\d{4}-\dS/);
        const semestre = semestreMatch ? semestreMatch[0] : null;


        const calificacion_estado = asignatura
            .querySelector(
                "td.af_column_data-cell.ex-asig-cal.text-center, td.af_column_banded-data-cell.ex-asig-cal.text-center"
            )?.textContent.trim();


        let calificacion = null;
        let estado = null;

        const match = calificacion_estado?.match(/\d+\.\d/); 

        if (match) {
            calificacion = parseFloat(match[0]);
            estado = calificacion_estado.replace(match[0], "").trim();
        } else {
            estado = calificacion_estado; 
        }

        asignaturas.push({
            nombre,
            creditos: creditos ? parseInt(creditos, 10) : null,
            componente,
            semestre,
            calificacion,
            estado
        });
    }

    return asignaturas;
        
}

export function areAsignaturasAvailable() {
    const asignaturasRaw = document.querySelectorAll("tr.af_table_data-row");
    return asignaturasRaw.length > 0;
}

export function renderAsignaturasBySemester(asignaturas) {
    if (!Array.isArray(asignaturas) || asignaturas.length === 0) return;

    const grouped = asignaturas.reduce((acc, asignatura) => {
        const semestre = asignatura.semestre || "Sin semestre";
        if (!acc[semestre]) acc[semestre] = [];
        acc[semestre].push(asignatura);
        return acc;
    }, {});

    const sortedSemestres = Object.keys(grouped).sort().reverse();

    const hostContainer = document.querySelector(
        "span.row.asignaturas-expediente.clear.af_panelGroupLayout"
    );
    if (!hostContainer) return;

    hostContainer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "sia-semester-wrapper";

    for (const semestre of sortedSemestres) {
        const materias = grouped[semestre];

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
