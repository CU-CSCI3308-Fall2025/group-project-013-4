// api.js - shared global API helpers

window.API = {
  BASE: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  },

  async authGet(url) {
    const token = window.API.getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async authPost(url, body) {
    const token = window.API.getToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  async authDelete(url) {
    const token = window.API.getToken();
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async authForm(url, method, formData) {
    const token = window.API.getToken();
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    return res.json();
  }
};
