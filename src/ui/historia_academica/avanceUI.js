import {
    buildProgressData,
    calcularPromedioPorSemestre,
    proyectarSemestres
} from "../../domain/historiaAcademica.js";
import {
    areAsignaturasAvailable,
    areCreditosAvailable,
    extractAsignaturasFromDom,
    extractCreditosFromDom
} from "../../scraper/domScraper.js";
import {
    saveCachedAsignaturas,
    loadCachedAsignaturas,
    saveCachedCreditos,
    loadCachedCreditos
} from "../../domain/historyManager.js";





import Chart from "chart.js/auto";

/**
 * Renders a Chart.js line chart showing chronological credit progress and projections.
 * Plugs two datasets (real progress and future projection) into a canvas element.
 * 
 * @param {HTMLElement} container - Container element where the canvas will be injected.
 * @param {Array.<{
 *   semestre: string,
 *   acumulado: number,
 *   creditosDelSemestre: number
 * }>} progressData - Historical credit progress records.
 * @param {Array.<{
 *   semestre: string,
 *   acumulado: number
 * }>} proyeccion - Simulated future semesters projection.
 * @param {number} totalExigidos - Total credits required for graduation.
 * @returns {void}
 */
function renderChart(container, progressData, proyeccion, totalExigidos) {
    // Create tab buttons for switching chart metric
    const btnContainer = document.createElement("div");
    btnContainer.className = "sia-chart-tabs";
    btnContainer.innerHTML = `
        <button class="sia-chart-tab-btn active" data-metric="credits">Créditos Acumulados</button>
        <button class="sia-chart-tab-btn" data-metric="papa">Evolución del PAPA</button>
    `;
    container.appendChild(btnContainer);

    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "sia-chart-canvas-wrapper";
    container.appendChild(canvasWrapper);

    let activeMetric = "credits";
    let chartInstance = null;

    const renderChartInstance = (metric) => {
        // Destroy existing instance if there is one
        if (chartInstance) {
            chartInstance.destroy();
        }
        canvasWrapper.innerHTML = "";

        const canvas = document.createElement("canvas");
        canvas.style.maxHeight = "400px";
        canvasWrapper.appendChild(canvas);

        if (metric === "credits") {
            // Set horizontal axis labels combining past/current semesters and projection steps
            const labels = [
                ...progressData.map(p => p.semestre.replace(" Ordinaria", "")),
                ...proyeccion.map(p => p.semestre)
            ];

            // Real progress dataset (e.g. [16, 36, 52, 68])
            const dataReal = progressData.map(p => p.acumulado);

            // Projection dataset. Offset it with null values so it aligns seamlessly with the end of real data
            const dataProy = [
                ...Array(progressData.length - 1).fill(null),
                progressData.at(-1).acumulado, // Connect projection line directly to the last real data point
                ...proyeccion.map(p => p.acumulado)
            ];

            chartInstance = new Chart(canvas, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Avance",
                            data: dataReal,
                            borderColor: "#0f6d59",
                            backgroundColor: "rgba(15,109,89,0.1)",
                            borderWidth: 3,
                            tension: 0.3,
                            fill: true,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointBackgroundColor: "#0f6d59"
                        },
                        {
                            label: "Proyección",
                            data: dataProy,
                            borderColor: "#f3c231",
                            backgroundColor: "rgba(243,194,49,0.1)",
                            borderDash: [5, 5],
                            borderWidth: 3,
                            tension: 0.3,
                            fill: true,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointBackgroundColor: "#f3c231"
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
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += ((context.parsed.y / totalExigidos) * 100).toFixed(1) + '% (' + context.parsed.y + ' créditos)';
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
        } else if (metric === "papa") {
            // For PAPA, we only show historical semesters (no projection)
            const labels = progressData.map(p => p.semestre.replace(" Ordinaria", ""));
            const dataPapa = progressData.map(p => p.papaAcumulado);

            chartInstance = new Chart(canvas, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "PAPA Acumulado",
                            data: dataPapa,
                            borderColor: "#0f6d59",
                            backgroundColor: "rgba(15,109,89,0.1)",
                            borderWidth: 3,
                            tension: 0.2,
                            fill: true,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointBackgroundColor: "#0f6d59"
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
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y.toFixed(2);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 11
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            title: {
                                display: true,
                                text: 'PAPA Acumulado',
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
    };

    // Render initial chart
    renderChartInstance(activeMetric);

    // Event listener for tab switching
    btnContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".sia-chart-tab-btn");
        if (!btn || btn.classList.contains("active")) return;

        // Toggle active button style
        btnContainer.querySelectorAll(".sia-chart-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        activeMetric = btn.dataset.metric;
        renderChartInstance(activeMetric);
    });
}

/**
 * Renders the academic progress view with statistics, chart, and detailed table.
 * Shows historical progress and future projections based on average performance.
 * 
 * @param {HTMLElement} container - Container element where the progress view will be rendered.
 * @returns {void}
 */
export function renderAvanceProgress(container) {
    if (!container) return;
    container.innerHTML = "";

    let creditos = null;
    let asignaturas = null;

    // Try to scrape first if currently viewing the history page
    if (areAsignaturasAvailable() && areCreditosAvailable()) {
        creditos = extractCreditosFromDom();
        asignaturas = extractAsignaturasFromDom();
        saveCachedCreditos(creditos);
        saveCachedAsignaturas(asignaturas);
    } else {
        // Fallback to loaded cache
        creditos = loadCachedCreditos();
        asignaturas = loadCachedAsignaturas();
    }

    // If no cached or DOM data exists, display helper instructions
    if (!creditos || creditos.length === 0 || !asignaturas || Object.keys(asignaturas).length === 0) {
        container.innerHTML = "<p>No hay historia académica disponible.<br><br>Navega a <b>Información académica > Historia académica</b> para cargar tus datos por primera vez.</p>";
        return;
    }

    // Fetch graduation threshold (TOTAL component row in credit table)
    const totalData = creditos.find(c => c.componente?.toUpperCase() === "TOTAL");
    if (!totalData) {
        container.innerHTML = "<p>No se encontró el total de créditos exigidos.</p>";
        return;
    }

    const totalExigidos = totalData.exigidos;

    // Build historical progress dataset
    const progressData = buildProgressData(asignaturas);

    if (progressData.length === 0) {
        container.innerHTML = "<p>No hay suficientes datos para generar la proyección.</p>";
        return;
    }

    // Project semesters needed to reach graduation requirements
    const proyeccion = proyectarSemestres(progressData, totalExigidos);

    // Create container elements
    const title = document.createElement("h2");
    title.textContent = "Proyección de Avance Académico";
    title.className = "sia-avance-header";

    // Chart container
    const chartContainer = document.createElement("div");
    chartContainer.className = "sia-chart-container";

    // Detailed table container
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
                <th>PAPA Acumulado</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Populate table with real historical records
    for (const item of progressData) {
        const porcentaje = ((item.acumulado / totalExigidos) * 100).toFixed(1);
        tableHTML += `
            <tr>
                <td class="semestre-name">${item.semestre.replace(" Ordinaria", "")}</td>
                <td class="creditos-semestre">${item.creditosDelSemestre}</td>
                <td class="creditos-acumulado">${item.acumulado}</td>
                <td class="porcentaje">${porcentaje}%</td>
                <td class="papa-acumulado">${item.papaAcumulado ? item.papaAcumulado.toFixed(2) : "-"}</td>
            </tr>
        `;
    }

    // Populate table with simulated/projected rows
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
                <td class="papa-acumulado">-</td>
            </tr>
        `;
    }

    tableHTML += `
        </tbody>
    `;

    table.innerHTML = tableHTML;
    tableContainer.appendChild(tableTitle);
    tableContainer.appendChild(table);

    // Append child components to main view container
    container.appendChild(title);
    container.appendChild(chartContainer);
    container.appendChild(tableContainer);

    // Render visual line graph
    renderChart(chartContainer, progressData, proyeccion, totalExigidos);
}