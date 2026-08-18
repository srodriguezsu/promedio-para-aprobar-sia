import {
    loadSelectedSubjects,
    loadSelectedGroups,
    saveSelectedGroups,
    removeSubject,
    getConflictsForGroup
} from "../domain/scheduleManager.js";
import { updateButtonState } from "./originalUiInjector.js";
import { isSubjectApproved, loadCachedAsignaturas } from "../domain/historyManager.js";
import { isSubjectAdded } from "../domain/scheduleManager.js";

/**
 * Renders the Horario simulator view inside the tab container.
 * Displays the list of selected subjects, group selectors with conflict alerts,
 * and a visual weekly calendar grid showing classes and overlaps.
 * 
 * @param {HTMLElement} container - The DOM element where the Horario view will be mounted.
 * @returns {void}
 */
export function renderHorario(container) {
    if (!container) return;
    container.innerHTML = "";

    const subjects = loadSelectedSubjects().sort((a, b) => {
        // 1. Sort by tipologia (alphabetically)
        const tipoA = (a.tipologia || "").toUpperCase();
        const tipoB = (b.tipologia || "").toUpperCase();
        if (tipoA !== tipoB) {
            return tipoA.localeCompare(tipoB);
        }
        
        // 2. Sort by credits (descending: more credits first)
        const credA = parseInt(a.creditos, 10) || 0;
        const credB = parseInt(b.creditos, 10) || 0;
        if (credA !== credB) {
            return credB - credA;
        }
        
        // 3. Sort by name (alphabetically)
        const nameA = (a.name || "").toUpperCase();
        const nameB = (b.name || "").toUpperCase();
        return nameA.localeCompare(nameB);
    });
    const selections = loadSelectedGroups();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-horario-wrapper";

    if (subjects.length === 0) {
        // Render empty state if no subjects are added
        const emptyState = document.createElement("div");
        emptyState.className = "sia-horario-empty-state";
        emptyState.innerHTML = `
            <div class="empty-icon">📅</div>
            <h3>Tu horario está vacío</h3>
            <p>Navega a <strong>Proceso de inscripción > Asignaturas disponibles para cursar</strong> y haz clic en <strong>➕ Agregar al Horario</strong> en las asignaturas que deseas tomar.</p>
        `;
        wrapper.appendChild(emptyState);
        container.appendChild(wrapper);
        return;
    }

    // Split view: Left for settings, Right for visual calendar
    const splitView = document.createElement("div");
    splitView.className = "sia-horario-split-view";

    const configPanel = document.createElement("div");
    configPanel.className = "sia-horario-config-panel";

    const panelTitle = document.createElement("h3");
    panelTitle.textContent = "Asignaturas Seleccionadas";
    panelTitle.className = "sia-horario-panel-title";
    configPanel.appendChild(panelTitle);

    // Calculate credit metrics (only for subjects with a group selected)
    let totalCredits = 0;
    let totalSubjectsWithGroup = 0;

    subjects.forEach((subject) => {
        const selectedGroupVal = selections[subject.name];
        if (selectedGroupVal) {
            const credits = parseInt(subject.creditos, 10) || 0;
            totalCredits += credits;
            totalSubjectsWithGroup++;
        }
    });

    const creditsSummary = document.createElement("div");
    creditsSummary.className = "sia-horario-credits-summary";

    creditsSummary.innerHTML = `
        <div class="credits-summary-header no-border">
            <div class="credits-main-metric">
                <span class="credits-total-num">${totalCredits}</span>
                <span class="credits-total-label">Créditos Seleccionados</span>
            </div>
            <div class="credits-sub-metrics">
                <div class="sub-metric">
                    <span class="metric-val">${totalSubjectsWithGroup}</span>
                    <span class="metric-lbl">Asignaturas</span>
                </div>
            </div>
        </div>
    `;
    configPanel.appendChild(creditsSummary);

    const subjectsList = document.createElement("div");
    subjectsList.className = "sia-horario-subjects-list";

    // Group subjects by typology
    const subjectsByTypology = {};
    subjects.forEach((subject) => {
        const tipo = subject.tipologia || "No especificada";
        if (!subjectsByTypology[tipo]) {
            subjectsByTypology[tipo] = [];
        }
        subjectsByTypology[tipo].push(subject);
    });

    // Sort typologies alphabetically
    const sortedTypologies = Object.keys(subjectsByTypology).sort((a, b) => {
        return a.toUpperCase().localeCompare(b.toUpperCase());
    });

    sortedTypologies.forEach((tipo) => {
        const typologySubjects = subjectsByTypology[tipo];
        
        // Calculate total selected credits for this typology
        let selectedCreditsForTipo = 0;
        typologySubjects.forEach((subject) => {
            const selectedGroupVal = selections[subject.name];
            if (selectedGroupVal) {
                selectedCreditsForTipo += parseInt(subject.creditos, 10) || 0;
            }
        });

        // Create a section container for this typology
        const section = document.createElement("div");
        section.className = "sia-horario-typology-section";

        const sectionHeader = document.createElement("div");
        sectionHeader.className = "sia-horario-typology-header";

        const formattedTipoName = tipo.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        sectionHeader.innerHTML = `
            <h4 class="sia-horario-typology-title">${formattedTipoName}</h4>
            <span class="sia-horario-typology-credits">${selectedCreditsForTipo} ${selectedCreditsForTipo === 1 ? 'crédito' : 'créditos'}</span>
        `;
        section.appendChild(sectionHeader);

        const sectionBody = document.createElement("div");
        sectionBody.className = "sia-horario-typology-body";

        typologySubjects.forEach((subject) => {
            const item = document.createElement("div");
            item.className = "sia-horario-subject-item";

            const header = document.createElement("div");
            header.className = "subject-item-header";
            header.innerHTML = `
                <div class="subject-item-info">
                    <h4>${subject.name}</h4>
                    <span class="subject-item-meta">${subject.creditos || "?"} créditos</span>
                </div>
                <button class="remove-subject-btn" title="Eliminar asignatura">🗑️</button>
            `;

            // Bind remove event
            header.querySelector(".remove-subject-btn").addEventListener("click", () => {
                removeSubject(subject.name);
                // Update the injected page button if it is currently displayed on this page
                updateButtonState(subject.name);
                // Rerender Horario tab
                renderHorario(container);
            });

            // Group selector
            const selectorContainer = document.createElement("div");
            selectorContainer.className = "group-selector-container";

            const label = document.createElement("label");
            label.textContent = "Seleccionar Grupo:";
            selectorContainer.appendChild(label);

            const select = document.createElement("select");
            select.className = "group-select-input";

            // Default option (None selected)
            const optNone = document.createElement("option");
            optNone.value = "";
            optNone.textContent = "-- Ninguno --";
            select.appendChild(optNone);

            const selectedGroupVal = selections[subject.name] || "";

            // Populate groups
            if (subject.groups) {
                const dayAbbrev = {
                    "LUNES": "Lun",
                    "MARTES": "Mar",
                    "MIERCOLES": "Mié",
                    "MIÉRCOLES": "Mié",
                    "JUEVES": "Jue",
                    "VIERNES": "Vie",
                    "SABADO": "Sáb",
                    "SÁBADO": "Sáb",
                    "DOMINGO": "Dom"
                };

                subject.groups.forEach((g) => {
                    const opt = document.createElement("option");
                    opt.value = g.name;

                    // Format the schedule string for the option description
                    const scheduleText = g.horarios ? g.horarios.map(h => {
                        const day = dayAbbrev[h.dia.toUpperCase()] || h.dia;
                        return `${day} ${h.horaInicio}-${h.horaFin}`;
                    }).join(", ") : "";

                    // Check for conflicts if this group were to be selected
                    const conflicts = getConflictsForGroup(subject.name, g);
                    const isCurrentlySelected = selectedGroupVal === g.name;

                    let suffix = "";
                    // If it conflicts and is NOT the currently selected group, flag it
                    if (conflicts.length > 0 && !isCurrentlySelected) {
                        suffix = ` ⚠️ (Conflicto con: ${conflicts.map(c => c.subjectName).join(", ")})`;
                    }

                    const cuposText = typeof g.cuposDisponibles === "number" ? ` | Cupos: ${g.cuposDisponibles}` : "";
                    const infoText = scheduleText ? ` - ${g.profesor || "Sin profesor"} (${scheduleText})${cuposText}` : ` - ${g.profesor || "Sin profesor"}${cuposText}`;
                    opt.textContent = `${g.name}${infoText}${suffix}`;
                    select.appendChild(opt);
                });
            }

            select.value = selectedGroupVal;

            // Listen for group selection changes
            select.addEventListener("change", (e) => {
                const val = e.target.value;
                const currentSelections = loadSelectedGroups();
                if (val) {
                    currentSelections[subject.name] = val;
                } else {
                    delete currentSelections[subject.name];
                }
                saveSelectedGroups(currentSelections);
                // Re-render Horario tab to update schedule calendar and conflict indicators
                renderHorario(container);
            });

            selectorContainer.appendChild(select);

            // Prerequisites logic and UI
            if (subject.prerrequistios && subject.prerrequistios.length > 0) {
                const prereqContainer = document.createElement("div");
                prereqContainer.className = "subject-prereq-container";
                const prereqToggle = document.createElement("button");
                prereqToggle.type = "button";
                prereqToggle.className = "subject-prereq-toggle";
                const prereqPanel = document.createElement("div");
                prereqPanel.className = "subject-prereq-panel";

                const historyData = loadCachedAsignaturas();
                const hasHistory = !!(historyData && Object.keys(historyData).length > 0);
                const getKnownApprovalStatus = (identifier) => {
                    if (!hasHistory) {
                        return { state: "unknown-history", label: "Historia académica no cargada" };
                    }

                    const approved = isSubjectApproved(identifier);
                    if (approved) {
                        return { state: "approved", label: "Aprobada" };
                    }

                    return { state: "not-approved", label: "No aprobada o no encontrada en la historia" };
                };

                const prereqStateKey = `sia_prereq_open_${subject.name}`;
                const storedState = localStorage.getItem(prereqStateKey);
                let prereqOpen = storedState === null ? false : storedState === "true";

                const syncToggle = () => {
                    prereqToggle.setAttribute("aria-expanded", prereqOpen ? "true" : "false");
                    prereqToggle.textContent = prereqOpen
                        ? "Prerrequisitos"
                        : "Prerrequisitos";
                    prereqPanel.hidden = !prereqOpen;
                    prereqContainer.classList.toggle("is-open", prereqOpen);
                };

                prereqToggle.addEventListener("click", () => {
                    prereqOpen = !prereqOpen;
                    localStorage.setItem(prereqStateKey, String(prereqOpen));
                    syncToggle();
                });

                subject.prerrequistios.forEach((pr, idx) => {
                    const conditionCard = document.createElement("div");
                    conditionCard.className = "subject-prereq-condition";

                    const headerPr = document.createElement("div");
                    headerPr.className = "subject-prereq-group-title";
                    headerPr.textContent = `Condición ${idx + 1}`;

                    const typeDesc = document.createElement("div");
                    typeDesc.className = "subject-prereq-type-desc";
                    typeDesc.textContent = pr.tipoDescripcion || "Sin descripción";

                    const todasLine = document.createElement("div");
                    todasLine.className = "subject-prereq-todas";

                    const reqs = pr.asignaturas || [];
                    let satisfiedCount = 0;

                    const list = document.createElement("ul");
                    list.className = "subject-prereq-list";

                    reqs.forEach((asigStr) => {
                        const codeMatch = asigStr.match(/\(([^)]+)\)$/);
                        const code = codeMatch ? codeMatch[1].trim() : null;
                        const name = asigStr.replace(/\([^)]*\)$/, "").trim();

                        const approvalStatus = getKnownApprovalStatus(code || name || asigStr);
                        const enrolledSimult = isSubjectAdded(name) || (code && isSubjectAdded(code));
                        const countsAsSatisfied = approvalStatus.state === "approved" || (pr.tipo === "E" && enrolledSimult);

                        if (countsAsSatisfied) {
                            satisfiedCount++;
                        }

                        const li = document.createElement("li");
                        li.className = "subject-prereq-item";

                        const status = document.createElement("span");
                        status.className = `prereq-status-dot prereq-status-dot-${approvalStatus.state}`;
                        if (approvalStatus.state === "approved") {
                            status.textContent = "✓";
                        } else if (approvalStatus.state === "unknown-history") {
                            status.textContent = "?";
                        } else {
                            status.textContent = "✖";
                        }

                        const text = document.createElement("span");
                        text.className = "subject-prereq-item-name";
                        text.textContent = asigStr;

                        li.appendChild(status);
                        li.appendChild(text);
                        list.appendChild(li);
                    });

                    const blockSatisfied = pr.todas ? (satisfiedCount === (reqs.length || 0)) : (satisfiedCount > 0);

                    todasLine.textContent = pr.todas ? "Requiere todas las asignaturas listadas." : "Basta con aprobar al menos una asignatura listada.";
                    todasLine.classList.toggle("is-satisfied", blockSatisfied);
                    todasLine.classList.toggle("is-unsatisfied", !blockSatisfied);

                    conditionCard.appendChild(headerPr);
                    conditionCard.appendChild(typeDesc);
                    conditionCard.appendChild(todasLine);
                    conditionCard.appendChild(list);
                    prereqPanel.appendChild(conditionCard);
                });

                prereqContainer.appendChild(prereqToggle);
                prereqContainer.appendChild(prereqPanel);
                syncToggle();
                item._prereqContainer = prereqContainer;
            }

            // Display current selections conflict warning banner if exists
            const currentGroup = subject.groups?.find(g => g.name === selectedGroupVal);
            if (currentGroup) {
                if (typeof currentGroup.cuposDisponibles === "number") {
                    const cuposBadge = document.createElement("div");
                    cuposBadge.className = "group-selection-cupos-banner";
                    cuposBadge.innerHTML = `🟢 <strong>Cupos disponibles:</strong> ${currentGroup.cuposDisponibles}`;
                    selectorContainer.appendChild(cuposBadge);
                }

                const activeConflicts = getConflictsForGroup(subject.name, currentGroup);
                if (activeConflicts.length > 0) {
                    const warning = document.createElement("div");
                    warning.className = "group-selection-warning-banner";
                    warning.innerHTML = `⚠️ <strong>Conflicto detectado:</strong> Horario coincide con ${activeConflicts.map(c => `<b>${c.subjectName} (${c.groupName})</b>`).join(", ")}`;
                    selectorContainer.appendChild(warning);
                    item.classList.add("has-conflict-border");
                }
            }

            item.appendChild(header);
            item.appendChild(selectorContainer);
            if (item._prereqContainer) {
                item.appendChild(item._prereqContainer);
            }
            sectionBody.appendChild(item);
        });

        section.appendChild(sectionBody);
        subjectsList.appendChild(section);
    });

    configPanel.appendChild(subjectsList);
    splitView.appendChild(configPanel);

    // Right side: Visual calendar grid
    const calendarPanel = document.createElement("div");
    calendarPanel.className = "sia-horario-calendar-panel";

    const calendarHeader = document.createElement("div");
    calendarHeader.className = "sia-horario-calendar-header";

    const calendarTitle = document.createElement("h3");
    calendarTitle.textContent = "Calendario Semanal";
    calendarTitle.className = "sia-horario-panel-title";
    calendarHeader.appendChild(calendarTitle);

    let hasAnyConflict = false;
    subjects.forEach((subj) => {
        const selectedGroupName = selections[subj.name];
        if (selectedGroupName) {
            const selectedGroup = subj.groups?.find(g => g.name === selectedGroupName);
            if (selectedGroup) {
                const activeConflicts = getConflictsForGroup(subj.name, selectedGroup);
                if (activeConflicts.length > 0) {
                    hasAnyConflict = true;
                }
            }
        }
    });

    const printBtn = document.createElement("button");
    printBtn.className = "sia-horario-print-btn";
    printBtn.innerHTML = "💾 Guardar PDF";
    if (hasAnyConflict) {
        printBtn.disabled = true;
        printBtn.title = "No puedes guardar el PDF si existen conflictos en tu horario.";
    } else {
        printBtn.addEventListener("click", () => {
            printSchedule(calendarPanel, subjects, selections);
        });
    }
    calendarHeader.appendChild(printBtn);

    calendarPanel.appendChild(calendarHeader);

    const calendarGrid = renderCalendarGrid(subjects, selections);
    calendarPanel.appendChild(calendarGrid);

    splitView.appendChild(calendarPanel);
    wrapper.appendChild(splitView);
    container.appendChild(wrapper);
}

