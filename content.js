(function () {
    function calculateGPA() {
        let total = 0;
        let remainingActivities = [];

        const gradeContainers = document.querySelectorAll(
            "span.bloque-row.datos-parcial.af_panelGroupLayout"
        );


        console.log("Grade Containers:");
        console.log(gradeContainers);

        gradeContainers.forEach((container) =>  {

            const descriptionSpan = container.querySelector(
                "span.datos-parcial-item.datos-parcial-descripcion.af_panelGroupLayout"
            );
            const description = descriptionSpan ? descriptionSpan.textContent.trim() : "N/A";

            const percentageSpan = container.querySelector(
                "span.datos-parcial-item.datos-parcial-porcentaje.af_panelGroupLayout"
            );
            const percentageText = percentageSpan ? percentageSpan.textContent.trim() : "N/A";
            // if percentage is missing, treat as NaN so we don't silently use 0 weight
            const percentage = percentageSpan ? parseFloat(percentageText.replace("%", "")) : NaN;

            const gradeSpan = container.querySelector(
                "span.af_panelGroupLayout:not(.datos-parcial-porcentaje):not(.datos-parcial-descripcion):not(.datos-parcial-calificacion-minima):not(.datos-parcial-faltas)"
            );
            const grade = gradeSpan ? parseFloat(gradeSpan.textContent.trim()) : NaN;


            // Only compute and append when we have both valid grade and percentage
            if (!isNaN(grade) && !isNaN(percentage)) {
                const ponderate = grade * (percentage / 100);
                // For debugging calculations, uncomment below:
                // const ponderDiv = document.createElement("div");
                // ponderDiv.innerText = `Ponderado: ${ponderate.toFixed(1)}`;
                // container.appendChild(ponderDiv);
                total += ponderate;
            } else {
                // Use push (arrays don't have append). Include which values are missing.
                remainingActivities.push({
                    description,
                    percentage: percentage / 100,
                    container
                });
            }

        })
        return {
            currentGPA: total,
            remainingActivities
        };
    }

    function calculateRequiredGrade(targetGPA, currentGPA, remainingWeight) {
        if (remainingWeight === 0) return null;
        const required = (targetGPA - currentGPA) / remainingWeight;

        if (required < 0) return 0.0;
        if (required > 5.0) return "Not possible to pass";
        return required;
    }

    function calculateRequiredGradePerActivity(remainingActivities, currentGPA, targetGPA = 3.0) {
        // Calculate total remaining weight
        const remainingWeight = remainingActivities.reduce((sum, activity) => {
            return sum + (isNaN(activity.percentage) ? 0 : activity.percentage);
        }, 0);

        if (remainingWeight === 0) {
            console.log("No remaining activities with valid weight.");
            return null;
        }

        const requiredGrade = calculateRequiredGrade(targetGPA, currentGPA, remainingWeight);

        if (requiredGrade === null) {
            console.log("Cannot calculate required grade: no remaining weight.");
            return null;
        }

        return {
            requiredGrade,
            remainingWeight,
            activities: remainingActivities
        };
    }

    function injectRequiredGradeUI(data) {
        if (!data || !data.activities) return;

        const { requiredGrade, activities } = data;
        const isNotPossible = requiredGrade === "Not possible to pass";

        activities.forEach((activity) => {
            if (!activity.container) return;

            const resultDiv = document.createElement("div");
            resultDiv.style.marginTop = "8px";
            resultDiv.style.padding = "8px";
            resultDiv.style.backgroundColor = "#f0f0f0";
            resultDiv.style.borderRadius = "4px";
            resultDiv.style.fontSize = "12px";

            const percentageDisplay = isNaN(activity.percentage)
                ? "N/A"
                : (activity.percentage * 100).toFixed(1) + "%";

            const gradeDisplay = isNotPossible
                ? requiredGrade
                : Number(requiredGrade).toFixed(2);

            resultDiv.innerHTML = `
                <strong style="color: ${isNotPossible ? 'red' : 'green'};">Calificación mínima para aprobar: ${gradeDisplay}</strong>
            `;

            activity.container.appendChild(resultDiv);
        });
    }

    function injectUI(gpa) {
        // Accept 0 as a valid value; only bail out on null/undefined
        if (gpa == null) return;

        // Avoid duplicates
        if (document.getElementById("gpa-extension-box")) return;

        const box = document.createElement("div");
        box.id = "gpa-extension-box";
        const gpaText = (typeof gpa === "number") ? gpa.toFixed(1) : gpa;
        box.innerHTML = `
      <strong>📊 GPA Calculado</strong>
      <div class="gpa-value">${gpaText}</div>
    `;

        document.body.appendChild(box);
    }

    // Wait until page loads fully (important for dynamic sites)
    window.addEventListener("load", () => {
        setTimeout(() => {
            const data = calculateGPA();
            injectUI(data.currentGPA);
            console.log("GPA:", data.currentGPA);
            console.log("Remaining Activities:", data.remainingActivities);

            // Calculate and display required grades for remaining activities
            const requiredData = calculateRequiredGradePerActivity(
                data.remainingActivities,
                data.currentGPA,
                3.0
            );
            if (requiredData) {
                injectRequiredGradeUI(requiredData);
            }
        }, 2000);
    });
})();
