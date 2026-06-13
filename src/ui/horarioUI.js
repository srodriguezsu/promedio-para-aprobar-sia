import {
    loadSelectedSubjects,
    loadSelectedGroups,
    saveSelectedGroups,
    removeSubject,
    getConflictsForGroup
} from "../domain/scheduleManager.js";
import { updateButtonState } from "./originalUiInjector.js";

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

    const subjects = loadSelectedSubjects();
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

    const subjectsList = document.createElement("div");
    subjectsList.className = "sia-horario-subjects-list";

    subjects.forEach((subject) => {
        const item = document.createElement("div");
        item.className = "sia-horario-subject-item";

        const header = document.createElement("div");
        header.className = "subject-item-header";
        header.innerHTML = `
            <div class="subject-item-info">
                <h4>${subject.name}</h4>
                <span class="subject-item-meta">${subject.creditos || "?"} créditos - ${subject.tipologia || "N/A"}</span>
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
            subject.groups.forEach((g) => {
                const opt = document.createElement("option");
                opt.value = g.name;

                // Check for conflicts if this group were to be selected
                const conflicts = getConflictsForGroup(subject.name, g);
                const isCurrentlySelected = selectedGroupVal === g.name;

                let suffix = "";
                // If it conflicts and is NOT the currently selected group, flag it
                if (conflicts.length > 0 && !isCurrentlySelected) {
                    suffix = ` ⚠️ (Conflicto con: ${conflicts.map(c => c.subjectName).join(", ")})`;
                }

                opt.textContent = `${g.name} - ${g.profesor || "Sin profesor"}${suffix}`;
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

        // Display current selections conflict warning banner if exists
        const currentGroup = subject.groups?.find(g => g.name === selectedGroupVal);
        if (currentGroup) {
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
        subjectsList.appendChild(item);
    });

    configPanel.appendChild(subjectsList);
    splitView.appendChild(configPanel);

    // Right side: Visual calendar grid
    const calendarPanel = document.createElement("div");
    calendarPanel.className = "sia-horario-calendar-panel";

    const headerWrapper = document.createElement("div");
    headerWrapper.style.display = "flex";
    headerWrapper.style.justifyContent = "space-between";
    headerWrapper.style.alignItems = "center";
    headerWrapper.style.marginBottom = "15px";
    headerWrapper.style.borderBottom = "2px solid #f1f5f9";
    headerWrapper.style.paddingBottom = "8px";

    const calendarTitle = document.createElement("h3");
    calendarTitle.textContent = "Calendario Semanal";
    calendarTitle.style.fontSize = "1.25rem";
    calendarTitle.style.fontWeight = "600";
    calendarTitle.style.color = "#1e293b";
    calendarTitle.style.margin = "0";
    headerWrapper.appendChild(calendarTitle);

    const hasSelectedGroups = subjects.some(subj => selections[subj.name]);
    if (hasSelectedGroups) {
        const exportIcsBtn = document.createElement("button");
        exportIcsBtn.className = "sia-export-ics-btn";
        exportIcsBtn.innerHTML = "📅 Exportar a Calendario";
        
        exportIcsBtn.addEventListener("click", () => {
            try {
                const icsContent = generateIcs(subjects, selections);
                downloadBlob(icsContent, "sia_pro_horario.ics", "text/calendar;charset=utf-8;");
            } catch (error) {
                console.error("[SIA Pro] Error al exportar archivo .ics:", error);
                alert("Ocurrió un error al generar el archivo de calendario.");
            }
        });
        
        headerWrapper.appendChild(exportIcsBtn);
    }

    calendarPanel.appendChild(headerWrapper);

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

            block.innerHTML = `
                <div class="event-title" title="${subj.name}">${subj.name}</div>
                <div class="event-meta" title="${selectedGroup.name} - ${selectedGroup.profesor || "Sin prof."}">
                    ${selectedGroup.name} - ${selectedGroup.profesor ? selectedGroup.profesor.split(" ").slice(0, 2).join(" ") : "Sin prof."}
                </div>
                <div class="event-room" title="${h.aula}">${h.aula}</div>
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
 * Downloads a text/blob content as a file in the browser.
 * 
 * @param {string} content - The text content to download.
 * @param {string} filename - The output file name.
 * @param {string} contentType - The MIME type.
 * @returns {void}
 */
function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generates an iCalendar (.ics) formatted string from selected subjects and groups.
 * 
 * @param {Array.<Object>} subjects - List of all selected subjects.
 * @param {Object.<string, string>} selections - Map of subject name to selected group name.
 * @returns {string} The ICS file content.
 */
function generateIcs(subjects, selections) {
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SIA UNAL Pro//NONSGML Calendar Events//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ];

    const dayToNumber = {
        "DOMINGO": 0,
        "LUNES": 1,
        "MARTES": 2,
        "MIERCOLES": 3,
        "MIÉRCOLES": 3,
        "JUEVES": 4,
        "VIERNES": 5,
        "SABADO": 6,
        "SÁBADO": 6
    };

    const dayToIcsRecurrence = {
        "DOMINGO": "SU",
        "LUNES": "MO",
        "MARTES": "TU",
        "MIERCOLES": "WE",
        "MIÉRCOLES": "WE",
        "JUEVES": "TH",
        "VIERNES": "FR",
        "SABADO": "SA",
        "SÁBADO": "SA"
    };

    function parseLocalDate(dateStr) {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
    }

    function getFirstOccurrence(startDate, targetDayName) {
        const targetDay = dayToNumber[targetDayName.toUpperCase()];
        if (targetDay === undefined) return startDate;

        const resultDate = new Date(startDate);
        const startDay = resultDate.getDay();
        
        let diff = targetDay - startDay;
        if (diff < 0) {
            diff += 7;
        }
        resultDate.setDate(resultDate.getDate() + diff);
        return resultDate;
    }

    // Formats Date object and time string to YYYYMMDDTHHMMSS
    function formatIcsDateTime(date, timeStr) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const [hours, minutes] = timeStr.split(":");
        return `${year}${month}${day}T${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`;
    }

    function formatIcsUntilDate(dateStr) {
        const [day, month, year] = dateStr.split("/").map(Number);
        const pad = (n) => String(n).padStart(2, '0');
        return `${year}${pad(month)}${pad(day)}T235959Z`;
    }

    // Fallbacks if dates are not present in DOM (matches first semester of 2026)
    const DEFAULT_START_DATE = "02/02/2026";
    const DEFAULT_END_DATE = "13/06/2026";

    subjects.forEach((subj) => {
        const selectedGroupName = selections[subj.name];
        if (!selectedGroupName) return;

        const selectedGroup = subj.groups?.find(g => g.name === selectedGroupName);
        if (!selectedGroup || !selectedGroup.horarios) return;

        const startDateStr = selectedGroup.fechaInicio || DEFAULT_START_DATE;
        const endDateStr = selectedGroup.fechaFin || DEFAULT_END_DATE;

        const baseStartDate = parseLocalDate(startDateStr);
        const untilStr = formatIcsUntilDate(endDateStr);

        selectedGroup.horarios.forEach((h, index) => {
            const firstDate = getFirstOccurrence(baseStartDate, h.dia);
            const dtStart = formatIcsDateTime(firstDate, h.horaInicio);
            const dtEnd = formatIcsDateTime(firstDate, h.horaFin);
            const dayCode = dayToIcsRecurrence[h.dia.toUpperCase()] || "MO";

            const summary = `${subj.name} - ${selectedGroup.name}`;
            const description = `Profesor: ${selectedGroup.profesor || "Sin profesor asignado"}\\nAula: ${h.aula || "N/A"}\\nGrupo: ${selectedGroup.name}`;
            const location = h.aula || "Universidad Nacional de Colombia";

            const uid = `${Date.now()}-${subj.name.replace(/\s+/g, '_')}-${dayCode}-${index}@sia_pro`;

            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${uid}`);
            lines.push(`DTSTART;TZID=America/Bogota:${dtStart}`);
            lines.push(`DTEND;TZID=America/Bogota:${dtEnd}`);
            lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${untilStr};BYDAY=${dayCode}`);
            lines.push(`SUMMARY:${summary}`);
            lines.push(`DESCRIPTION:${description}`);
            lines.push(`LOCATION:${location}`);
            lines.push("END:VEVENT");
        });
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}
