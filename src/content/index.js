import {
    calculateCurrentGPA,
    calculateRequiredGradePerActivity,
    normalizeSubjectName
} from "../domain/gpaCalculator.js";

import {
    extractActivitiesFromDom,
    extractSubjectName,
    areGradeContainersAvailable
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

let observer;
let extractedData = null;

/* =============================
   ROOT + FLOATING BUTTON
============================= */

function mountApp() {
    if (document.getElementById("sia-unal-root")) return;

    const root = document.createElement("div");
    root.id = "sia-unal-root";

    root.innerHTML = `
        <button id="sia-floating-btn" class="sia-floating-btn">
            📊
        </button>

        <div id="sia-modal" class="sia-modal">
            <div class="sia-modal-content">
                <button id="sia-close-btn" class="sia-close-btn">✕</button>
                <div id="sia-dashboard"></div>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    bindUIEvents();
}

function bindUIEvents() {
    const btn = document.getElementById("sia-floating-btn");
    const modal = document.getElementById("sia-modal");
    const close = document.getElementById("sia-close-btn");

    btn.addEventListener("click", () => {
        modal.classList.add("active");

        if (!extractedData) {
            extractAndRenderDashboard();
        }
    });

    close.addEventListener("click", () => {
        modal.classList.remove("active");
    });
}

/* =============================
   DATA EXTRACTION
============================= */

function extractAndRenderDashboard() {
    const dashboard = document.getElementById("sia-dashboard");
    dashboard.innerHTML = "";

    if (areGradeContainersAvailable()) {
        const activities = extractActivitiesFromDom();
        const subjectName = normalizeSubjectName(extractSubjectName());
        const { currentGPA } = calculateCurrentGPA(activities);

        dashboard.innerHTML += `
            <h2>Promedio Actual</h2>
            <p style="font-size: 24px;">${currentGPA}</p>
        `;
    }

    if (areAsignaturasAvailable()) {
        const semestres = extractAsignaturasFromDom();
        renderAsignaturasBySemester(semestres, dashboard);
    }

    if (areCreditosAvailable()) {
        const creditos = extractCreditosFromDom();
        renderCreditosProgress(creditos, dashboard);
    }

    extractedData = true;
}

/* =============================
   INIT
============================= */

function initWhenReady() {
    console.log("SIA Pro Activado");

    mountApp();

    observer = new MutationObserver(() => {
        if (
            areGradeContainersAvailable() ||
            areAsignaturasAvailable() ||
            areCreditosAvailable()
        ) {
            observer.disconnect();
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
