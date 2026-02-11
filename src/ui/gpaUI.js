import { SELECTORS } from "../utils/selectors.js";

export function extractActivitiesFromDom() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    const activities = [];

    gradeContainers.forEach((container) => {
        const descriptionSpan = container.querySelector(SELECTORS.description);
        const description = descriptionSpan ? descriptionSpan.textContent.trim() : "N/A";

        const percentageSpan = container.querySelector(SELECTORS.percentage);
        const percentageText = percentageSpan ? percentageSpan.textContent.trim() : "";
        const percentageValue = percentageSpan ? parseFloat(percentageText.replace("%", "")) : NaN;

        const gradeSpan = container.querySelector(SELECTORS.grade);
        const gradeValue = gradeSpan ? parseFloat(gradeSpan.textContent.trim()) : NaN;

        activities.push({
            description,
            percentage: percentageValue / 100,
            grade: gradeValue,
            container
        });
    });

    return activities;
}

export function extractSubjectName() {
    const subjectNameElement = document.querySelector(SELECTORS.subjectName);
    return subjectNameElement ? subjectNameElement.textContent : "N/A";
}

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
            ?  Number(requiredGrade).toFixed(1) + " 💀"
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

export function isPageReady() {
    const gradeContainers = document.querySelectorAll(SELECTORS.gradeContainers);
    return gradeContainers && gradeContainers.length > 0;
}
