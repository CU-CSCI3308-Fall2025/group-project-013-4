console.log('settings.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api/auth';

  // Profile upload
  const profileInput = document.getElementById('profile-upload');
  if (profileInput) {
    profileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('profile', file);

      const token = localStorage.getItem('token');

      try {
        const res = await fetch(`${API_BASE}/upload-profile`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();

        if (res.ok) {
          // Update navbar image instantly
          const navProfile = document.querySelector('.nav-profile');
          if (navProfile) navProfile.src = data.url;
          alert('✅ Profile picture updated!');
        } else {
          alert(`⚠️ ${data.message || 'Upload failed'}`);
        }
      } catch (err) {
        console.error(err);
        alert('⚠️ Something went wrong. Try again later.');
      }
    });
  }

  // Delete account
  const deleteAccountBtn = document.getElementById('Delete_Account');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      const confirmDelete = confirm('⚠️ Are you sure you want to delete your account? This cannot be undone.');
      if (!confirmDelete) return;

      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`${API_BASE}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json().catch(() => ({}));

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
  }
});
