export const SELECTORS = {
    // Grades selectors
    gradeContainers: "span.bloque-row.datos-parcial.af_panelGroupLayout",
    subjectName: "span.titulo-nombre-asignatura.af_panelGroupLayout",
    description: "span.datos-parcial-item.datos-parcial-descripcion.af_panelGroupLayout",
    percentage: "span.datos-parcial-item.datos-parcial-porcentaje.af_panelGroupLayout",
    grade: "span.af_panelGroupLayout:not(.datos-parcial-porcentaje):not(.datos-parcial-descripcion):not(.datos-parcial-calificacion-minima):not(.datos-parcial-faltas)",
    requiredGradeUi: "[data-required-grade-ui]",
    gpaValue: ".gpa-value",
    gpaSubjectName: "#gpa-subject-name",
    gpaBox: "#gpa-extension-box",
    refreshButton: "#gpa-refresh-btn",

    // History selectors
    asignaturasContainer: "span.row.asignaturas-expediente.clear.af_panelGroupLayout",
    historyRow: "tr.af_table_data-row",
    historyNameCell: "td.af_column_data-cell.ex-asig-des, td.af_column_banded-data-cell.ex-asig-des",
    historyCreditsCell: "td.af_column_data-cell.ex-asig-cre.text-right, td.af_column_banded-data-cell.ex-asig-cre.text-right",
    historyComponentCell: "td.af_column_data-cell.ex-asig-tip, td.af_column_banded-data-cell.ex-asig-tip",
    historySemesterCell: "td.af_column_data-cell.ex-asig-conv, td.af_column_banded-data-cell.ex-asig-conv",
    historyGradeCell: "td.af_column_data-cell.ex-asig-cal.text-center, td.af_column_banded-data-cell.ex-asig-cal.text-center",

    // Credits table selectors
    creditsRow: "#pt1\\:r1\\:0\\:t10\\:\\:db table.af_table_data-table tbody > tr.af_table_data-row",
    creditsComponentCell: "td.af_column_data-cell.text-left, td.af_column_banded-data-cell.text-left",
    creditsDataCells: "td.af_column_data-cell.text-center, td.af_column_banded-data-cell.text-center",
};

