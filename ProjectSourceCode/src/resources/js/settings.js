console.log('settings.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const deleteAccountBtn = document.getElementById('Delete_Account');
  const API_BASE = '/api/auth';

  if (!deleteAccountBtn) return;

  deleteAccountBtn.addEventListener('click', async () => {
    const confirmDelete = confirm('⚠️ Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        // ignore if no JSON returned
      }

      if (response.ok) {
        alert('✅ Your account has been deleted.');
        localStorage.removeItem('token');
        window.location.href = '/register';
      } else {
        alert(`⚠️ ${data.message || 'Could not delete account'}`);
      }
    } catch (err) {
      console.error(err);
      alert('⚠️ Something went wrong. Try again later.');
    }
  });
});
