import { addSubject, removeSubject, isSubjectAdded } from "../domain/scheduleManager.js";
import { extractAsignaturaParaCursar } from "../scraper/domScraper.js";
import { SELECTORS } from "../utils/selectors.js";
import { renderHorario } from "./horarioUI.js";

/**
 * Injects the "Agregar al horario" button into the original SIA page next to the subject title.
 * Checks if the button is already present to update its state or avoid duplicate injections.
 * 
 * @returns {void}
 */
export function injectAddSubjectButton() {
    const subjectTitleElement = document.querySelector(SELECTORS.subjectNameToEnroll);
    if (!subjectTitleElement) return;

    const groupElements = document.querySelectorAll(SELECTORS.subjectGroupsToEnroll);
    const existingButton = document.getElementById("sia-pro-add-to-schedule-btn");
    const subjectName = subjectTitleElement.textContent.trim();

    // Only allow injection if there is at least one group available to enroll
    if (groupElements.length === 0) {
        if (existingButton) {
            existingButton.remove();
        }
        return;
    }

    if (existingButton) {
        updateButtonState(subjectName);
        return;
    }

    const button = document.createElement("button");
    button.id = "sia-pro-add-to-schedule-btn";
    
    // Append inside the parent container of the subject title
    subjectTitleElement.parentNode.appendChild(button);

    updateButtonState(subjectName);

    button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const added = isSubjectAdded(subjectName);
        if (added) {
            removeSubject(subjectName);
        } else {
            const scrapedSubject = extractAsignaturaParaCursar();
            if (scrapedSubject) {
                addSubject(scrapedSubject);
            }
        }
        updateButtonState(subjectName);

        // Instant sync: if the Horario tab is open in the extension modal, rerender it
        const tabHorario = document.getElementById("tab-horario");
        if (tabHorario) {
            renderHorario(tabHorario);
        }
    });
}

/**
 * Updates the visual state (text, icon, and colors) of the injected button.
 * 
 * @param {string} subjectName - The name of the subject.
 * @returns {void}
 */
export function updateButtonState(subjectName) {
    const button = document.getElementById("sia-pro-add-to-schedule-btn");
    if (!button) return;

    const added = isSubjectAdded(subjectName);
    const expectedHtml = added ? "❌ Quitar del Horario" : "➕ Agregar al Horario";
    const expectedClass = added ? "sia-pro-injected-btn enrolled" : "sia-pro-injected-btn";

    if (button.innerHTML !== expectedHtml) {
        button.innerHTML = expectedHtml;
    }
    if (button.className !== expectedClass) {
        button.className = expectedClass;
    }
}
