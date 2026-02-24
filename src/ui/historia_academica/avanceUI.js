import {
    areAsignaturasAvailable,
    areCreditosAvailable,
    extractAsignaturasFromDom, extractCreditosFromDom
} from "../../domain/historiaAcademica.js";

/**
 * Builds progress data from academic history, filtering and sorting regular semesters
 * @param {Object} asignaturasPorSemestre - Object with semesters as keys and course data as values
 * @returns {Array} Array of progress data with accumulated credits per semester
 */
function buildProgressData(asignaturasPorSemestre) {
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
function proyectarSemestres(progressData, totalExigidos) {
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
            semestre: `Proyección ${semestreIndex}`,
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
function calcularPromedioPorSemestre(progressData) {
    const totalSemestres = progressData.length;
    const totalCreditos = progressData.at(-1).acumulado;

    return totalCreditos / totalSemestres;
}

import Chart from "chart.js/auto";

/**
 * Renders a Chart.js line chart showing progress and projections
 * @param {HTMLElement} container - Container element for the chart
 * @param {Array} progressData - Historical progress data
 * @param {Array} proyeccion - Projected future data
 * @param {number} totalExigidos - Total credits required
 */
function renderChart(container, progressData, proyeccion, totalExigidos) {
    const canvas = document.createElement("canvas");
    canvas.style.maxHeight = "400px";
    container.appendChild(canvas);

    const labels = [
        ...progressData.map(p => p.semestre.replace(" Ordinaria", "")),
        ...proyeccion.map(p => p.semestre)
    ];

    const dataReal = progressData.map(p => p.acumulado);
    const dataProy = [
        ...Array(progressData.length - 1).fill(null),
        progressData.at(-1).acumulado,
        ...proyeccion.map(p => p.acumulado)
    ];

    new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Créditos Aprobados",
                    data: dataReal,
                    borderColor: "#4CAF50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "#4CAF50"
                },
                {
                    label: "Proyección",
                    data: dataProy,
                    borderColor: "#FF9800",
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    borderDash: [5, 5],
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "#FF9800"
                },
                {
                    label: "Meta Total",
                    data: Array(labels.length).fill(totalExigidos),
                    borderColor: "#f44336",
                    borderWidth: 2,
                    borderDash: [10, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' créditos';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: totalExigidos + 10,
                    ticks: {
                        stepSize: 20,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Créditos Acumulados',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Semestre',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renders the academic progress view with statistics, chart, and detailed table
 * Shows historical progress and future projections based on average performance
 * @param {HTMLElement} container - Container element where the progress view will be rendered
 */
export function renderAvanceProgress(container) {
    if (!container) return;
    container.innerHTML = "";

    if (!areAsignaturasAvailable()) {
        container.innerHTML = "<p>No hay historia académica disponible.</p>";
        return;
    }
    if (!areCreditosAvailable()) {
        container.innerHTML = "<p>No hay datos de créditos disponibles.</p>";
        return;
    }

    const creditos = extractCreditosFromDom();
    const asignaturas = extractAsignaturasFromDom();

    // Obtener el total de créditos exigidos
    const totalData = creditos.find(c => c.componente?.toUpperCase() === "TOTAL");
    if (!totalData) {
        container.innerHTML = "<p>No se encontró el total de créditos exigidos.</p>";
        return;
    }

    const totalExigidos = totalData.exigidos;

    // Construir datos de progreso
    const progressData = buildProgressData(asignaturas);

    if (progressData.length === 0) {
        container.innerHTML = "<p>No hay suficientes datos para generar la proyección.</p>";
        return;
    }

    // Proyectar semestres faltantes
    const proyeccion = proyectarSemestres(progressData, totalExigidos);

    // Calcular estadísticas
    const creditosAprobados = progressData.at(-1).acumulado;
    const creditosPendientes = totalExigidos - creditosAprobados;
    const promedioPorSemestre = calcularPromedioPorSemestre(progressData);
    const porcentajeCompletado = ((creditosAprobados / totalExigidos) * 100).toFixed(1);

    // Crear wrapper principal
    const wrapper = document.createElement("div");
    wrapper.className = "sia-avance-wrapper";

    // Título
    const title = document.createElement("h2");
    title.textContent = "Proyección de Avance Académico";
    title.className = "sia-avance-header";

    // Tarjetas de estadísticas
    const statsContainer = document.createElement("div");
    statsContainer.className = "sia-avance-stats";
    statsContainer.innerHTML = `
        <div class="sia-stat-card">
            <div class="sia-stat-label">Créditos Aprobados</div>
            <div class="sia-stat-value">${creditosAprobados} / ${totalExigidos}</div>
            <div class="sia-stat-subtitle">${porcentajeCompletado}% completado</div>
        </div>
        <div class="sia-stat-card">
            <div class="sia-stat-label">Promedio por Semestre</div>
            <div class="sia-stat-value">${promedioPorSemestre.toFixed(1)}</div>
            <div class="sia-stat-subtitle">créditos aprobados</div>
        </div>
        <div class="sia-stat-card">
            <div class="sia-stat-label">Semestres Proyectados</div>
            <div class="sia-stat-value">${proyeccion.length}</div>
            <div class="sia-stat-subtitle">para completar ${creditosPendientes} créditos</div>
        </div>
    `;

    // Contenedor del gráfico
    const chartContainer = document.createElement("div");
    chartContainer.className = "sia-chart-container";

    // Tabla detallada de progreso
    const tableContainer = document.createElement("div");
    tableContainer.className = "sia-progress-table-container";

    const tableTitle = document.createElement("h3");
    tableTitle.textContent = "Detalle por Semestre";
    tableTitle.className = "sia-progress-table-title";

    const table = document.createElement("table");
    table.className = "sia-progress-table";

    let tableHTML = `
        <thead>
            <tr>
                <th>Semestre</th>
                <th>Créditos del Semestre</th>
                <th>Créditos Acumulados</th>
                <th>% del Total</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Add real data rows
    for (const item of progressData) {
        const porcentaje = ((item.acumulado / totalExigidos) * 100).toFixed(1);
        tableHTML += `
            <tr>
                <td class="semestre-name">${item.semestre.replace(" Ordinaria", "")}</td>
                <td class="creditos-semestre">${item.creditosDelSemestre}</td>
                <td class="creditos-acumulado">${item.acumulado}</td>
                <td class="porcentaje">${porcentaje}%</td>
            </tr>
        `;
    }

    // Add projection rows
    for (let i = 0; i < proyeccion.length; i++) {
        const item = proyeccion[i];
        const creditosDelSemestre = i === 0
            ? item.acumulado - progressData.at(-1).acumulado
            : item.acumulado - proyeccion[i - 1].acumulado;
        const porcentaje = ((item.acumulado / totalExigidos) * 100).toFixed(1);

        tableHTML += `
            <tr class="proyeccion-row">
                <td class="semestre-name">${item.semestre}</td>
                <td class="creditos-semestre">${creditosDelSemestre}</td>
                <td class="creditos-acumulado">${item.acumulado}</td>
                <td class="porcentaje">${porcentaje}%</td>
            </tr>
        `;
    }

    tableHTML += `
        </tbody>
    `;

    table.innerHTML = tableHTML;
    tableContainer.appendChild(tableTitle);
    tableContainer.appendChild(table);

    // Agregar elementos al container
    container.appendChild(title);
    container.appendChild(statsContainer);
    container.appendChild(chartContainer);
    container.appendChild(tableContainer);

    // Renderizar el gráfico
    renderChart(chartContainer, progressData, proyeccion, totalExigidos);
}