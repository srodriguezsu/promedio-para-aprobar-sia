import { areCreditosAvailable, extractCreditosFromDom } from "../../scraper/domScraper.js";

/**
 * Renders a visual breakdown of credit progress grouped by academic component/typology.
 * Sorts regular components by progress percentage, placing totals at the bottom.
 * Displays progress bars showing approved credits and currently enrolled credits.
 * 
 * @param {HTMLElement} container - The DOM container where the credit progress UI will be rendered.
 * @returns {void}
 */
export function renderCreditosProgress(container) {
    if (!container) return;
    container.innerHTML = "";
    
    // Check if credit details are available in the DOM
    if (!areCreditosAvailable()) {
        container.innerHTML = "<p>No hay historia académica disponible.<br><br>Navega a <b>Información académica > Historia académica</b>.</p>";
        return;
    }
    const data = extractCreditosFromDom();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-tipologias-wrapper";

    const title = document.createElement("h2");
    title.textContent = "Créditos por Tipología";
    title.className = "sia-tipologias-header";

    container.appendChild(title);

    // 🔹 Separate general totals from regular component typologies
    const total = data.find(
        item => item.componente?.toUpperCase() === "TOTAL"
    );

    const totalEstudiante = data.find(
        item => item.componente?.toUpperCase() === "TOTAL ESTUDIANTE"
    );

    // 🔹 Filter for standard components only (e.g., Fundamentación Obligatoria, Libre Elección, etc.)
    const normales = data.filter(item => {
        const nombre = item.componente?.toUpperCase();
        return nombre !== "TOTAL" && nombre !== "TOTAL ESTUDIANTE";
    });

    // 🔹 Sort standard components by approved credit percentage descending
    normales.sort((a, b) => {
        const porcentajeA = a.exigidos ? a.aprobados / a.exigidos : 0;
        const porcentajeB = b.exigidos ? b.aprobados / b.exigidos : 0;
        return porcentajeB - porcentajeA;
    });

    // 🔹 Rebuild final sorted array placing standard components first, followed by totals
    const orderedData = [
        ...normales,
        ...(total ? [total] : []),
        ...(totalEstudiante ? [totalEstudiante] : [])
    ];

    // Render credit typologies overview cards
    for (const item of orderedData) {
        const {
            componente,
            exigidos,
            aprobados,
            inscritos,
            pendientes
        } = item;

        // Calculate progress percentage for approved credits
        const porcentajeAprobado = exigidos
            ? (aprobados / exigidos) * 100
            : 0;

        // Calculate total progress percentage including enrolled (in-progress) courses
        const porcentajeConInscritos = exigidos
            ? ((aprobados + inscritos) / exigidos) * 100
            : 0;

        const card = document.createElement("div");
        card.className = "sia-tipologia-card";

        card.innerHTML = `
            <div class="sia-tipologia-header">
                <h3>${componente}</h3>
                <span class="sia-tipologia-percent">
                    ${Math.round(porcentajeAprobado)}%
                </span>
            </div>

            <div class="sia-progress-bar">
                <div 
                    class="sia-progress-aprobado"
                    style="width: ${porcentajeAprobado}%"
                ></div>
                <div 
                    class="sia-progress-inscrito"
                    style="width: ${porcentajeConInscritos}%"
                >
                    <span>${Math.round(porcentajeConInscritos)}%</span>
                </div>
            </div>

            <div class="sia-tipologia-metrics">
                <span><strong>${aprobados}</strong> / ${exigidos} créditos</span>
                <span>Inscritos: ${inscritos} - Faltan: ${pendientes - inscritos} </span>
            </div>
        `;

        wrapper.appendChild(card);
    }

    container.appendChild(wrapper);
}