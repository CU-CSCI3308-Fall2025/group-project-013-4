function getRankClass(index) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "regular";
}

async function loadLeaderboard(type) {
  const container = document.getElementById("leaderboard-list");
  container.innerHTML = "<p style='padding: 1rem;'>Loading...</p>";

  try {
    const res = await fetch(`/api/leaderboard/${type}`);
    const data = await res.json();

    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p style='padding: 1rem;'>No data available.</p>";
      return;
    }

    data.forEach((user, index) => {
      const rankClass = getRankClass(index);

      const totalSpending = Number(user.total_spending || 0);
      const totalBudget   = Number(user.total_budget || 0);

      const savingsPct = user.savings_percentage !== null &&
                         user.savings_percentage !== undefined
        ? (user.savings_percentage * 100).toFixed(1) + "%"
        : "No budget set";

      container.innerHTML += `
        <div class="leaderboard-item ${index < 3 ? "top-three" : ""}">

          <div class="rank-section">
            <div class="rank-number ${rankClass}">${index + 1}</div>

            <div class="user-section">
              <div class="user-avatar">
                <img 
                src="${user.profile_picture || '/resources/img/PFP_Default.jpeg'}" 
                alt="${user.username}" 
                class="user-avatar-img" 
                />
              </div>
              <div class="user-info">
                <h3>${user.username}</h3>
                <div class="user-stats">
                  <span class="stat-item">
                    💸 Spent: $${totalSpending.toFixed(2)}
                  </span>
                  <span class="stat-item">
                    📊 Budget: $${totalBudget.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="savings-section">
            <div class="savings-amount">${savingsPct}</div>
            <div class="savings-label">Savings % (this month)</div>
          </div>

        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='padding: 1rem;'>Error loading leaderboard.</p>";
  }
}

loadLeaderboard("global");