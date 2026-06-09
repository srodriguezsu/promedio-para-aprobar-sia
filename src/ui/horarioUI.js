import { extractAsignaturaParaCursar } from "../scraper/domScraper.js";

/**
 * Renders the Horario tab content.
 * Scrapes the enrollment subject using {@link extractAsignaturaParaCursar}, prints it
 * to the developer console, and renders a visually appealing summary inside the container.
 * 
 * @param {HTMLElement} container - The DOM container element where the Horario view will be rendered.
 * @returns {void}
 */
export function renderHorario(container) {
    if (!container) return;
    container.innerHTML = "";

    // Trigger the scraper which console.logs and returns the subject details
    const subject = extractAsignaturaParaCursar();

    const wrapper = document.createElement("div");
    wrapper.className = "sia-horario-wrapper";

    const title = document.createElement("h2");
    title.textContent = "Horario & Inscripción";
    title.className = "sia-horario-header";
    container.appendChild(title);

    if (subject) {
        // Render subject main card details
        const subjectCard = document.createElement("div");
        subjectCard.className = "sia-horario-subject-card";
        
        subjectCard.innerHTML = `
            <div class="sia-horario-subject-info">
                <h3>${subject.name}</h3>
                <div class="sia-horario-subject-badges">
                    ${subject.tipologia ? `<span class="badge tipologia">${subject.tipologia}</span>` : ""}
                    ${subject.creditos ? `<span class="badge creditos">${subject.creditos} cr.</span>` : ""}
                    ${subject.facultad ? `<span class="badge facultad">${subject.facultad}</span>` : ""}
                    ${subject.carrera ? `<span class="badge carrera">${subject.carrera}</span>` : ""}
                </div>
            </div>
            <div class="sia-horario-subject-console-note">
                <span class="console-icon">💻</span> Logged to developer console
            </div>
        `;
        wrapper.appendChild(subjectCard);

        // Render groups section
        const groupsTitle = document.createElement("h3");
        groupsTitle.textContent = "Grupos Disponibles";
        groupsTitle.className = "sia-horario-groups-title";
        wrapper.appendChild(groupsTitle);

        if (subject.groups && subject.groups.length > 0) {
            const groupsContainer = document.createElement("div");
            groupsContainer.className = "sia-horario-groups-list";

            subject.groups.forEach((group) => {
                const groupCard = document.createElement("div");
                groupCard.className = "sia-horario-group-card";

                // Generate schedule items HTML
                let schedulesHtml = "";
                if (group.horarios && group.horarios.length > 0) {
                    group.horarios.forEach((h) => {
                        schedulesHtml += `
                            <div class="schedule-item">
                                <span class="schedule-day">📅 ${h.dia}</span>
                                <span class="schedule-time">⏰ ${h.horaInicio} - ${h.horaFin}</span>
                                <span class="schedule-room">📍 ${h.aula}</span>
                            </div>
                        `;
                    });
                } else {
                    schedulesHtml = `<div class="schedule-item empty">Sin horario registrado</div>`;
                }

                // Available seats indicator class
                const seats = group.cuposDisponibles ? parseInt(group.cuposDisponibles, 10) : 0;
                const seatsClass = seats > 0 ? "available" : "unavailable";

                groupCard.innerHTML = `
                    <div class="group-header">
                        <h4>${group.name}</h4>
                        ${group.cuposDisponibles ? `<span class="group-seats ${seatsClass}">Cupos: ${group.cuposDisponibles}</span>` : ""}
                    </div>
                    <div class="group-body">
                        ${group.profesor ? `<div class="group-professor">👤 <strong>Profesor:</strong> ${group.profesor}</div>` : ""}
                        ${group.jornada ? `<div class="group-meta">🌗 <strong>Jornada:</strong> ${group.jornada}</div>` : ""}
                        ${group.duracion ? `<div class="group-meta">⏱️ <strong>Duración:</strong> ${group.duracion}</div>` : ""}
                        <div class="group-schedules">
                            <h5>Horarios y Aulas:</h5>
                            ${schedulesHtml}
                        </div>
                    </div>
                `;
                groupsContainer.appendChild(groupCard);
            });
            wrapper.appendChild(groupsContainer);
        } else {
            const noGroupsMsg = document.createElement("p");
            noGroupsMsg.textContent = "No se encontraron grupos para esta asignatura.";
            noGroupsMsg.className = "sia-horario-no-groups";
            wrapper.appendChild(noGroupsMsg);
        }

    } else {
        // Fallback banner when not on an enrollment page
        const banner = document.createElement("div");
        banner.className = "sia-horario-banner";
        banner.innerHTML = `
            <div class="sia-horario-banner-icon">ℹ️</div>
            <div class="sia-horario-banner-text">
                <h3>Sin asignaturas de inscripción en pantalla</h3>
                <p>Navega a la sección de <strong>Inscripción de Asignaturas</strong> en el SIA y selecciona una asignatura para ver sus detalles y grupos.</p>
            </div>
        `;
        wrapper.appendChild(banner);
    }

    container.appendChild(wrapper);
}
