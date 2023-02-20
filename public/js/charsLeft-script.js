const charsLeft = document.querySelector('#chars-left');
const message = document.querySelector('#message');

message?.addEventListener('input', event => {
  const messageLength = message.value.length;
  const left = 500 - messageLength;
  charsLeft.innerHTML = `Characters left: ${left}`;
});
