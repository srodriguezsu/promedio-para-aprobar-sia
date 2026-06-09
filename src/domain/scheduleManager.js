const STORAGE_KEY_SUBJECTS = "sia_pro_selected_subjects";
const STORAGE_KEY_SELECTIONS = "sia_pro_selected_groups";

/**
 * Loads the list of selected subjects from localStorage.
 * 
 * @returns {Array.<Object>} List of saved subjects.
 */
export function loadSelectedSubjects() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_SUBJECTS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("[SIA Pro] Error al cargar asignaturas guardadas:", e);
        return [];
    }
}

/**
 * Saves the list of selected subjects to localStorage.
 * 
 * @param {Array.<Object>} subjects - List of subjects.
 * @returns {void}
 */
export function saveSelectedSubjects(subjects) {
    try {
        localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar asignaturas:", e);
    }
}

/**
 * Loads the current group selections mapping from localStorage.
 * 
 * @returns {Object.<string, string>} Mapping of subject name to selected group name.
 */
export function loadSelectedGroups() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_SELECTIONS);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("[SIA Pro] Error al cargar selección de grupos:", e);
        return {};
    }
}

/**
 * Saves the current group selections mapping to localStorage.
 * 
 * @param {Object.<string, string>} selections - Mapping of subject name to selected group name.
 * @returns {void}
 */
export function saveSelectedGroups(selections) {
    try {
        localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(selections));
    } catch (e) {
        console.error("[SIA Pro] Error al guardar selección de grupos:", e);
    }
}

/**
 * Adds a subject to the selected list if it doesn't already exist.
 * 
 * @param {Object} subject - The scraped subject object to add.
 * @returns {boolean} True if added, false if already present.
 */
export function addSubject(subject) {
    if (!subject || !subject.name) return false;
    const subjects = loadSelectedSubjects();
    const exists = subjects.some(s => s.name === subject.name);
    if (exists) return false;
    
    subjects.push(subject);
    saveSelectedSubjects(subjects);
    return true;
}

/**
 * Removes a subject and its group selection.
 * 
 * @param {string} subjectName - Name of the subject to remove.
 * @returns {void}
 */
export function removeSubject(subjectName) {
    const subjects = loadSelectedSubjects();
    const filteredSubjects = subjects.filter(s => s.name !== subjectName);
    saveSelectedSubjects(filteredSubjects);

    const selections = loadSelectedGroups();
    delete selections[subjectName];
    saveSelectedGroups(selections);
}

/**
 * Checks if a subject is already in the schedule.
 * 
 * @param {string} subjectName - Name of the subject.
 * @returns {boolean} True if present, false otherwise.
 */
export function isSubjectAdded(subjectName) {
    const subjects = loadSelectedSubjects();
    return subjects.some(s => s.name === subjectName);
}

/**
 * Parses a time string (e.g. "16:00") into minutes since midnight.
 * 
 * @param {string} timeStr - Time string.
 * @returns {number} Minutes.
 */
function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Checks if two schedule entries overlap.
 * 
 * @param {{dia: string, horaInicio: string, horaFin: string}} h1 - First schedule entry.
 * @param {{dia: string, horaInicio: string, horaFin: string}} h2 - Second schedule entry.
 * @returns {boolean} True if they overlap, false otherwise.
 */
export function doSchedulesOverlap(h1, h2) {
    if (h1.dia.toUpperCase() !== h2.dia.toUpperCase()) return false;

    const start1 = parseTimeToMinutes(h1.horaInicio);
    const end1 = parseTimeToMinutes(h1.horaFin);
    const start2 = parseTimeToMinutes(h2.horaInicio);
    const end2 = parseTimeToMinutes(h2.horaFin);

    // Overlap formula: start1 < end2 && start2 < end1
    return start1 < end2 && start2 < end1;
}

/**
 * Evaluates whether a group from a subject conflicts with currently selected groups from other subjects.
 * 
 * @param {string} currentSubjectName - The subject name being checked.
 * @param {Object} group - The group object containing schedules.
 * @returns {Array.<{subjectName: string, groupName: string}>} List of conflicting subjects and groups.
 */
export function getConflictsForGroup(currentSubjectName, group) {
    if (!group || !group.horarios || group.horarios.length === 0) return [];
    
    const subjects = loadSelectedSubjects();
    const selections = loadSelectedGroups();
    const conflicts = [];

    subjects.forEach((subj) => {
        // Skip current subject
        if (subj.name === currentSubjectName) return;

        const selectedGroupName = selections[subj.name];
        if (!selectedGroupName) return;

        const selectedGroup = subj.groups?.find(g => g.name === selectedGroupName);
        if (!selectedGroup || !selectedGroup.horarios) return;

        // Check each schedule combination
        for (const hCurrent of group.horarios) {
            for (const hSelected of selectedGroup.horarios) {
                if (doSchedulesOverlap(hCurrent, hSelected)) {
                    conflicts.push({
                        subjectName: subj.name,
                        groupName: selectedGroupName
                    });
                    // Avoid duplicate records for the same conflicting subject
                    return;
                }
            }
        }
    });

    return conflicts;
}
