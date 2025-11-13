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

function renderTransactions(transactions) {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return; // CSS empty state handles it
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

          <div class="transaction-actions">
              <button class="edit-btn" data-id="${t.id}">✏️</button>
              <button class="delete-btn" data-id="${t.id}">🗑️</button>
          </div>
      </div>
    `;

    container.appendChild(card);

    // ✅ ATTACH LISTENERS INSIDE THE LOOP
    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteTransaction(t.id);
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      openEditModal(t);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
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
        const editingId = transactionForm.getAttribute("data-editing-id");
        const isEditing = Boolean(editingId);

        const endpoint = isEditing ? `/api/transactions/${editingId}` : `/api/transactions`;

        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(endpoint, {
        method,

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

// DELETE transaction
async function deleteTransaction(id) {
  const token = localStorage.getItem('token');
  if (!token) return;

  if (!confirm("Delete this transaction?")) return;

  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to delete transaction");
    return;
  }

  // ✅ Clear the form if user was editing
  transactionForm.reset();
  transactionForm.removeAttribute("data-editing-id");
  document.getElementById('created_at').value = "";

  // ✅ Reload transaction list
  loadTransactions();
}


//Inline edit
function openEditModal(transaction) {
  // Prefill the form with existing values
  document.getElementById('amount').value = transaction.amount;
  document.getElementById('category').value = transaction.category;
  document.getElementById('description').value = transaction.description;
  document.getElementById('created_at').value = toDatetimeLocalFormat(transaction.created_at);


  // Store the ID so we know this is an update
  transactionForm.setAttribute("data-editing-id", transaction.id);
}

//Converts the date of the transaction in a usuable format
function toDatetimeLocalFormat(timestamp) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}


