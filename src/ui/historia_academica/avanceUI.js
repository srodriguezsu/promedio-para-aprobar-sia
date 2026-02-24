import {
    areAsignaturasAvailable,
    areCreditosAvailable,
    extractAsignaturasFromDom, extractCreditosFromDom
} from "../../domain/historiaAcademica.js";

export function renderAvanceProgress(container) {
    if (!container) return;
    container.innerHTML = "";

    if (!areAsignaturasAvailable()) {
        container.innerHTML = "<p>No hay historia académica disponible.</p>";
        return;
    }
    if (!areCreditosAvailable()) {
        container.innerHTML = "<p>No hay datos de créditos disponibles.</p>";
        return;
    }
    const creditos = extractCreditosFromDom();

    const asignaturas = extractAsignaturasFromDom();


    console.log('asignaturas', asignaturas);
    console.log('creditos', creditos);

}