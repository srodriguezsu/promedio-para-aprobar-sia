export function normalizeSubjectName(subjectName, maxLength = 100) {
    if (!subjectName) return "N/A";
    const trimmed = subjectName.trim();
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.substring(0, maxLength) + "...";
}

export function calculateCurrentGPA(activities) {
    let total = 0;
    const remainingActivities = [];

    activities.forEach((activity) => {
        const { grade, percentage } = activity;
        if (Number.isFinite(grade) && Number.isFinite(percentage)) {
            total += grade * percentage;
        } else {
            remainingActivities.push(activity);
        }
    });

    return {
        currentGPA: total,
        remainingActivities
    };
}

export function calculateRequiredGrade(targetGPA, currentGPA, remainingWeight) {
    if (remainingWeight === 0) return null;
    const required = (targetGPA - currentGPA) / remainingWeight;
    if (required < 0) return 0.0;
    return required;
}

export function calculateRequiredGradePerActivity(remainingActivities, currentGPA, targetGPA = 3.0) {
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
