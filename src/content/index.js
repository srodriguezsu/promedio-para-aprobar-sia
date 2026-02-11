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
    areAsignaturasAvailable
} from "../ui/historyUI.js";

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

    const observer = new MutationObserver(() => {
        if (areGradeContainersAvailable()) {
            observer.disconnect();
            runCalculation();
        }
        if (areAsignaturasAvailable()) {
            observer.disconnect();
            runCalculation();
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
