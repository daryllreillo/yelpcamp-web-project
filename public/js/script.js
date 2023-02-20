'use strict';

// Custom bootstrap form validation
const forms = document.querySelectorAll('.needs-validation');
forms?.forEach(form => {
  form.addEventListener(
    'submit',
    event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    },
    false
  );
});

// populates tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// repeat password logic
let passwordStr = '';
const passwordElem = document.querySelector('#password');
const repeatPasswordElem = document.querySelector('#repeat-password');
passwordElem?.addEventListener('input', () => {
  passwordStr = passwordElem.value;
});
repeatPasswordElem?.addEventListener('input', () => {
  repeatPasswordElem.attributes.pattern.value = passwordStr;
});

// navbar active toggler
/* 
This navbar active toggler script requires a hidden markup id 'nav-page' on the actual page.
e.g.: <div hidden id="nav-page">nav-login</div>
The innerHTML of the hidden markup id should match the markup id of the .nav-link in the navbar markup.
e.g.: <a class="nav-link" id="nav-login" href="/login">Login</a>
On above example: 'nav-login' matches
*/
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('load', event => {
  const navPage = document.querySelector('#nav-page')?.innerHTML;
  navLinks?.forEach(navLink => {
    navLink.classList.remove('active');
  });
  document.querySelector(`#${navPage}`)?.classList.add('active');
});
