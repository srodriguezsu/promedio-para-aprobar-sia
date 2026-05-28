import { areAsignaturasAvailable, extractAsignaturasFromDom } from "../../domain/historiaAcademica.js";

function enableDragScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener("mousedown", (e) => {
        isDown = true;
        container.classList.add("dragging");
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener("mouseleave", () => {
        isDown = false;
    });

    container.addEventListener("mouseup", () => {
        isDown = false;
    });

    container.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.2; // speed multiplier
        container.scrollLeft = scrollLeft - walk;
    });
}

export function renderHistoriaAcademica(container) {
    if (!container) return;
    container.innerHTML = "";
    if (!areAsignaturasAvailable()) {
        container.innerHTML = "<p>No hay historia académica disponible.<br><br>Navega a <b>Información académica > Historia académica</b>.</p>";
        return;
    }

    const data = extractAsignaturasFromDom();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-semester-wrapper";

    enableDragScroll(wrapper);

    const title = document.createElement("h2");
    title.textContent = "Historia Académica por Semestre";
    title.className = "sia-semester-header";

    container.appendChild(title);

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

        if (semestreData.creditosReprobados > 0) {
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

    container.appendChild(wrapper);
}
