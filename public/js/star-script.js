'use strict';
const starStyleToChange = document.querySelector('#star-styler');
const rating = document.querySelector('#rating');
const starInputs = document.querySelectorAll('.star-style-variation-input');
starInputs?.forEach(star => {
  star.addEventListener('input', event => {
    switch (star.value) {
      case '1':
        starStyleToChange.classList.remove('starability-heartbeat', 'starability-grow');
        rating.value = 1;
        break;
      case '2':
        starStyleToChange.classList.remove('starability-heartbeat', 'starability-grow');
        rating.value = 2;
        break;
      case '3':
        starStyleToChange.classList.remove('starability-heartbeat', 'starability-grow');
        rating.value = 3;
        break;
      case '4':
        starStyleToChange.classList.remove('starability-heartbeat', 'starability-grow');
        starStyleToChange.classList.add('starability-grow');
        rating.value = 4;
        break;
      case '5':
        starStyleToChange.classList.remove('starability-grow', 'starability-heartbeat');
        starStyleToChange.classList.add('starability-heartbeat');
        rating.value = 5;
        break;
    }
  });
});
const starRatingInputs = document.querySelectorAll('.star-rating');

const starLabels = document.querySelectorAll('.star-style-variation-label');
starLabels?.forEach(starLabel => {
  starLabel.addEventListener('keydown', reenableAllStarRadioInputs);
  starLabel.addEventListener('mouseenter', reenableAllStarRadioInputs);
});
const starValidationForm = document.querySelector('#validation-form');
starValidationForm?.addEventListener('keydown', reenableAllStarRadioInputs);
starValidationForm?.addEventListener('mouseenter', reenableAllStarRadioInputs);
starValidationForm?.addEventListener('submit', event => {
  starRatingInputs.forEach(input => {
    input.disabled = true;
  });
});
function disableAllStarRadioInputs() {
  starInputs.forEach(input => {
    input.disabled = true;
  });
}

function reenableAllStarRadioInputs() {
  starInputs?.forEach(input => {
    input.disabled = false;
  });
}
