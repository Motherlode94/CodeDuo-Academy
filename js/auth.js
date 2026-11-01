(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const feedback = byId('authFeedback');
  const submitButton = byId('submitAuth');
  let registering = false;

  function setMode(isRegistering) {
    registering = isRegistering;
    byId('loginTab').classList.toggle('selected', !registering);
    byId('registerTab').classList.toggle('selected', registering);
    byId('formTitle').textContent = registering ? 'Créer un compte étudiant' : 'Connexion';
    byId('confirmLabel').hidden = !registering;
    byId('confirmPassword').required = registering;
    byId('password').minLength = registering ? 12 : 1;
    byId('password').autocomplete = registering ? 'new-password' : 'current-password';
    byId('password').placeholder = registering ? 'Au moins 12 caractères' : 'Ton mot de passe';
    submitButton.textContent = registering ? 'Créer le compte' : 'Me connecter';
    feedback.textContent = '';
  }

  async function submitCredentials(event) {
    event.preventDefault();
    const username = byId('username').value.trim().toLowerCase();
    const password = byId('password').value;

    if (registering && password !== byId('confirmPassword').value) {
      feedback.textContent = 'Les mots de passe ne correspondent pas.';
      return;
    }

    submitButton.disabled = true;
    feedback.textContent = 'Vérification…';

    try {
      const endpoint = registering ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify({username, password})
      });
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        feedback.textContent = 'API indisponible (HTTP ' + response.status + ').';
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        feedback.textContent = (data.error || 'Connexion refusée.') + ' (HTTP ' + response.status + ')';
        return;
      }
      window.location.assign(data.user?.role === 'admin' ? './admin.html' : './etudiant.html');
    } catch (error) {
      feedback.textContent = 'Service de connexion indisponible.';
    } finally {
      submitButton.disabled = false;
    }
  }

  async function checkHealth() {
    const status = byId('serverHealth');
    if (!status) return;
    status.textContent = 'Vérification de l’API…';
    try {
      const response = await fetch('/api/health', {cache: 'no-store'});
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        status.textContent = 'API inaccessible (HTTP ' + response.status + ').';
        return;
      }
      const data = await response.json();
      status.textContent = response.ok && data.ok
        ? 'Serveur et base de données accessibles.'
        : 'API en erreur (HTTP ' + response.status + ').';
    } catch (error) {
      status.textContent = 'Serveur de connexion inaccessible.';
    }
  }

  byId('loginTab').addEventListener('click', () => setMode(false));
  byId('registerTab').addEventListener('click', () => setMode(true));
  byId('credentialsForm').addEventListener('submit', submitCredentials);
  byId('retryHealth')?.addEventListener('click', checkHealth);
  if (new URLSearchParams(location.search).get('mode') === 'register') setMode(true);
  checkHealth();
})();
