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
  
      if (data.length === 0) {
        container.innerHTML = "<p style='padding: 1rem;'>No data available.</p>";
        return;
      }
  
      data.forEach((user, index) => {
        const rankClass = getRankClass(index);
  
        container.innerHTML += `
          <div class="leaderboard-item ${index < 3 ? "top-three" : ""}">
  
            <div class="rank-section">
              <div class="rank-number ${rankClass}">${index + 1}</div>
  
              <div class="user-section">
                <div class="user-avatar">
                  ${user.username.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                  <h3>${user.username}</h3>
                  <div class="user-stats">
                    <span class="stat-item">
                      💸 Total Spending: $${Number(user.total_spending).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="savings-section">
              <div class="savings-amount">$${Number(user.total_spending).toFixed(2)}</div>
              <div class="savings-label">Spent</div>
            </div>
  
          </div>
        `;
      });
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p style='padding: 1rem;'>Error loading leaderboard.</p>";
    }
  }
  
  /* -------- Tabs -------- */
  document.getElementById("global-tab").addEventListener("click", () => {
    setActive("global");
    loadLeaderboard("global");
  });
  
  document.getElementById("friends-tab").addEventListener("click", () => {
    setActive("friends");
    loadLeaderboard("friends");
  });
  
  function setActive(tab) {
    document.getElementById("global-tab").classList.remove("active");
    document.getElementById("friends-tab").classList.remove("active");
  
    document.getElementById(`${tab}-tab`).classList.add("active");
  }
  
  loadLeaderboard("global");