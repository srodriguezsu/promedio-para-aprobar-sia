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

export function renderCreditosProgress(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const hostContainer = document.querySelector(
        "span.row.resumen-creditos.clear.af_panelGroupLayout"
    );
    if (!hostContainer) return;

    hostContainer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "sia-tipologias-wrapper";

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
                <span>Faltan: ${pendientes} - Inscritos: ${inscritos}</span>
            </div>
        `;

        wrapper.appendChild(card);
    }

    hostContainer.appendChild(wrapper);
}
