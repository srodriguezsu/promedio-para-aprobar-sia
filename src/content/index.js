import {
    calculateCurrentGPA,
    calculateRequiredGradePerActivity,
    normalizeSubjectName
} from "../domain/gpaCalculator.js";

import {
    bindRefreshButton,
    clearRequiredGradeUi,
    extractActivitiesFromDom,
    extractSubjectName,
    injectGpaBox,
    injectRequiredGradeUi,
    areGradeContainersAvailable,
    updateGpaDisplay,
    updateSubjectName
} from "../ui/gpaUI.js";

import {
    areAsignaturasAvailable,
    renderAsignaturasBySemester,
    extractAsignaturasFromDom
} from "../ui/historia_academica/asignaturasUI.js";

import {
    areCreditosAvailable,
    extractCreditosFromDom,
    renderCreditosProgress
} from "../ui/historia_academica/creditosUI.js";

function runCalculation() {
    const activities = extractActivitiesFromDom();
    const subjectNameRaw = extractSubjectName();
    const subjectName = normalizeSubjectName(subjectNameRaw);

    const { currentGPA, remainingActivities } = calculateCurrentGPA(activities);

    injectGpaBox(currentGPA, subjectName);
    updateGpaDisplay(currentGPA);
    updateSubjectName(subjectName);

    const requiredData = calculateRequiredGradePerActivity(
        remainingActivities,
        currentGPA,
        3.0
    );

    if (requiredData) {
        injectRequiredGradeUi(requiredData);
    }

    bindRefreshButton(refreshCalculation);
}

function refreshCalculation() {
    clearRequiredGradeUi();
    runCalculation();
}

function initWhenReady() {
    console.log("SIA Pro Activado");
    if (areGradeContainersAvailable()) {
        runCalculation();
        return;
    }
    if (areAsignaturasAvailable() && areCreditosAvailable()) {
        const semestres = extractAsignaturasFromDom();
        const creditos = extractCreditosFromDom();
    
        renderAsignaturasBySemester(semestres);
        renderCreditosProgress(creditos);
        return;
    }

    const observer = new MutationObserver(() => {
        if (areGradeContainersAvailable()) {
            observer.disconnect();
            runCalculation();
        }
        if (areAsignaturasAvailable() && areCreditosAvailable()) {
            observer.disconnect();
            const semestres = extractAsignaturasFromDom();
            const creditos = extractCreditosFromDom();
            
            renderAsignaturasBySemester(semestres);
            renderCreditosProgress(creditos);
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenReady, { once: true });
} else {
    initWhenReady();
}
