export const SELECTORS = {
    gradeContainers: "span.bloque-row.datos-parcial.af_panelGroupLayout",
    subjectName: "span.titulo-nombre-asignatura.af_panelGroupLayout",
    description: "span.datos-parcial-item.datos-parcial-descripcion.af_panelGroupLayout",
    percentage: "span.datos-parcial-item.datos-parcial-porcentaje.af_panelGroupLayout",
    grade: "span.af_panelGroupLayout:not(.datos-parcial-porcentaje):not(.datos-parcial-descripcion):not(.datos-parcial-calificacion-minima):not(.datos-parcial-faltas)",
    requiredGradeUi: "[data-required-grade-ui]",
    gpaValue: ".gpa-value",
    gpaSubjectName: "#gpa-subject-name",
    gpaBox: "#gpa-extension-box",
    refreshButton: "#gpa-refresh-btn"
};
