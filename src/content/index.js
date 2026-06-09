import { renderGpa } from "../ui/gpaUI.js";
import { renderHistoriaAcademica } from "../ui/historia_academica/asignaturasUI.js";
import { renderCreditosProgress } from "../ui/historia_academica/creditosUI.js";
import { renderAvanceProgress } from "../ui/historia_academica/avanceUI.js";
import { renderHorario } from "../ui/horarioUI.js";
import {
    areGradeContainersAvailable,
    areAsignaturasAvailable,
    areCreditosAvailable
} from "../scraper/domScraper.js";

/** @type {MutationObserver} MutationObserver to detect DOM ready state for scraping */
let observer;

/* =============================
   ROOT + FLOATING BUTTON
============================= */

/**
 * Creates and mounts the main container div (`#sia-unal-root`) to the document body.
 * Injects the HTML structure containing the floating trigger button and the tabbed modal.
 * Finally, registers DOM event handlers by calling {@link bindUIEvents}.
 * 
 * @returns {void}
 */
function mountApp() {
    // Prevent double mounting if the app is already loaded
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
                    <button class="sia-tab" data-tab="horario">Horario</button>
                </div>
    
                <div class="sia-tab-content active" id="tab-gpa"></div>
                <div class="sia-tab-content" id="tab-historia"></div>
                <div class="sia-tab-content" id="tab-avance"></div>
                <div class="sia-tab-content" id="tab-creditos"></div>
                <div class="sia-tab-content" id="tab-horario"></div>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    bindUIEvents();
}

/**
 * Binds click event handlers for the floating button (to open/close the modal)
 * and for the modal tab buttons (to switch views). When the modal opens, it triggers
 * rendering of all tabs dynamically.
 * 
 * @returns {void}
 */
function bindUIEvents() {
    const btn = document.getElementById("sia-floating-btn");
    const modal = document.getElementById("sia-modal");

    // Toggle modal visibility and render contents if opened
    btn.addEventListener("click", () => {
        modal.classList.toggle("active");
        if (modal.classList.contains("active")) {
            // Render academic history view
            const tab_historia = document.getElementById("tab-historia");
            renderHistoriaAcademica(tab_historia);

            // Render credit typologies/requirements breakdown
            const tab_creditos = document.getElementById("tab-creditos");
            renderCreditosProgress(tab_creditos);

            // Render GPA calculator
            const tab_gpa = document.getElementById("tab-gpa");
            renderGpa(tab_gpa);

            // Render academic progress projection charts/tables
            const tab_avance = document.getElementById("tab-avance");
            renderAvanceProgress(tab_avance);

            // Render Horario & enrollment view
            const tab_horario = document.getElementById("tab-horario");
            renderHorario(tab_horario);
        }
    });

    const tabs = document.querySelectorAll(".sia-tab");

    // Tab switching event logic
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active classes from all tab headers and contents
            document.querySelectorAll(".sia-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".sia-tab-content").forEach(c => c.classList.remove("active"));

            // Add active class to clicked tab header
            tab.classList.add("active");

            // Add active class to corresponding tab panel
            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            target.classList.add("active");
        });
    });
}


/* =============================
   INIT
============================= */

/**
 * Main initialization entry point. Runs once when the page is fully interactive.
 * Mounts the UI structures and configures a MutationObserver to stop watching the DOM
 * once all required elements for the extension's views are fully parsed/available.
 * 
 * @returns {void}
 */
function initWhenReady() {
    console.log("SIA Pro Activado");

    mountApp();

    // Observe changes to detect when SIA has populated the relevant pages
    observer = new MutationObserver(() => {
        if (
            areGradeContainersAvailable() &&
            areAsignaturasAvailable() &&
            areCreditosAvailable()
        ) {
            // Once data is ready, we can stop observing
            observer.disconnect();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

// Ensure initWhenReady is called only when the document is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenReady, { once: true });
} else {
    initWhenReady();
}
