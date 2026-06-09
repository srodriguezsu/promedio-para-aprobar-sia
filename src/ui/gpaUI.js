import { SELECTORS } from "../utils/selectors.js";
import { calculateCurrentGPA, normalizeSubjectName } from "../domain/gpaCalculator.js";
import {
    extractActivitiesFromDom,
    extractSubjectName,
    areGradeContainersAvailable
} from "../scraper/domScraper.js";

export function clearRequiredGradeUi() {
    document.querySelectorAll(SELECTORS.requiredGradeUi).forEach((el) => el.remove());
}

export function injectRequiredGradeUi(data) {
    if (!data || !data.activities) return;

    const { requiredGrade, activities } = data;
    const isNotPossible = requiredGrade > 5;

    activities.forEach((activity) => {
        if (!activity.container) return;

        const resultDiv = document.createElement("div");
        resultDiv.setAttribute("data-required-grade-ui", "true");
        resultDiv.classList.add("gpa-required-grade");

        const gradeDisplay = isNotPossible
            ? Number(requiredGrade).toFixed(1) + " 💀"
            : Number(requiredGrade).toFixed(1);

        resultDiv.innerHTML = `
            <strong class="${isNotPossible ? "gpa-grade-impossible" : "gpa-grade-possible"}">Calificación mínima para aprobar: ${gradeDisplay}</strong>
        `;

        activity.container.appendChild(resultDiv);
    });
}

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

export function updateGpaDisplay(gpaValue) {
    const gpaValueDiv = document.querySelector(SELECTORS.gpaValue);
    if (gpaValueDiv) {
        gpaValueDiv.textContent = gpaValue.toFixed(1);
    }
}

export function updateSubjectName(subjectName) {
    const subjectNameDiv = document.querySelector(SELECTORS.gpaSubjectName);
    if (subjectNameDiv) {
        subjectNameDiv.textContent = `📊 ${subjectName}`;
    }
}

export function bindRefreshButton(onRefresh) {
    const refreshBtn = document.querySelector(SELECTORS.refreshButton);
    if (refreshBtn) {
        refreshBtn.addEventListener("click", onRefresh);
    }
}

export function renderGpa(container) {
    if (!container) return;
    container.innerHTML = "";
    if (!areGradeContainersAvailable()) {
        container.innerHTML = "<p>No hay datos disponibles.<br><br>Navega a <b>Información académica > Mis calificaciones</b> y selecciona una asignatura.</p>";
        return;
    }

    const activities = extractActivitiesFromDom();
    const subjectName = normalizeSubjectName(extractSubjectName());
    const { currentGPA: originalGPA } = calculateCurrentGPA(activities);

    const header = document.createElement("h2");
    header.textContent = subjectName;
    container.appendChild(header);

    const gpaDisplay = document.createElement("p");
    gpaDisplay.className = "gpa-calc-display";
    container.appendChild(gpaDisplay);

    const originalGpaDisplay = document.createElement("p");
    originalGpaDisplay.className = "gpa-calc-original-display";
    originalGpaDisplay.textContent = `${originalGPA.toFixed(2)}`;
    container.appendChild(originalGpaDisplay);

    const gradesContainer = document.createElement("div");
    gradesContainer.className = "gpa-calc-grades-container";

    const updateDisplay = () => {
        const { currentGPA } = calculateCurrentGPA(activities);
        gpaDisplay.textContent = currentGPA.toFixed(2);

        let anyChanged = false;
        activities.forEach(a => {
            const isOrigNaN = !Number.isFinite(a.originalGrade);
            const isCurrNaN = !Number.isFinite(a.grade);
            if (isOrigNaN !== isCurrNaN || (!isOrigNaN && a.grade !== a.originalGrade)) {
                anyChanged = true;
            }
        });

        originalGpaDisplay.style.display = anyChanged ? "block" : "none";

        let delta = currentGPA - originalGPA;
        if (Math.abs(delta) > 0.001) {
            const sign = delta > 0 ? "+" : "";
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)} (${sign}${delta.toFixed(2)})`;
        } else {
            originalGpaDisplay.textContent = `${originalGPA.toFixed(2)}`;
        }

        gpaDisplay.classList.toggle("failing", currentGPA < 2.96);
    };

    activities.forEach((activity) => {
        activity.originalGrade = activity.grade;
        const originalGrade = activity.originalGrade;

        const item = document.createElement("div");
        item.className = "gpa-calc-grade-item";

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

        input.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value);
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
