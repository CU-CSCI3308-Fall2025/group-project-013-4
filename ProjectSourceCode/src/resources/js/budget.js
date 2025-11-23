document.addEventListener("DOMContentLoaded", () => {
  const budgetForm = document.getElementById("budgetForm");
  const chartSection = document.querySelector(".chart-section");
  const envelopesList = document.getElementById("envelopesList");
  const envelopesSummary = document.getElementById("envelopesSummary");
  const envelopesEmptyState = document.getElementById("envelopesEmptyState");
  const budgetModal = document.getElementById("budgetModal");
  const openBudgetModal = document.getElementById("openBudgetModal");
  const closeModal = document.querySelector(".close-modal");

  openBudgetModal.addEventListener("click", () => {
    budgetModal.style.display = "flex";
  });

  closeModal.addEventListener("click", () => {
    budgetModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === budgetModal) {
      budgetModal.style.display = "none";
    }
  });

  const token = localStorage.getItem("token");
  if (!token) {
    // Not logged in, redirect
    window.location.href = "/login";
    return;
  }

  const chartColors = {
  Food: "#f3c258",
  Groceries: "#86d9a7",
  Transportation: "#75b7f2",
  Shopping: "#f59ecb",
  Entertainment: "#c7b4f2",
  Bills: "#f29797",
  Pets: "#f7d59c",
  Health: "#70d3cf",
  Other: "#bfcad3",
  };


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
      card.dataset.id = row.id;

      card.innerHTML = `
      <div class="envelope-header-row">
        <header class="envelope-header" data-category="${category}">
          ${category}
        </header>
        <div class="envelope-actions">
          <span class="period-label">${period}</span>
          <button class="delete-budget-btn" title="Delete budget" aria-label="Delete budget">
            &times;
          </button>
        </div>
      </div>

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

  // delete envelope actions
  if (envelopesList) {
    envelopesList.addEventListener("click", async (event) => {
      const deleteBtn = event.target.closest(".delete-budget-btn");
      if (!deleteBtn) return;

      const card = deleteBtn.closest(".envelope-card");
      const budgetId = card?.dataset.id;

      if (!budgetId) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this budget?"
      );

      if (!confirmed) return;

      try {
        const res = await fetch(`/api/budgets/${budgetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to delete budget");
        }

        loadBudgetSummary();
      } catch (err) {
        alert(err.message);
      }
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
        <h2>Summary</h2>
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
        "<h2 class='chart-title'>Monthly Spending Breakdown</h2><p class='empty-text'>No budgets set for this month.</p>";
      return;
    }

    else if (summaryRows.every(row => Number(row.total_spent) === 0)) {
      chartSection.innerHTML =
        "<h2 class='chart-title'>Monthly Spending Breakdown</h2><p class='empty-text'>Log a transaction to see your monthly spending!</p>";
      return;
    }

    chartSection.innerHTML =
      "<h2 class='chart-title'>Monthly Spending Breakdown</h2>";

    const canvas = document.createElement("canvas");
    canvas.style.maxHeight = "400px";
    canvas.style.maxWidth = "400px";
    canvas.style.margin = "0 auto";
    chartSection.appendChild(canvas);

    const labels = summaryRows.map((row) => row.category || "Other");
    const values = summaryRows.map((row) => Number(row.total_spent) || 0);

    const backgroundColors = summaryRows.map(
    (row) => chartColors[row.category] || chartColors["Other"]
);

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
            backgroundColor: backgroundColors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            // align: "start",
            labels: {
              color: "#64748b",
              font: {
                size: 12,
              },
              boxWidth: 12,
              padding: 8,
            },
          },
          tooltip: {
            backgroundColor: "#fff",
            titleColor: "#1e293b",
            bodyColor: "#1e293b",
            borderColor: "#ccc",
            borderWidth: 1,
            padding: 8,
            displayColors: true,  
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