import { SELECTORS } from "../utils/selectors";

export function extractAsignaturasFromDom() {
    const asignaturasContainer = document.querySelector(SELECTORS.asignaturasContainer);
    console.log("Asignaturas container:", asignaturasContainer);
}

export function areAsignaturasAvailable() {
    const asignaturas = document.querySelectorAll("tr.af_table_data-row");

    for (const asignatura of asignaturas) {


        let nombreAsignatura = asignatura.querySelector("td.af_column_data-cell.ex-asig-des")?.textContent.trim();

        const creditos = asignatura.querySelector("td.af_column_data-cell.ex-asig-cre.text-right")?.textContent.trim();

        const componente = asignatura.querySelector("td.af_column_data-cell.ex-asig-tip")?.textContent.trim();
        
        const semestre = asignatura.querySelector("td.af_column_data-cell.ex-asig-conv")?.textContent.trim();

        const calificacion = asignatura.querySelector("td.af_column_data-cell.ex-asig-cal.text-center")?.textContent.trim();

        console.log(`Asignatura: ${nombreAsignatura}, Créditos: ${creditos}, Componente: ${componente}, Semestre: ${semestre}, Calificación: ${calificacion}`);

    }
        


    return asignaturas.length > 0;
}