import { areAsignaturasAvailable, extractAsignaturasFromDom } from "../../scraper/domScraper.js";
import { saveCachedAsignaturas, loadCachedAsignaturas } from "../../domain/historyManager.js";

/**
 * Enables mouse drag-to-scroll functionality horizontally on a given container element.
 * Useful for horizontal layouts like semester lists on desktop screens.
 * 
 * @param {HTMLElement} container - The DOM element to apply drag-to-scroll behavior.
 * @returns {void}
 */
function enableDragScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Track when mouse button is pressed down within the container
    container.addEventListener("mousedown", (e) => {
        isDown = true;
        container.classList.add("dragging");
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    // Reset status when mouse cursor leaves container boundary
    container.addEventListener("mouseleave", () => {
        isDown = false;
    });

    // Reset status when mouse button is released
    container.addEventListener("mouseup", () => {
        isDown = false;
    });

    // Scroll the container horizontally depending on drag movement distance
    container.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.2; // Speed multiplier for smooth dragging
        container.scrollLeft = scrollLeft - walk;
    });
}

/**
 * Renders the semester-grouped academic history overview inside the provided container.
 * Sorts semesters descending (most recent first) and displays subjects/courses inside
 * cards showing metadata like credits, component typology, and final grades.
 * 
 * @param {HTMLElement} container - The DOM container where the history UI will be rendered.
 * @returns {void}
 */
export function renderHistoriaAcademica(container) {
    if (!container) return;
    container.innerHTML = "";
    
    let data = null;

    // Try to scrape first if currently viewing the history page
    if (areAsignaturasAvailable()) {
        data = extractAsignaturasFromDom();
        saveCachedAsignaturas(data);
    } else {
        // Fallback to loaded cache
        data = loadCachedAsignaturas();
    }

    // If no data exists in DOM or cache, show loading helper
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = "<p>No hay historia académica disponible.<br><br>Navega a <b>Información académica > Historia académica</b> para cargar tus datos por primera vez.</p>";
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "sia-semester-wrapper";

    // Bind horizontal scrolling behaviour
    enableDragScroll(wrapper);

    const title = document.createElement("h2");
    title.textContent = "Historia Académica por Semestre";
    title.className = "sia-semester-header";

    container.appendChild(title);

    // Sort semesters descending (e.g., 2025-2S > 2025-1S > 2024-2S)
    const sortedSemestres = Object.keys(data).sort().reverse();

    for (const semestre of sortedSemestres) {
        const semestreData = data[semestre];
        const materias = [...(semestreData.asignaturas || [])];

        // Sort subjects by grade descending, placing ungraded or pending ones (null) at the end
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

        // Display failed credits separately if the student failed any courses this semester
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

        // Render cards for each course
        for (const asignatura of materias) {
            const card = document.createElement("div");
            card.className = "sia-asignatura-card";

            // Normalize state classes to lowercase with hyphens for CSS styling
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
