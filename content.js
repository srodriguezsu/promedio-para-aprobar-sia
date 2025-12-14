(function () {
    function calculateGPA() {
        let total = 0;

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
            const percentage = percentageSpan ? parseFloat(percentageText.replace("%", "")) : 0;

            const gradeSpan = container.querySelector(
                "span.af_panelGroupLayout:not(.datos-parcial-porcentaje):not(.datos-parcial-descripcion):not(.datos-parcial-calificacion-minima):not(.datos-parcial-faltas)"
            );
            const grade = gradeSpan ? parseFloat(gradeSpan.textContent.trim()) : NaN;


            // Only compute and append when we have valid numbers
            if (!isNaN(grade)) {
                const ponderate = grade * (percentage / 100);
                const ponderDiv = document.createElement("div");
                ponderDiv.innerText = `Ponderado: ${ponderate.toFixed(1)}`;
                container.appendChild(ponderDiv);
                total += ponderate;
            } else {
                remainingWeight += percentage;
            }

        })
        return {
            currentGPA: total,
            remainingWeight
        };
    }

    function injectUI(gpa) {
        if (!gpa) return;

        // Avoid duplicates
        if (document.getElementById("gpa-extension-box")) return;

        const box = document.createElement("div");
        box.id = "gpa-extension-box";
        box.innerHTML = `
      <strong>📊 GPA Calculado</strong>
      <div class="gpa-value">${gpa}</div>
    `;

        document.body.appendChild(box);
    }

    // Wait until page loads fully (important for dynamic sites)
    window.addEventListener("load", () => {
        setTimeout(() => {
            const gpa = calculateGPA();
            injectUI(gpa);
            console.log("GPA:", gpa);
        }, 2000);
    });
})();
