/**
 * Normalizes a subject name by trimming whitespace and truncating if it exceeds the max length.
 * 
 * @param {string} subjectName - The raw subject name text.
 * @param {number} [maxLength=100] - The maximum character limit allowed.
 * @returns {string} The normalized and potentially truncated subject name.
 */
export function normalizeSubjectName(subjectName, maxLength = 100) {
    if (!subjectName) return "N/A";
    const trimmed = subjectName.trim();
    if (trimmed.length <= maxLength) return trimmed;
    // Append ellipsis if the name is truncated
    return trimmed.substring(0, maxLength) + "...";
}

/**
 * Calculates the current accumulated GPA based on completed grade activities and lists ungraded ones.
 * 
 * @param {Array.<{
 *   grade: number,
 *   percentage: number,
 *   description: string
 * }>} activities - List of partial course activities/evaluations.
 * @returns {{
 *   currentGPA: number,
 *   remainingActivities: Array.<Object>
 * }} An object containing the accumulated GPA (weighted sum of graded items) and a list of ungraded/remaining activities.
 */
export function calculateCurrentGPA(activities) {
    let total = 0;
    const remainingActivities = [];

    activities.forEach((activity) => {
        const { grade, percentage } = activity;
        // Check if grade and weight are valid numbers (already graded)
        if (Number.isFinite(grade) && Number.isFinite(percentage)) {
            total += grade * percentage;
        } else {
            // Otherwise, keep track of it as a remaining activity
            remainingActivities.push(activity);
        }
    });

    return {
        currentGPA: total,
        remainingActivities
    };
}

/**
 * Calculates the average grade required on the remaining weight to achieve a target GPA.
 * 
 * @param {number} targetGPA - The desired final grade/GPA for the subject.
 * @param {number} currentGPA - The currently accumulated weighted grade.
 * @param {number} remainingWeight - The sum of weights of the remaining activities (0 to 1).
 * @returns {number|null} The minimum required average grade (capped at 0.0 at the lower bound), or null if remainingWeight is 0.
 */
export function calculateRequiredGrade(targetGPA, currentGPA, remainingWeight) {
    if (remainingWeight === 0) return null;
    
    // Formula: required = (target - current) / remainingWeight
    const required = (targetGPA - currentGPA) / remainingWeight;
    
    // If we've already secured the target grade, required grade is 0.0
    if (required < 0) return 0.0;
    return required;
}

/**
 * Calculates the average required grade for all remaining activities to pass or achieve a target GPA.
 * 
 * @param {Array.<{
 *   grade: number,
 *   percentage: number
 * }>} remainingActivities - List of pending/ungraded activities.
 * @param {number} currentGPA - The currently accumulated GPA.
 * @param {number} [targetGPA=3.0] - The target final grade, defaults to 3.0 (passing grade at UNAL).
 * @returns {{
 *   requiredGrade: number,
 *   remainingWeight: number,
 *   activities: Array.<Object>
 * }|null} Object containing required average grade, remaining weight fraction, and remaining activities list, or null if no weight remains.
 */
export function calculateRequiredGradePerActivity(remainingActivities, currentGPA, targetGPA = 3.0) {
    // Sum the weight percentages of all remaining tasks
    const remainingWeight = remainingActivities.reduce((sum, activity) => {
        return sum + (Number.isFinite(activity.percentage) ? activity.percentage : 0);
    }, 0);

    if (remainingWeight === 0) return null;

    const requiredGrade = calculateRequiredGrade(targetGPA, currentGPA, remainingWeight);
    if (requiredGrade == null) return null;

    return {
        requiredGrade,
        remainingWeight,
        activities: remainingActivities
    };
}
