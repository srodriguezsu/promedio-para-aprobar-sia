import { SELECTORS } from "../utils/selectors.js";
import { calculateCurrentGPA, normalizeSubjectName } from "../domain/gpaCalculator.js";
import {
    extractActivitiesFromDom,
    extractSubjectName,
    areGradeContainersAvailable
} from "../scraper/domScraper.js";

/**
 * Clears all injected required grade status elements from the DOM.
 * 
 * @returns {void}
 */
export function clearRequiredGradeUi() {
    document.querySelectorAll(SELECTORS.requiredGradeUi).forEach((el) => el.remove());
}

/**
 * Injects a label displaying the minimum grade needed to approve in the DOM container of each pending activity.
 * Displays a skull symbol if the required grade exceeds the maximum possible score (5.0).
 * 
 * @param {Object} data - The required grade calculation details.
 * @param {number} data.requiredGrade - The grade needed.
 * @param {Array.<Object>} data.activities - List of activities to update in the UI.
 * @returns {void}
 */
export function injectRequiredGradeUi(data) {
    if (!data || !data.activities) return;

    const { requiredGrade, activities } = data;
    // GPA grading system in UNAL is 0.0 - 5.0. Above 5.0 is impossible.
    const isNotPossible = requiredGrade > 5;

    activities.forEach((activity) => {
        if (!activity.container) return;

        const resultDiv = document.createElement("div");
        resultDiv.setAttribute("data-required-grade-ui", "true");
        resultDiv.classList.add("gpa-required-grade");

        // Format grade display. Append skull emoji if the grade is mathematically impossible.
        const gradeDisplay = isNotPossible
            ? Number(requiredGrade).toFixed(1) + " 💀"
            : Number(requiredGrade).toFixed(1);

        resultDiv.innerHTML = `
            <strong class="${isNotPossible ? "gpa-grade-impossible" : "gpa-grade-possible"}">Calificación mínima para aprobar: ${gradeDisplay}</strong>
        `;

        activity.container.appendChild(resultDiv);
    });
}

/**
 * Creates and injects a floating UI box in the bottom right corner showing the calculated GPA.
 * 
 * @param {number|string} gpaValue - The current calculated GPA score.
 * @param {string} [title="Promedio calculado"] - Header title for the GPA box.
 * @returns {void}
 */
export function injectGpaBox(gpaValue, title = "Promedio calculado") {
    if (gpaValue == null) return;
    if (document.querySelector(SELECTORS.gpaBox)) return;

    const box = document.createElement("div");
    box.id = SELECTORS.gpaBox.replace("#", "");
    const gpaText = (typeof gpaValue === "number") ? gpaValue.toFixed(1) : gpaValue;

    box.innerHTML = `
        <strong id="gpa-subject-name">📊 ${title}</strong>
        <div class="gpa-value">${gpaText}</div>
        <button id="gpa-refresh-btn">🔄 Calcular</button>
    `;

    document.body.appendChild(box);
}

/**
 * Updates the GPA value displayed inside the floating GPA box.
 * 
 * @param {number} gpaValue - The new GPA value.
 * @returns {void}
 */
export function updateGpaDisplay(gpaValue) {
    const gpaValueDiv = document.querySelector(SELECTORS.gpaValue);
    if (gpaValueDiv) {
        gpaValueDiv.textContent = gpaValue.toFixed(1);
    }
}

/**
 * Updates the course name header inside the floating GPA box.
 * 
 * @param {string} subjectName - Name of the subject.
 * @returns {void}
 */
export function updateSubjectName(subjectName) {
    const subjectNameDiv = document.querySelector(SELECTORS.gpaSubjectName);
    if (subjectNameDiv) {
        subjectNameDiv.textContent = `📊 ${subjectName}`;
    }
}

/**
 * Registers a callback function for when the recalculate/refresh button in the GPA box is clicked.
 * 
 * @param {function} onRefresh - Callback function to execute.
 * @returns {void}
 */
export function bindRefreshButton(onRefresh) {
    const refreshBtn = document.querySelector(SELECTORS.refreshButton);
    if (refreshBtn) {
        refreshBtn.addEventListener("click", onRefresh);
    }
}

/**
 * Renders the interactive GPA simulator panel inside the modal tab.
 * Allows simulating prospective grades for remaining activities, showing real-time changes
 * in the final subject score relative to actual grades.
 * 
 * @param {HTMLElement} container - The container element to mount the simulator inside.
 * @returns {void}
 */
