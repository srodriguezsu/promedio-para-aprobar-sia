import {
    areGradeContainersAvailable,
    renderGpa
} from "../ui/gpaUI.js";

import {
    renderHistoriaAcademica
} from "../ui/historia_academica/asignaturasUI.js";

import {
    renderCreditosProgress
} from "../ui/historia_academica/creditosUI.js";
import { areAsignaturasAvailable, areCreditosAvailable } from "../domain/historiaAcademica.js";
import { renderAvanceProgress } from "../ui/historia_academica/avanceUI.js";

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
            <img src="https://raw.githubusercontent.com/srodriguezsu/sia-pro/refs/heads/master/public/icon.png" alt="SIA-PRO" class="sia-floating-icon" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />
        </button>

        <div id="sia-modal" class="sia-modal">
            <div class="sia-modal-content">
                <div class="sia-tabs">
                    <button class="sia-tab active" data-tab="gpa">Calculadora Promedio</button>
                    <button class="sia-tab" data-tab="historia">Historia</button>
                    <button class="sia-tab" data-tab="avance">Avance</button>
                    <button class="sia-tab" data-tab="creditos">Créditos</button>
                </div>
    
                <div class="sia-tab-content active" id="tab-gpa"></div>
                <div class="sia-tab-content" id="tab-historia"></div>
                <div class="sia-tab-content" id="tab-avance"></div>
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

            const tab_avance = document.getElementById("tab-avance");
            renderAvanceProgress(tab_avance)
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
   INIT
============================= */

function initWhenReady() {
    console.log("SIA Pro Activado");

    mountApp();

    observer = new MutationObserver(() => {
        if (
            areGradeContainersAvailable() &&
            areAsignaturasAvailable() &&
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
