(function () {
    function calculateGPA() {
        let total = 0;
        let remainingActivities = [];

        const gradeContainers = document.querySelectorAll(
            "span.bloque-row.datos-parcial.af_panelGroupLayout"
        );

        const subjectNameElement = document.querySelector("span.titulo-nombre-asignatura.af_panelGroupLayout");
        let subjectName = subjectNameElement ? subjectNameElement.textContent.trim() : "N/A";

        // Limit to 20 characters with ellipsis
        if (subjectName.length > 20) {
            subjectName = subjectName.substring(0, 20) + "...";
        }

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
                remainingActivities.push({
                    description,
                    percentage: percentage / 100,
                    container
                });
            }

        })
        return {
            subjectName,
            currentGPA: total,
            remainingActivities
        };
    }

    function calculateRequiredGrade(targetGPA, currentGPA, remainingWeight) {
        if (remainingWeight === 0) return null;
        const required = (targetGPA - currentGPA) / remainingWeight;

        if (required < 0) return 0.0;
        return required;
    }

    function calculateRequiredGradePerActivity(remainingActivities, currentGPA, targetGPA = 3.0) {
        // Calculate total remaining weight
        const remainingWeight = remainingActivities.reduce((sum, activity) => {
            return sum + (isNaN(activity.percentage) ? 0 : activity.percentage);
        }, 0);

        if (remainingWeight === 0) {
            return null;
        }

        const requiredGrade = calculateRequiredGrade(targetGPA, currentGPA, remainingWeight);

        if (requiredGrade === null) {
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
        const isNotPossible = requiredGrade > 5;

        activities.forEach((activity) => {
            if (!activity.container) return;

            const resultDiv = document.createElement("div");
            resultDiv.setAttribute("data-required-grade-ui", "true");
            resultDiv.classList.add("gpa-required-grade");

            const percentageDisplay = isNaN(activity.percentage)
                ? "N/A"
                : (activity.percentage * 100).toFixed(1) + "%";

            const gradeDisplay = isNotPossible
                ?  Number(requiredGrade).toFixed(1) + " 💀"
                : Number(requiredGrade).toFixed(1);

            resultDiv.innerHTML = `
                <strong class="${isNotPossible ? 'gpa-grade-impossible' : 'gpa-grade-possible'}">Calificación mínima para aprobar: ${gradeDisplay}</strong>
            `;

            activity.container.appendChild(resultDiv);
        });
    }

    function refreshCalculation() {
        // Remove old required grade UI elements
        document.querySelectorAll("[data-required-grade-ui]").forEach((el) => el.remove());

        // Recalculate GPA
        const data = calculateGPA();

        // Update the GPA display
        const gpaValueDiv = document.querySelector(".gpa-value");
        if (gpaValueDiv) {
            gpaValueDiv.textContent = data.currentGPA.toFixed(1);
        }

        // update the subject name
        const subjectNameDiv = document.getElementById("gpa-subject-name");
        if (subjectNameDiv) {
            subjectNameDiv.textContent = `📊 ${data.subjectName}`;
        }

        // Recalculate and display required grades
        const requiredData = calculateRequiredGradePerActivity(
            data.remainingActivities,
            data.currentGPA,
            3.0
        );
        if (requiredData) {
            injectRequiredGradeUI(requiredData);
        }
    }

    function injectUI(gpa, title = "Promedio calculado") {
        // Accept 0 as a valid value; only bail out on null/undefined
        if (gpa == null) return;

        // Avoid duplicates
        if (document.getElementById("gpa-extension-box")) return;

        const box = document.createElement("div");
        box.id = "gpa-extension-box";
        const gpaText = (typeof gpa === "number") ? gpa.toFixed(1) : gpa;
        box.innerHTML = `
            <strong id="gpa-subject-name">📊 ${title}</strong>
            <div class="gpa-value">${gpaText}</div>
            <button id="gpa-refresh-btn">🔄 Calcular</button>
        `;

        document.body.appendChild(box);

        // Attach click listener to refresh button
        const refreshBtn = document.getElementById("gpa-refresh-btn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", refreshCalculation);
        }
    }

    // Wait until page loads fully (important for dynamic sites)
    window.addEventListener("load", () => {
        setTimeout(() => {
            const data = calculateGPA();
            injectUI(data.currentGPA, data.subjectName);

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
