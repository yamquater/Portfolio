/** Formulaire de contact (Web3Forms, envoi AJAX) et copie de l'e-mail. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RULES = {
  name: (v) => (v.trim().length < 2 ? 'Indiquez votre nom (2 caractères minimum).' : ''),
  email: (v) => (!EMAIL_RE.test(v.trim()) ? 'Indiquez une adresse e-mail valide.' : ''),
  message: (v) => (v.trim().length < 10 ? 'Votre message doit contenir au moins 10 caractères.' : ''),
};

export function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const submit = form.querySelector('[type="submit"]');
  const label = submit.querySelector('.btn__label');

  const validateField = (name) => {
    const input = form.elements[name];
    const msg = RULES[name](input.value);
    const field = input.closest('.field');
    const err = document.getElementById(`e-${name}`);
    field.classList.toggle('has-error', Boolean(msg));
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    if (msg) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
    err.textContent = msg;
    return !msg;
  };

  Object.keys(RULES).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => { if (input.value) validateField(name); });
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) validateField(name); });
  });

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = `form__status${kind ? ` is-${kind}` : ''}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = Object.keys(RULES).map(validateField);
    if (results.includes(false)) {
      const firstInvalid = Object.keys(RULES).find((n, i) => !results[i]);
      form.elements[firstInvalid].focus();
      setStatus('Merci de corriger les champs indiqués.', 'error');
      return;
    }

    submit.disabled = true;
    label.textContent = 'Envoi en cours…';
    setStatus('', '');

    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
      form.reset();
      setStatus('Message envoyé. Merci, je vous réponds rapidement.', 'success');
    } catch (err) {
      console.error('[portfolio] envoi du formulaire :', err);
      setStatus("L'envoi a échoué. Réessayez ou écrivez-moi directement par e-mail.", 'error');
    } finally {
      submit.disabled = false;
      label.textContent = 'Envoyer le message';
    }
  });
}

export function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const use = btn.querySelector('use');
        btn.classList.add('is-done');
        btn.setAttribute('aria-label', 'Adresse copiée');
        use.setAttribute('href', '#i-check');
        setTimeout(() => {
          btn.classList.remove('is-done');
          btn.setAttribute('aria-label', "Copier l'adresse e-mail");
          use.setAttribute('href', '#i-copy');
        }, 2000);
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });
}
