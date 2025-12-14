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
                const ponderDiv = document.createElement("div");
                ponderDiv.innerText = `Ponderado: ${ponderate.toFixed(1)}`;
                container.appendChild(ponderDiv);
                total += ponderate;
            } else {
                // Use push (arrays don't have append). Include which values are missing.
                remainingActivities.push({
                    description,
                    percentage: percentage / 100
                });
            }

        })
        return {
            currentGPA: total,
            remainingActivities
        };
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
        }, 2000);
    });
})();
