const cancelBtn = document.querySelector('#cancel-button');
cancelBtn.addEventListener('mouseenter', () => {
  cancelBtn.innerHTML = '❌';
});
cancelBtn.addEventListener('mouseleave', () => {
  cancelBtn.innerHTML = '✖';
});