/**
 * Generates and returns a weekly calendar DOM grid populated with selected group slots.
 * 
 * @param {Array.<Object>} subjects - List of all selected subjects.
 * @param {Object.<string, string>} selections - Map of subject name to selected group name.
 * @returns {HTMLElement} The calendar grid container element.
 */
function renderCalendarGrid(subjects, selections) {
    const grid = document.createElement("div");
    grid.className = "sia-calendar-grid";

    // Column headers: Time, Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
    const days = ["Hora", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
    
    // Grid template settings
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "70px repeat(7, 1fr)";
    grid.style.gridTemplateRows = "40px repeat(16, 40px)"; // 16 hour slots: 6:00 to 22:00

    // Render day headers
    days.forEach((day, index) => {
        const header = document.createElement("div");
        header.className = "calendar-header-cell";
        header.textContent = day;
        header.style.gridColumn = `${index + 1}`;
        header.style.gridRow = "1";
        grid.appendChild(header);
    });

    // Render hourly labels (6:00 to 22:00)
    for (let hour = 6; hour < 22; hour++) {
        const label = document.createElement("div");
        label.className = "calendar-hour-label";
        label.textContent = `${hour}:00`;
        label.style.gridColumn = "1";
        label.style.gridRow = `${hour - 6 + 2}`; // Offset by header row (1)
        grid.appendChild(label);
    }

    // Render background grid cells
    for (let col = 2; col <= 8; col++) {
        for (let row = 2; row <= 17; row++) {
            const cell = document.createElement("div");
            cell.className = "calendar-bg-cell";
            cell.style.gridColumn = `${col}`;
            cell.style.gridRow = `${row}`;
            grid.appendChild(cell);
        }
    }

    // Map days to grid column indexes
    const dayToCol = {
        "LUNES": 2,
        "MARTES": 3,
        "MIERCOLES": 4,
        "MIÉRCOLES": 4,
        "JUEVES": 5,
        "VIERNES": 6,
        "SABADO": 7,
        "SÁBADO": 7,
        "DOMINGO": 8
    };

    // Keep track of schedule blocks to colorize them consistently
    const colors = [
        "#0f6d59", // Green
        "#0284c7", // Blue
        "#7c3aed", // Purple
        "#db2777", // Pink
        "#ea580c", // Orange
        "#2563eb"  // Dark Blue
    ];
    const subjectColors = {};
    let colorIndex = 0;

    subjects.forEach((subj) => {
        const selectedGroupName = selections[subj.name];
        if (!selectedGroupName) return;

        const selectedGroup = subj.groups?.find(g => g.name === selectedGroupName);
        if (!selectedGroup || !selectedGroup.horarios) return;

        // Assign a distinct color to this subject
        if (!subjectColors[subj.name]) {
            subjectColors[subj.name] = colors[colorIndex % colors.length];
            colorIndex++;
        }
        const subjectColor = subjectColors[subj.name];

        // Check conflicts for this group to apply a warning theme if overlapping
        const hasConflicts = getConflictsForGroup(subj.name, selectedGroup).length > 0;

        selectedGroup.horarios.forEach((h) => {
            const col = dayToCol[h.dia.toUpperCase()];
            if (!col) return;

            // Extract numeric hours to compute row span positions
            const startHour = parseInt(h.horaInicio.split(":")[0], 10);
            const endHour = parseInt(h.horaFin.split(":")[0], 10);

            if (isNaN(startHour) || isNaN(endHour)) return;

            const rowStart = startHour - 6 + 2;
            const rowEnd = endHour - 6 + 2;

            const block = document.createElement("div");
            block.className = `calendar-event-block${hasConflicts ? " conflict" : ""}`;
            block.style.gridColumn = `${col}`;
            block.style.gridRow = `${rowStart} / ${rowEnd}`;
            
            if (!hasConflicts) {
                block.style.backgroundColor = subjectColor;
                block.style.borderLeftColor = darkenColor(subjectColor, 20);
            }

            const shortName = shortenCourseName(subj.name);
            
            // Build a detailed tooltip for hover info
            const tooltipParts = [
                `Asignatura: ${subj.name}`,
                selectedGroup.name,
                `Créditos: ${subj.creditos || "N/A"} | Tipología: ${subj.tipologia || "N/A"}`,
                `Profesor: ${selectedGroup.profesor || "Sin profesor"}`,
                `Horario: ${h.dia} ${h.horaInicio}-${h.horaFin}`,
                `Aula: ${h.aula || "Sin aula"} `
            ];
            if (typeof selectedGroup.cuposDisponibles === "number") {
                tooltipParts.push(`Cupos Disponibles: ${selectedGroup.cuposDisponibles}`);
            }
            block.title = tooltipParts.join("\n");

            block.innerHTML = `
                <div class="event-title">${shortName}</div>
                <div class="event-meta">
                    ${selectedGroup.name}
                </div>
                <div class="event-room">
                    📍 ${h.aula || 'No asignada'}
                </div>
                ${hasConflicts ? `<div class="event-conflict-badge">⚠️ Conflicto</div>` : ""}
            `;

            grid.appendChild(block);
        });
    });

    return grid;
}

/**
 * Utility function to darken a hex color value for block borders.
 * 
 * @param {string} hex - The hex color code.
 * @param {number} percent - The percentage to darken (0-100).
 * @returns {string} The darkened hex color code.
 */
function darkenColor(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
}

/**
 * Creates a hidden iframe, extracts current stylesheets, injects the calendar panel HTML,
 * detailed course list, and academic metrics, and triggers Chrome's native print dialog.
 * 
 * @param {HTMLElement} calendarPanel - The visual calendar element.
 * @param {HTMLElement} creditsSummary - The sidebar credits metrics container.
 * @param {Array.<Object>} subjects - List of all selected subjects.
 * @param {Object.<string, string>} selections - Map of subject name to selected group name.
 * @returns {void}
 */
/**
 * Creates a hidden iframe, extracts current stylesheets, injects the calendar panel HTML
 * and the detailed course list, and triggers Chrome's native print dialog.
 * 
 * @param {HTMLElement} calendarPanel - The visual calendar element.
 * @param {Array.<Object>} subjects - List of all selected subjects.
 * @param {Object.<string, string>} selections - Map of subject name to selected group name.
 * @returns {void}
 */
function printSchedule(calendarPanel, subjects, selections) {
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow.document;

    // Extract all stylesheets currently loaded in the DOM to preserve extension colors & designs
    let cssText = "";
    for (const sheet of document.styleSheets) {
        try {
            for (const rule of sheet.cssRules) {
                cssText += rule.cssText + "\n";
            }
        } catch (e) {
            // Ignore cross-origin stylesheet errors
        }
    }

    // Generate detailed table HTML for selected subjects
    let subjectsTableHTML = `
        <table class="print-subjects-table">
            <thead>
                <tr>
                    <th>Asignatura</th>
                    <th>Grupo</th>
                    <th>Créditos</th>
                    <th>Tipología</th>
                    <th>Profesor</th>
                    <th>Horario / Aula</th>
                </tr>
            </thead>
            <tbody>
    `;

    let hasSelectedSubjects = false;
    subjects.forEach(subj => {
        const selectedGroupName = selections[subj.name];
        if (!selectedGroupName) return;

        const selectedGroup = subj.groups?.find(g => g.name === selectedGroupName);
        if (!selectedGroup) return;

        hasSelectedSubjects = true;
        const scheduleStrings = selectedGroup.horarios.map(h => `${h.dia}: ${h.horaInicio}-${h.horaFin} (${h.aula})`).join("<br>");
        const componentText = subj.tipologia || "-";

        subjectsTableHTML += `
            <tr>
                <td><strong>${subj.name}</strong></td>
                <td>${selectedGroup.name}</td>
                <td>${subj.creditos}</td>
                <td>${componentText}</td>
                <td>${selectedGroup.profesor || "Sin prof."}</td>
                <td>${scheduleStrings}</td>
            </tr>
        `;
    });

    subjectsTableHTML += `
            </tbody>
        </table>
    `;

    if (!hasSelectedSubjects) {
        subjectsTableHTML = "<p class='no-subjects'>No has seleccionado grupos para tu horario.</p>";
    }

    doc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Horario SIA Pro</title>
                <style>
                    ${cssText}
                </style>
                <style>
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    body { 
                        padding: 0; 
                        margin: 0;
                        background: white !important; 
                        font-family: system-ui, -apple-system, sans-serif; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .sia-horario-calendar-panel { 
                        box-shadow: none !important; 
                        border: none !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                    }
                    /* Hide print action button in the output PDF */
                    .sia-horario-print-btn {
                        display: none !important;
                    }
                    
                    /* Force visible borders for the grid when printing */
                    .calendar-bg-cell {
                        border-bottom: 1px solid #cbd5e1 !important;
                        border-right: 1px solid #cbd5e1 !important;
                    }
                    .calendar-hour-label {
                        border-right: 2px solid #94a3b8 !important;
                        border-bottom: 1px solid #cbd5e1 !important;
                    }
                    .calendar-header-cell {
                        border-bottom: 2px solid #94a3b8 !important;
                        border-right: 1px solid #cbd5e1 !important;
                    }
                    
                    /* Detailed view styling for printing */
                    .print-details-container {
                        margin-top: 24px;
                        page-break-inside: avoid;
                    }
                    .print-details-container h3 {
                        margin-top: 0;
                        margin-bottom: 12px;
                        color: #0f6d59;
                        border-bottom: 2px solid #edf2f7;
                        padding-bottom: 8px;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .print-subjects-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10.5px;
                    }
                    .print-subjects-table th, .print-subjects-table td {
                        padding: 8px 10px;
                        text-align: left;
                        border-bottom: 1px solid #edf2f7;
                        line-height: 1.3;
                    }
                    .print-subjects-table th {
                        font-weight: 700;
                        color: #475569;
                        background: #f8fafc;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .print-subjects-table td {
                        color: #334155;
                    }
                    
                    /* Force contrast for colors inside grid cells during printing */
                    .calendar-event-block * {
                        color: #ffffff !important;
                    }
                    .calendar-event-block.conflict * {
                        color: #b91c1c !important;
                    }
                    /* Hide classroom info in calendar grid during printing */
                    .calendar-event-block .event-room {
                        display: none !important;
                    }
                </style>
            </head>
            <body>
                <div class="sia-horario-calendar-panel">
                    ${calendarPanel.innerHTML}
                </div>
                <div class="print-details-container">
                    <h3>Detalle de Asignaturas Seleccionadas</h3>
                    ${subjectsTableHTML}
                </div>
            </body>
        </html>
    `);
    doc.close();

    // Temporarily swap document title so Chrome uses it as the default PDF file name
    const originalTitle = document.title;
    document.title = "Mi Horario - SIA Pro";

    // Trigger printing and cleanup directly from content script (safe from CSP inline-script blocks)
    setTimeout(() => {
        printIframe.contentWindow.print();
        
        // Restore parent page title immediately after print dialog opens
        document.title = originalTitle;
        
        setTimeout(() => {
            printIframe.remove();
        }, 500);
    }, 500);
}

/**
 * Truncates course names to their first characters to fit cleanly inside calendar blocks.
 * 
 * @param {string} name - The original course name.
 * @returns {string} The shortened course name.
 */
function shortenCourseName(name) {
    if (!name) return "";
    if (name.length > 15) {
        return name.slice(0, 15).trim() + "...";
    }
    return name;
}
