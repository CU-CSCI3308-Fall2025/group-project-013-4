// ------------------------------
// TRANSACTION PAGE LOGIC ONLY
// ------------------------------

// ✅ Fetch user's transactions
async function fetchTransactions() {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const res = await fetch('/api/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await res.json();
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return [];
  }
}

// ✅ Render the transactions list
function renderTransactions(transactions) {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return; // CSS empty state takes care of it
  }

  transactions.forEach(t => {
    const category = t.category ? String(t.category) : "Other";
    const amount = Number(t.amount) || 0;

    let dateStr = "Unknown date";
    try {
      dateStr = new Date(t.created_at).toLocaleString();
    } catch (e) {
      console.warn("Invalid date:", t.created_at);
    }

    const card = document.createElement('div');
    card.className = 'transaction-card';
    card.setAttribute('data-category', category);

    card.innerHTML = `
      <div class="transaction-details">
        <span class="transaction-category">${category.toUpperCase()}</span>
        <div class="transaction-desc">${t.description || 'No description'}</div>
        <div class="transaction-date">${dateStr}</div>
      </div>

      <div class="transaction-amount-section">
        <div class="transaction-amount">${amount.toFixed(2)}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ✅ Load all transactions
async function loadTransactions() {
  const list = await fetchTransactions();
  renderTransactions(list);
}

// ✅ Handle "Add Transaction" form
const transactionForm = document.getElementById('transactionForm');

if (transactionForm) {
  transactionForm.addEventListener('submit', async event => {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const created_at = document.getElementById('created_at').value;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          category,
          description,
          created_at
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.message || data.error}`);
        return;
      }

      // ✅ Reload the list & clear form
      await loadTransactions();
      transactionForm.reset();

    } catch (err) {
      console.error(err);
      alert('Failed to add expense.');
    }
  });

  // ✅ Load the user's transaction history on page load
  loadTransactions();
}
