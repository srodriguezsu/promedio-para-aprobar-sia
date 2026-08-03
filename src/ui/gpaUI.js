import { SELECTORS } from "../utils/selectors.js";
import { calculateCurrentGPA, normalizeSubjectName } from "../domain/gpaCalculator.js";
import {
    extractActivitiesFromDom,
    extractSubjectName,
    areGradeContainersAvailable
} from "../scraper/domScraper.js";
import {
    saveGpaSimulationForSubject,
    loadGpaSimulationForSubject,
    saveGpaCachedSubject,
    loadAllGpaCachedSubjects
} from "../domain/historyManager.js";

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
 * Allows selecting cached subjects or automatically scraping the active subject,
 * then delegates details rendering.
 * 
 * @param {HTMLElement} container - The container element to mount the simulator inside.
 * @returns {void}
 */
export function renderGpa(container) {
    if (!container) return;
    container.innerHTML = "";

    // 1. Scrape and cache the active subject from the DOM if we are on the grades page
    if (areGradeContainersAvailable()) {
        const domSubjectName = normalizeSubjectName(extractSubjectName());
        if (domSubjectName && domSubjectName !== "N/A") {
            const domActivities = extractActivitiesFromDom();
            saveGpaCachedSubject(domSubjectName, domActivities);
            localStorage.setItem("sia_pro_gpa_selected_subject", domSubjectName);
        }
    }

    // 2. Load cached subjects
    const cachedSubjects = loadAllGpaCachedSubjects();
    const cachedSubjectNames = Object.keys(cachedSubjects);

    // 3. Fallback if no subjects have been cached
    if (cachedSubjectNames.length === 0) {
        container.innerHTML = "<p>No hay datos disponibles.<br><br>Navega a <b>Información académica > Mis calificaciones</b> y selecciona una asignatura para comenzar.</p>";
        return;
    }

    // 4. Determine currently selected subject
    let selectedSubject = localStorage.getItem("sia_pro_gpa_selected_subject");
    if (!selectedSubject || !cachedSubjects[selectedSubject]) {
        selectedSubject = cachedSubjectNames[0];
        localStorage.setItem("sia_pro_gpa_selected_subject", selectedSubject);
    }

    // 5. Create dropdown selector UI
    const selectorContainer = document.createElement("div");
    selectorContainer.className = "gpa-selector-container";

    const label = document.createElement("label");
    label.setAttribute("for", "gpa-subject-select");
    label.className = "gpa-select-label";
    label.textContent = "Seleccionar asignatura:";
    selectorContainer.appendChild(label);

    const select = document.createElement("select");
    select.id = "gpa-subject-select";
    select.className = "gpa-subject-select";

    cachedSubjectNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === selectedSubject) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    selectorContainer.appendChild(select);
    container.appendChild(selectorContainer);

    // 6. Create details container
    const detailsContainer = document.createElement("div");
    detailsContainer.id = "gpa-calc-details-container";
    container.appendChild(detailsContainer);

    // 7. Render details for the selected subject
    renderGpaDetails(detailsContainer, selectedSubject, cachedSubjects[selectedSubject]);

    // 8. Bind dropdown changes
    select.addEventListener("change", (e) => {
        const newSelected = e.target.value;
        localStorage.setItem("sia_pro_gpa_selected_subject", newSelected);
        renderGpaDetails(detailsContainer, newSelected, cachedSubjects[newSelected]);
    });
}

/**
 * Renders the GPA details list (calculated GPA, original grades comparison, simulated input rows)
 * for a specific subject using cached or scraped data.
 * 
 * @param {HTMLElement} container - The container element to render details inside.
 * @param {string} subjectName - The name of the subject.
 * @param {Array.<Object>} originalActivities - The original grade activities array.
 * @returns {void}
 */
export function renderGpaDetails(container, subjectName, originalActivities) {
    if (!container || !subjectName || !originalActivities) return;
    container.innerHTML = "";

    // Clone/map the activities to prevent mutating the original cached objects in memory directly
    const activities = originalActivities.map(a => ({
        description: a.description,
        percentage: a.percentage,
        grade: a.grade,
        originalGrade: a.grade
    }));

    // Load saved GPA simulations for this subject
    const savedSimulations = loadGpaSimulationForSubject(subjectName);

    // Apply saved simulations if present
    activities.forEach((activity) => {
        const savedGrade = savedSimulations[activity.description];
        if (savedGrade !== undefined) {
            activity.grade = savedGrade;
        }
    });

    // Calculate baseline original GPA based on the original cached grades
    const originalGPAActivities = activities.map(a => ({
        grade: a.originalGrade,
        percentage: a.percentage,
        description: a.description
    }));
    const { currentGPA: originalGPA } = calculateCurrentGPA(originalGPAActivities);

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

        // Check if any of the grade inputs differ from original cached data
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
        // Show the simulated grade if available, otherwise fallback to original
        input.value = Number.isFinite(activity.grade) ? activity.grade : "";
        input.placeholder = "-";
        input.className = "gpa-calc-grade-input";

        const origGradeSpan = document.createElement("span");
        origGradeSpan.textContent = `${Number.isFinite(originalGrade) ? originalGrade : "-"}`;
        origGradeSpan.className = "gpa-calc-original-grade-val";

        const isOrigNaN = !Number.isFinite(originalGrade);
        const isCurrNaN = !Number.isFinite(activity.grade);
        const isInitialChanged = isOrigNaN !== isCurrNaN || (!isOrigNaN && activity.grade !== originalGrade);
        if (isInitialChanged) {
            origGradeSpan.style.display = "block";
            if (!isCurrNaN) {
                const origVal = isOrigNaN ? 0 : originalGrade;
                const delta = activity.grade - origVal;
                const sign = delta > 0 ? "+" : "";
                const origDisplay = isOrigNaN ? "-" : originalGrade;
                origGradeSpan.textContent = `${origDisplay} (${sign}${delta.toFixed(2)})`;
            } else {
                origGradeSpan.textContent = `${Number.isFinite(originalGrade) ? originalGrade : "-"}`;
            }
        }

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

            // Save the updated simulation to localStorage
            const updatedSimulations = loadGpaSimulationForSubject(subjectName);
            if (Number.isFinite(activity.grade)) {
                updatedSimulations[activity.description] = activity.grade;
            } else {
                delete updatedSimulations[activity.description];
            }
            saveGpaSimulationForSubject(subjectName, updatedSimulations);

            const isOrigNaN = !Number.isFinite(originalGrade);
            const isCurrNaN = !Number.isFinite(activity.grade);
            const isChanged = isOrigNaN !== isCurrNaN || (!isOrigNaN && activity.grade !== originalGrade);

            origGradeSpan.style.display = isChanged ? "block" : "none";

            if (isChanged && !isCurrNaN) {
                const origVal = isOrigNaN ? 0 : originalGrade;
                const delta = activity.grade - origVal;
                const sign = delta > 0 ? "+" : "";
                const origDisplay = isOrigNaN ? "-" : originalGrade;
                origGradeSpan.textContent = `${origDisplay} (${sign}${delta.toFixed(2)})`;
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
