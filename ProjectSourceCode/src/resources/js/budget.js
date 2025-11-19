document.addEventListener("DOMContentLoaded", () => {
  const budgetForm = document.getElementById("budgetForm");
  const chartSection = document.querySelector(".chart-section");
  const envelopesList = document.getElementById("envelopesList");
  const envelopesSummary = document.getElementById("envelopesSummary");
  const envelopesEmptyState = document.getElementById("envelopesEmptyState");

  const token = localStorage.getItem("token");
  if (!token) {
    // Not logged in, redirect
    window.location.href = "/login";
    return;
  }

  //save/update budget
  if (budgetForm) {
    budgetForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const category = document.getElementById("budgetCategory").value;
      const amount = parseFloat(
        document.getElementById("budgetAmount").value
      );
      const period = document.getElementById("budgetPeriod").value;

      if (!category || isNaN(amount) || amount < 0) {
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
        document.getElementById("budgetCategory").value = "";
        alert("Budget saved!");

        loadBudgetSummary();

      } catch (err) {
        alert(err.message);
      }
    });
  }

  //load summary and chart
  async function loadBudgetSummary() {
    try {
      const res = await fetch("/api/budgets/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load budget summary");
      }

      const summary = await res.json();

      renderEnvelopes(summary);
      renderEnvelopeTotals(summary);
      renderSpendingPieChart(summary);

    } catch (err) {
      console.error("Failed to load summary:", err);
      if (envelopesList) {
        envelopesList.innerHTML = "<p>Could not load envelopes.</p>";
      }
      if (chartSection) {
        chartSection.innerHTML = "<p>Could not load summary data.</p>";
      }
    }
  }

  // envelope cards
  function renderEnvelopes(summaryRows) {
    if (!envelopesList) return;

    envelopesList.innerHTML = "";

    const hasEnvelopes = summaryRows && summaryRows.length > 0;
    if (envelopesEmptyState) {
      envelopesEmptyState.style.display = hasEnvelopes ? "none" : "block";
    }
    if (!hasEnvelopes) return;

    summaryRows.forEach((row) => {
      const category = row.category || "Other";
      const budget = Number(row.budget_amount) || 0;
      const spent = Number(row.total_spent) || 0;
      const remaining = Number(row.remaining_amount) || 0;
      const period = row.period || "monthly";

      const pctUsed = budget > 0 ? (spent / budget) * 100 : 0;
      const pctClamped = Math.min(pctUsed, 100);

      let status = "ok";
      if (pctUsed >= 100) status = "over";
      else if (pctUsed >= 80) status = "warning";

      const card = document.createElement("article");
      card.className = `envelope-card envelope-${status}`;
      card.dataset.category = category;

      card.innerHTML = `
        <header class="envelope-header">
          <h3>${category}</h3>
          <span class="period-label">${period}</span>
        </header>

        <div class="envelope-amounts">
          <div><span>Budget:</span> <strong>$${budget.toFixed(2)}</strong></div>
          <div><span>Spent:</span> <strong>$${spent.toFixed(2)}</strong></div>
          <div><span>Remaining:</span> <strong>$${remaining.toFixed(2)}</strong></div>
        </div>

        <div class="envelope-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${pctClamped.toFixed(0)}%;"></div>
          </div>
          <div class="progress-label">${pctUsed.toFixed(0)}% used</div>
        </div>
      `;

      envelopesList.appendChild(card);
    });
  }

  //overall totals
  function renderEnvelopeTotals(summaryRows) {
    if (!envelopesSummary) return;

    const totalBudget = (summaryRows || []).reduce(
      (sum, row) => sum + (Number(row.budget_amount) || 0),
      0
    );
    const totalSpent = (summaryRows || []).reduce(
      (sum, row) => sum + (Number(row.total_spent) || 0),
      0
    );
    const remaining = Math.max(0, totalBudget - totalSpent);

    envelopesSummary.innerHTML = `
      <div class="summary-card">
        <div class="summary-item">
          <span class="label">Total Budget</span>
          <span class="value">$${totalBudget.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Spent</span>
          <span class="value">$${totalSpent.toFixed(2)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Remaining</span>
          <span class="value">$${remaining.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  //pie chart
  let spendingChartInstance = null;

  function renderSpendingPieChart(summaryRows) {
    if (!chartSection) return;

    if (!summaryRows || summaryRows.length === 0) {
      chartSection.innerHTML =
        "<h2>Spending Breakdown</h2><p>No budgets set for this month.</p>";
      return;
    }

    chartSection.innerHTML =
      '<h2>Spending Breakdown (Current Month)</h2>';
    const canvas = document.createElement("canvas");
    canvas.style.maxHeight = "400px";
    canvas.style.maxWidth = "400px";
    canvas.style.margin = "0 auto";
    chartSection.appendChild(canvas);

    const labels = summaryRows.map((row) => row.category || "Other");
    const values = summaryRows.map((row) => Number(row.total_spent) || 0);

    if (spendingChartInstance) {
      spendingChartInstance.destroy();
    }

    spendingChartInstance = new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Total Spent",
            data: values,
            backgroundColor: [
              "#ed1847ff",
              "#1278bcff",
              "#9fff56ff",
              "#010f0fff",
              "#9966FF",
              "#f5820eff",
              "#d2e555ff",
              "#E7E9ED",
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

                const total = context.chart.data.datasets[0].data.reduce(
                  (a, b) => a + b,
                  0
                );

                let percentage = total > 0
                  ? ((value / total) * 100).toFixed(1)
                  : "0.0";
                return `${label}: $${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  loadBudgetSummary();
});