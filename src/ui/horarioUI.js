import { extractAsignaturaParaCursar } from "../scraper/domScraper.js";

/**
 * Renders the Horario tab content.
 * Scrapes the enrollment subjects using {@link extractAsignaturaParaCursar}, prints them
 * to the developer console, and renders a visually appealing summary inside the container.
 * 
 * @param {HTMLElement} container - The DOM container element where the Horario view will be rendered.
 * @returns {void}
 */
export function renderHorario(container) {
    if (!container) return;
    container.innerHTML = "";

    // Trigger the scraper which console.logs the subjects for enrollment
    const subjects = extractAsignaturaParaCursar();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-horario-wrapper";

    const title = document.createElement("h2");
    title.textContent = "Horario & Inscripción";
    title.className = "sia-horario-header";
    container.appendChild(title);

    // Create a gorgeous notification box/banner
    const banner = document.createElement("div");
    banner.className = "sia-horario-banner";
    
    if (subjects.length > 0) {
        banner.innerHTML = `
            <div class="sia-horario-banner-icon">📅</div>
            <div class="sia-horario-banner-text">
                <h3>Asignaturas para Inscripción Detectadas</h3>
                <p>Se han impreso <strong>${subjects.length} asignaturas</strong> en la consola de desarrollador para tu análisis.</p>
            </div>
        `;
        wrapper.appendChild(banner);

        // Render a preview list of detected subjects in a premium card design
        const listTitle = document.createElement("h3");
        listTitle.textContent = "Lista de Asignaturas Detectadas";
        listTitle.className = "sia-horario-list-title";
        wrapper.appendChild(listTitle);

        const listContainer = document.createElement("div");
        listContainer.className = "sia-horario-list";

        subjects.forEach((name) => {
            const card = document.createElement("div");
            card.className = "sia-horario-card";
            card.innerHTML = `
                <div class="sia-horario-card-icon">📖</div>
                <div class="sia-horario-card-name">${name}</div>
            `;
            listContainer.appendChild(card);
        });
        wrapper.appendChild(listContainer);
    } else {
        banner.className += " empty";
        banner.innerHTML = `
            <div class="sia-horario-banner-icon">ℹ️</div>
            <div class="sia-horario-banner-text">
                <h3>Sin asignaturas de inscripción en pantalla</h3>
                <p>Navega a la sección de <strong>Inscripción de Asignaturas</strong> en el SIA para ver la lista y el horario interactivo.</p>
            </div>
        `;
        wrapper.appendChild(banner);
    }

    container.appendChild(wrapper);
}
