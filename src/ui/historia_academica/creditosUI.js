import {areCreditosAvailable, extractCreditosFromDom} from "../../domain/historiaAcademica.js";

export function renderCreditosProgress(container) {
    if (!container) return;
    container.innerHTML = "";
    if (!areCreditosAvailable()) {
        container.innerHTML = "<p>No hay datos de créditos disponibles.</p>";
        return;
    }
    const data = extractCreditosFromDom();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-tipologias-wrapper";

    const title = document.createElement("h2");
    title.textContent = "Créditos por Tipología";
    title.className = "sia-tipologias-header";

    container.appendChild(title);

    // 🔹 Separar totales
    const total = data.find(
        item => item.componente?.toUpperCase() === "TOTAL"
    );

    const totalEstudiante = data.find(
        item => item.componente?.toUpperCase() === "TOTAL ESTUDIANTE"
    );

    // 🔹 Filtrar los demás
    const normales = data.filter(item => {
        const nombre = item.componente?.toUpperCase();
        return nombre !== "TOTAL" && nombre !== "TOTAL ESTUDIANTE";
    });

    // 🔹 Ordenar normales por porcentaje aprobado
    normales.sort((a, b) => {
        const porcentajeA = a.exigidos ? a.aprobados / a.exigidos : 0;
        const porcentajeB = b.exigidos ? b.aprobados / b.exigidos : 0;
        return porcentajeB - porcentajeA;
    });

    // 🔹 Reconstruir array final
    const orderedData = [
        ...normales,
        ...(total ? [total] : []),
        ...(totalEstudiante ? [totalEstudiante] : [])
    ];

    for (const item of orderedData) {
        const {
            componente,
            exigidos,
            aprobados,
            inscritos,
            pendientes
        } = item;

        const porcentajeAprobado = exigidos
            ? (aprobados / exigidos) * 100
            : 0;

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