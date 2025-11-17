
document.addEventListener("DOMContentLoaded", () => {
  const budgetForm = document.getElementById("budgetForm");
  const chartSection = document.querySelector(".chart-section");

  const token = localStorage.getItem("token");
  if (!token) {
    // Not logged in, redirect
    window.location.href = "/login";
    return;
  }

  if (budgetForm) {
    budgetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const category = document.getElementById("budgetCategory").value;
      const amount = parseFloat(document.getElementById("budgetAmount").value);
      const period = document.getElementById("budgetPeriod").value;

      if (!category || isNaN(amount)) {
        alert("Please select a category and enter a valid amount.");
        return;
      }

      try {
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category, amount, period }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to save budget");
        }

        budgetForm.reset();
        document.getElementById('budgetCategory').value = ""; 
        alert("Budget saved!");
    
      } catch (err) {
        alert(err.message);
      }
    });
  }


  async function loadSummaryData() {
    try {
      const spendingRes = await fetch("/api/transactions/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!spendingRes.ok) {
        throw new Error("Failed to load spending data");
      }

      const spendingSummary = await spendingRes.json();

      chartSection.innerHTML = "";
      renderSpendingPieChart(spendingSummary);

    } catch (err) {
      console.error("Failed to load summary:", err);
      chartSection.innerHTML = "<p>Could not load summary data.</p>";
    }
  }

  // pie chart
  function renderSpendingPieChart(data) {
    if (!data || data.length === 0) {
      chartSection.innerHTML = "<h2>Spending Breakdown</h2><p>No spending this month.</p>";
      return;
    }

    chartSection.innerHTML = '<h2>Spending Breakdown (Current Month)</h2>';
    const canvas = document.createElement("canvas");
    canvas.style.maxHeight = "400px";
    canvas.style.maxWidth = "400px";
    canvas.style.margin = "0 auto";
    chartSection.appendChild(canvas);
    
    new Chart(canvas, {
      type: "pie",
      data: {
        labels: data.map((d) => d.category),
        datasets: [
          {
            label: "Total Spent",
            data: data.map((d) => d.total_spent),
            // Optional: Add some nice colors
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
              '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED'
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { 
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                let value = context.parsed;
                
                // Find the total sum of all data points
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                
                let percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value} (${percentage}%)`;
              }
            }
          }
        }
      },
    });
  }
  
  // --- Load all data on page load ---
  loadSummaryData();
});