export function renderGpa(container) {
    if (!container) return;
    container.innerHTML = "";
    
    // Check if the current page has course grades available
    if (!areGradeContainersAvailable()) {
        container.innerHTML = "<p>No hay datos disponibles.<br><br>Navega a <b>Información académica > Mis calificaciones</b> y selecciona una asignatura.</p>";
        return;
    }

    const activities = extractActivitiesFromDom();
    const subjectName = normalizeSubjectName(extractSubjectName());
    const { currentGPA: originalGPA } = calculateCurrentGPA(activities);

    // Subject header
    const header = document.createElement("h2");
    header.textContent = subjectName;
    container.appendChild(header);

    // Current calculated GPA display
    const gpaDisplay = document.createElement("p");
    gpaDisplay.className = "gpa-calc-display";
    container.appendChild(gpaDisplay);

    // Baseline original GPA display (shows difference when modified)
    const originalGpaDisplay = document.createElement("p");
    originalGpaDisplay.className = "gpa-calc-original-display";
    originalGpaDisplay.textContent = `${originalGPA.toFixed(2)}`;
    container.appendChild(originalGpaDisplay);

    const gradesContainer = document.createElement("div");
    gradesContainer.className = "gpa-calc-grades-container";

    /**
     * Recalculates GPA and updates display values based on simulated inputs.
     */
    const updateDisplay = () => {
        const { currentGPA } = calculateCurrentGPA(activities);
        gpaDisplay.textContent = currentGPA.toFixed(2);

        // Check if any of the grade inputs differ from original scrape data
        let anyChanged = false;
        activities.forEach(a => {
            const isOrigNaN = !Number.isFinite(a.originalGrade);
            const isCurrNaN = !Number.isFinite(a.grade);
            if (isOrigNaN !== isCurrNaN || (!isOrigNaN && a.grade !== a.originalGrade)) {
                anyChanged = true;
            }
        });

        // Show/hide comparison string depending on change detection
        originalGpaDisplay.style.display = anyChanged ? "block" : "none";

        let delta = currentGPA - originalGPA;
        if (Math.abs(delta) > 0.001) {
            const sign = delta > 0 ? "+" : "";
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)} (${sign}${delta.toFixed(2)})`;
        } else {
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)}`;
        }

        // Apply visual indicator class if GPA falls below the passing score of 2.96 (~3.0)
        gpaDisplay.classList.toggle("failing", currentGPA < 2.96);
    };

    // Render an input row for each course activity
    activities.forEach((activity) => {
        activity.originalGrade = activity.grade;
        const originalGrade = activity.originalGrade;

        const item = document.createElement("div");
        item.className = "gpa-calc-grade-item";

        // Display description and weight
        const label = document.createElement("span");
        label.textContent = `${activity.description} (${(activity.percentage * 100).toFixed(1)}%)`;
        label.className = "gpa-calc-grade-label";

        const inputContainer = document.createElement("div");
        inputContainer.className = "gpa-calc-input-container";

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "5";
        input.step = "0.1";
        input.value = Number.isFinite(originalGrade) ? originalGrade : "";
        input.placeholder = "-";
        input.className = "gpa-calc-grade-input";

        const origGradeSpan = document.createElement("span");
        origGradeSpan.textContent = `${Number.isFinite(originalGrade) ? originalGrade : "-"}`;
        origGradeSpan.className = "gpa-calc-original-grade-val";

        const updateInputColor = () => {
            input.classList.toggle("failing", Number.isFinite(activity.grade) && activity.grade < 2.96);
        };
        updateInputColor();

        // Register change listener on manual grade override
        input.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value);
            // Cap simulation inputs strictly within academic limits
            if (val > 5) {
                val = 5;
                e.target.value = "5";
            } else if (val < 0) {
                val = 0;
                e.target.value = "0";
            }
            activity.grade = isNaN(val) ? NaN : val;

            const isOrigNaN = !Number.isFinite(originalGrade);
            const isCurrNaN = !Number.isFinite(activity.grade);
            const isChanged = isOrigNaN !== isCurrNaN || (!isOrigNaN && activity.grade !== originalGrade);

            origGradeSpan.style.display = isChanged ? "block" : "none";

            if (isChanged && !isOrigNaN && !isCurrNaN) {
                let delta = activity.grade - originalGrade;
                const sign = delta > 0 ? "+" : "";
                origGradeSpan.textContent = `${originalGrade} (${sign}${delta.toFixed(2)})`;
            } else {
                origGradeSpan.textContent = `${Number.isFinite(originalGrade) ? originalGrade : "-"}`;
            }

            updateInputColor();
            updateDisplay();
        });

        inputContainer.appendChild(input);
        inputContainer.appendChild(origGradeSpan);

        item.appendChild(label);
        item.appendChild(inputContainer);
        gradesContainer.appendChild(item);
    });

    container.appendChild(gradesContainer);
    updateDisplay();
}
