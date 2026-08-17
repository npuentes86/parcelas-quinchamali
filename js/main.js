document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const success = document.getElementById('lead-success');

  const validators = {
    name: v => v.trim().length > 1,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: v => v.replace(/[^0-9]/g, '').length >= 8,
  };

  function fieldOf(input) {
    return input.closest('.field');
  }

  function validateInput(input) {
    const ok = validators[input.name] ? validators[input.name](input.value) : true;
    fieldOf(input).classList.toggle('invalid', !ok);
    return ok;
  }

  ['name', 'email', 'phone'].forEach(name => {
    const input = form.elements[name];
    input.addEventListener('blur', () => validateInput(input));
    input.addEventListener('input', () => {
      if (fieldOf(input).classList.contains('invalid')) validateInput(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const names = ['name', 'email', 'phone'];
    const results = names.map(n => validateInput(form.elements[n]));
    if (results.every(Boolean)) {
      form.querySelectorAll('input, button').forEach(el => el.disabled = true);
      success.hidden = false;
    } else {
      const firstInvalid = names.find((n, i) => !results[i]);
      form.elements[firstInvalid].focus();
    }
  });
});
