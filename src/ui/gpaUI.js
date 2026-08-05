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

    // --- GOAL GRADE SIMULATOR UI ---
    // The goal simulator allows users to set a target grade for the course.
    // When active, it calculates the required grade for ungraded elements to reach that goal.
    // By default, if the current grade is less than 2.96, we set the initial goal to 3.0.
    let targetGoalGrade = originalGPA < 2.96 ? 3.0 : Math.min(originalGPA, 5.0);
    let goalActive = false; // Controls whether auto-filled goals are computed and shown

    const goalCard = document.createElement("div");
    goalCard.className = "gpa-goal-card collapsed"; // Render as closed/inactive by default
    goalCard.innerHTML = `
        <div class="gpa-goal-header" title="Haz clic para activar/desactivar el simulador">
            <span class="gpa-goal-title">🎯 Simulador de Nota Objetivo</span>
            <span class="gpa-goal-arrow">▼</span>
        </div>
        <div class="gpa-goal-content">
            <div class="gpa-goal-description">Calcula la nota promedio que necesitas en las actividades restantes para obtener la nota final deseada.</div>
            <div class="gpa-goal-controls">
                <div class="gpa-goal-slider-wrapper">
                    <label for="gpa-goal-slider">Meta: <span id="gpa-goal-target-val">3.00</span> <span id="gpa-goal-target-delta" class="gpa-goal-delta"></span></label>
                    <input type="range" id="gpa-goal-slider" step="0.01" class="gpa-goal-slider">
                </div>
                <div class="gpa-goal-number-wrapper">
                    <input type="number" id="gpa-goal-number" step="0.01" class="gpa-goal-number-input" min="0" max="5.00">
                </div>
            </div>
            <div id="gpa-goal-result" class="gpa-goal-result"></div>
        </div>
    `;

    const goalSlider = goalCard.querySelector("#gpa-goal-slider");
    const goalNumberInput = goalCard.querySelector("#gpa-goal-number");
    const goalResultDiv = goalCard.querySelector("#gpa-goal-result");
    const goalControlsDiv = goalCard.querySelector(".gpa-goal-controls");
    const goalDescDiv = goalCard.querySelector(".gpa-goal-description");
    const goalHeader = goalCard.querySelector(".gpa-goal-header");

    const resetOrigGradeSpan = (act) => {
        if (!act.origGradeSpan) return;
        const isOrigNaN = !Number.isFinite(act.originalGrade);
        const isCurrNaN = !Number.isFinite(act.grade);
        const isChanged = isOrigNaN !== isCurrNaN || (!isOrigNaN && act.grade !== act.originalGrade);
        
        act.origGradeSpan.style.display = isChanged ? "block" : "none";
        
        if (isChanged && !isCurrNaN) {
            const origVal = isOrigNaN ? 0 : act.originalGrade;
            const delta = act.grade - origVal;
            const sign = delta > 0 ? "+" : "";
            const origDisplay = isOrigNaN ? "-" : act.originalGrade;
            act.origGradeSpan.textContent = `${origDisplay} (${sign}${delta.toFixed(2)})`;
        } else {
            act.origGradeSpan.textContent = `${Number.isFinite(act.originalGrade) ? act.originalGrade : "-"}`;
        }
    };

    const updateGoalResult = () => {
        const { currentGPA } = calculateCurrentGPA(activities);
        const remainingWeight = activities.reduce((sum, act) => sum + (Number.isFinite(act.grade) ? 0 : act.percentage), 0);

        if (targetGoalGrade < currentGPA) {
            targetGoalGrade = currentGPA;
        }

        // Set five to be inclusive for the slider/inputs
        goalSlider.min = currentGPA.toFixed(2);
        goalSlider.max = "5.00";
        goalSlider.value = targetGoalGrade.toFixed(2);

        goalNumberInput.min = currentGPA.toFixed(2);
        goalNumberInput.max = "5.00";
        goalNumberInput.value = targetGoalGrade.toFixed(2);

        const goalValSpan = goalCard.querySelector("#gpa-goal-target-val");
        const goalDeltaSpan = goalCard.querySelector("#gpa-goal-target-delta");

        // Handle disabled / inactive state
        if (!goalActive) {
            goalSlider.disabled = true;
            goalNumberInput.disabled = true;
            
            if (goalValSpan) {
                goalValSpan.textContent = targetGoalGrade.toFixed(2);
            }
            if (goalDeltaSpan) {
                goalDeltaSpan.textContent = "";
                goalDeltaSpan.className = "gpa-goal-delta";
            }

            // Clear values and formatting on all ungraded inputs
            activities.forEach((act) => {
                if (act.inputElement) {
                    if (!Number.isFinite(act.grade)) {
                        act.inputElement.value = "";
                    }
                    act.inputElement.classList.remove("gpa-calc-grade-input-goal");
                    act.inputElement.classList.remove("gpa-calc-grade-input-impossible");
                    act.inputElement.title = "";
                    
                    resetOrigGradeSpan(act);
                }
            });

            goalResultDiv.className = "gpa-goal-result status-secured";
            goalResultDiv.innerHTML = `
                <span>💡 Activa el simulador para proyectar las notas requeridas.</span>
            `;
            return;
        }

        // Enable inputs if active
        goalSlider.disabled = false;
        goalNumberInput.disabled = false;

        // Update target value and delta display next to range label
        if (goalValSpan) {
            goalValSpan.textContent = targetGoalGrade.toFixed(2);
        }
        if (goalDeltaSpan) {
            const goalDelta = targetGoalGrade - originalGPA;
            if (Math.abs(goalDelta) > 0.001) {
                const goalDeltaSign = goalDelta > 0 ? "+" : "";
                goalDeltaSpan.textContent = `(${goalDeltaSign}${goalDelta.toFixed(2)})`;
                goalDeltaSpan.className = `gpa-goal-delta ${goalDelta > 0 ? 'positive' : 'negative'}`;
            } else {
                goalDeltaSpan.textContent = "";
                goalDeltaSpan.className = "gpa-goal-delta";
            }
        }

        if (remainingWeight < 0.001) {
            goalControlsDiv.style.display = "none";
            goalDescDiv.style.display = "none";
            goalResultDiv.className = "gpa-goal-result status-secured";
            goalResultDiv.innerHTML = `
                <span>✅ Todas las actividades ya tienen nota. Tu nota final es <strong>${currentGPA.toFixed(2)}</strong>.</span>
            `;

            // Clear goal states on inputs since all are graded
            activities.forEach((act) => {
                if (act.inputElement) {
                    act.inputElement.classList.remove("gpa-calc-grade-input-goal");
                    act.inputElement.classList.remove("gpa-calc-grade-input-impossible");
                    act.inputElement.title = "";
                    
                    resetOrigGradeSpan(act);
                }
            });
            return;
        }

        goalControlsDiv.style.display = "flex";
        goalDescDiv.style.display = "block";

        const required = (targetGoalGrade - currentGPA) / remainingWeight;
        const showRequired = Number.isFinite(required);

        // Update inputs for ungraded activities
        activities.forEach((act) => {
            if (act.inputElement) {
                if (!Number.isFinite(act.grade)) {
                    // This is an ungraded activity
                    if (showRequired) {
                        // Clamp the displayed value to 0.0 - 5.0 for a realistic input grade
                        const clampedVal = Math.max(0, Math.min(5, required));
                        act.inputElement.value = clampedVal.toFixed(2);
                        act.inputElement.classList.add("gpa-calc-grade-input-goal");
                        
                        if (required > 5.0) {
                            act.inputElement.classList.add("gpa-calc-grade-input-impossible");
                            act.inputElement.title = `Requieres ${required.toFixed(2)} (imposible)`;
                        } else {
                            act.inputElement.classList.remove("gpa-calc-grade-input-impossible");
                            act.inputElement.title = `Nota sugerida por el simulador: ${required.toFixed(2)}`;
                        }

                        // Display original grade delta: compares simulator value with original grade
                        if (act.origGradeSpan) {
                            act.origGradeSpan.style.display = "block";
                            const isOrigNaN = !Number.isFinite(act.originalGrade);
                            const origVal = isOrigNaN ? 0 : act.originalGrade;
                            const delta = clampedVal - origVal;
                            const sign = delta > 0 ? "+" : "";
                            const origDisplay = isOrigNaN ? "-" : act.originalGrade;
                            
                            act.origGradeSpan.textContent = `${origDisplay} (${sign}${delta.toFixed(2)})`;
                        }
                    } else {
                        act.inputElement.value = "";
                        act.inputElement.classList.remove("gpa-calc-grade-input-goal");
                        act.inputElement.classList.remove("gpa-calc-grade-input-impossible");
                        act.inputElement.title = "";
                        
                        resetOrigGradeSpan(act);
                    }
                } else {
                    // User has typed a manual grade, ensure no goal styling remains on it
                    act.inputElement.classList.remove("gpa-calc-grade-input-goal");
                    act.inputElement.classList.remove("gpa-calc-grade-input-impossible");
                    
                    resetOrigGradeSpan(act);
                }
            }
        });

        if (required > 5.0) {
            goalResultDiv.className = "gpa-goal-result status-impossible";
            goalResultDiv.innerHTML = `
                <span>❌ <strong>¡Matemáticamente imposible!</strong> Necesitarías un promedio de <strong>${required.toFixed(2)}</strong> en el <strong>${(remainingWeight * 100).toFixed(0)}%</strong> restante para alcanzar esta meta.</span>
            `;
        } else if (required <= 0.001) {
            goalResultDiv.className = "gpa-goal-result status-secured";
            goalResultDiv.innerHTML = `
                <span>🎉 <strong>¡Meta asegurada!</strong> Incluso si obtienes 0.0 en el <strong>${(remainingWeight * 100).toFixed(0)}%</strong> restante de la asignatura, tu nota final será de <strong>${currentGPA.toFixed(2)}</strong>.</span>
            `;
        } else {
            const isEasy = required < 2.96;
            goalResultDiv.className = `gpa-goal-result ${isEasy ? 'status-possible' : 'status-warning'}`;
            goalResultDiv.innerHTML = `
                <span>✏️ Necesitas obtener un promedio de <strong>${required.toFixed(2)}</strong> en el <strong>${(remainingWeight * 100).toFixed(0)}%</strong> restante de la asignatura.</span>
            `;
        }
    };

    const handleGoalChange = (val) => {
        let parsed = parseFloat(val);
        if (isNaN(parsed)) return;

        const { currentGPA } = calculateCurrentGPA(activities);
        const minVal = currentGPA;
        const maxVal = 5.0;

        if (parsed < minVal) parsed = minVal;
        if (parsed > maxVal) parsed = maxVal;

        targetGoalGrade = parsed;
        updateGoalResult();
        // Since goal grade changed, trigger display update to sync main GPA display
        updateDisplay();
    };

    goalSlider.addEventListener("input", (e) => {
        handleGoalChange(e.target.value);
    });

    goalNumberInput.addEventListener("change", (e) => {
        handleGoalChange(e.target.value);
    });

    // Toggle goal simulation via accordion header click
    goalHeader.addEventListener("click", () => {
        goalCard.classList.toggle("collapsed");
        goalActive = !goalCard.classList.contains("collapsed");
        
        // If enabling the simulator, check if current GPA is less than 2.96 to default goal to 3.0
        if (goalActive) {
            const { currentGPA } = calculateCurrentGPA(activities);
            if (currentGPA < 2.96) {
                targetGoalGrade = 3.0;
            } else {
                targetGoalGrade = Math.max(targetGoalGrade, currentGPA);
            }
        } else {
            // When disabling the simulator, restore original grades & clear cached simulation
            activities.forEach((act) => {
                act.grade = act.originalGrade;
                if (act.inputElement) {
                    act.inputElement.value = Number.isFinite(act.originalGrade) ? act.originalGrade : "";
                    act.inputElement.classList.remove("failing");
                    if (Number.isFinite(act.grade) && act.grade < 2.96) {
                        act.inputElement.classList.add("failing");
                    }
                }
            });
            saveGpaSimulationForSubject(subjectName, {});
        }
        
        updateDisplay();
    });

    const gradesContainer = document.createElement("div");
    gradesContainer.className = "gpa-calc-grades-container";

    /**
     * Recalculates GPA and updates display values based on simulated inputs.
     */
    const updateDisplay = () => {
        const { currentGPA } = calculateCurrentGPA(activities);
        
        let finalSimulatedGPA = 0;
        const remainingWeight = activities.reduce((sum, act) => sum + (Number.isFinite(act.grade) ? 0 : act.percentage), 0);

        if (goalActive) {
            const required = remainingWeight > 0 ? (targetGoalGrade - currentGPA) / remainingWeight : 0;
            const clampedRequired = Math.max(0, Math.min(5, required));

            activities.forEach(act => {
                if (Number.isFinite(act.grade)) {
                    finalSimulatedGPA += act.grade * act.percentage;
                } else {
                    finalSimulatedGPA += clampedRequired * act.percentage;
                }
            });
        } else {
            // Simulator is inactive, GPA is just based on manual/real graded activities
            finalSimulatedGPA = currentGPA;
        }

        gpaDisplay.textContent = finalSimulatedGPA.toFixed(2);

        // Check if any of the grade inputs differ from original cached data
        let anyChanged = false;
        activities.forEach(a => {
            const isOrigNaN = !Number.isFinite(a.originalGrade);
            const isCurrNaN = !Number.isFinite(a.grade);
            if (isOrigNaN !== isCurrNaN || (!isOrigNaN && a.grade !== a.originalGrade)) {
                anyChanged = true;
            }
        });

        // Also count as changed if we are simulating empty activities via targetGoalGrade
        if (goalActive && remainingWeight > 0 && Math.abs(finalSimulatedGPA - originalGPA) > 0.001) {
            anyChanged = true;
        }

        // Show/hide comparison string depending on change detection
        originalGpaDisplay.style.display = anyChanged ? "block" : "none";

        let delta = finalSimulatedGPA - originalGPA;
        if (Math.abs(delta) > 0.001) {
            const sign = delta > 0 ? "+" : "";
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)} (${sign}${delta.toFixed(2)})`;
        } else {
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)}`;
        }

        // Apply visual indicator class if GPA falls below the passing score of 2.96 (~3.0)
        gpaDisplay.classList.toggle("failing", finalSimulatedGPA < 2.96);

        // Update the goal calculator
        updateGoalResult();
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
        activity.inputElement = input;
        input.type = "number";
        input.min = "0";
        input.max = "5";
        input.step = "0.1";
        // Show the simulated grade if available, otherwise fallback to original
        input.value = Number.isFinite(activity.grade) ? activity.grade : "";
        input.placeholder = "-";
        input.className = "gpa-calc-grade-input";

        const origGradeSpan = document.createElement("span");
        activity.origGradeSpan = origGradeSpan;
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

            // Remove goal indicator styles since this is now manual
            input.classList.remove("gpa-calc-grade-input-goal");
            input.classList.remove("gpa-calc-grade-input-impossible");
            input.title = "";

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
    container.appendChild(goalCard);
    updateDisplay();
}
