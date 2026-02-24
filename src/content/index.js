import {
    calculateCurrentGPA,
    calculateRequiredGradePerActivity,
    normalizeSubjectName
} from "../domain/gpaCalculator.js";

import {
    extractActivitiesFromDom,
    extractSubjectName,
    areGradeContainersAvailable,
    renderGpa
} from "../ui/gpaUI.js";

import {
    areAsignaturasAvailable,
    renderHistoriaAcademica,
    extractAsignaturasFromDom
} from "../ui/historia_academica/asignaturasUI.js";

import {
    areCreditosAvailable,
    extractCreditosFromDom,
    renderCreditosProgress
} from "../ui/historia_academica/creditosUI.js";

let observer;

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
                <div class="sia-tabs">
                    <button class="sia-tab active" data-tab="gpa">Promedio</button>
                    <button class="sia-tab" data-tab="historia">Historia</button>
                    <button class="sia-tab" data-tab="creditos">Créditos</button>
                </div>
    
                <div class="sia-tab-content active" id="tab-gpa"></div>
                <div class="sia-tab-content" id="tab-historia"></div>
                <div class="sia-tab-content" id="tab-creditos"></div>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    bindUIEvents();
}

function bindUIEvents() {
    const btn = document.getElementById("sia-floating-btn");
    const modal = document.getElementById("sia-modal");

    btn.addEventListener("click", () => {
        modal.classList.toggle("active");
        if (modal.classList.contains("active")) {
            const tab_historia = document.getElementById("tab-historia");
            renderHistoriaAcademica(tab_historia)

            const tab_creditos = document.getElementById("tab-creditos");
            renderCreditosProgress(tab_creditos)

            const tab_gpa = document.getElementById("tab-gpa");
            renderGpa(tab_gpa)

        }
    });

    const tabs = document.querySelectorAll(".sia-tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".sia-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".sia-tab-content").forEach(c => c.classList.remove("active"));

            tab.classList.add("active");

            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            target.classList.add("active");
        });
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

    renderHistoriaAcademica(dashboard);

    if (areCreditosAvailable()) {
        const creditos = extractCreditosFromDom();
        renderCreditosProgress(dashboard);
    }
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
