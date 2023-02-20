import { emojiRegExp } from '../error-validations/emoji-regexp.js';
import sanitizeHtml from 'sanitize-html';
// error catcher for async functions with database call
function catchAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(err => next(err));
  };
}

// function that removes all emojis in strings
function removeEmoji(string) {
  return string.replace(emojiRegExp, '');
}

// function to sanitize strings from html injection
function sanitizeObj(object) {
  let outputObj = {};
  for (let [key, value] of Object.entries(object)) {
    if (typeof value === 'string') {
      outputObj[key] = sanitizeHtml(value);
      // .replace(/[\\[.+*?(){|^$\/]/g, '');
    } else {
      outputObj[key] = value;
    }
  }
  return outputObj;
}

// function to make text inputs in objects more neat
function trimStringsOfObj(object) {
  let outputObj = {};
  for (let [key, value] of Object.entries(object)) {
    if (typeof value === 'string') {
      outputObj[key] = value.trim().replace(/\s+/, ' ');
      // .replace(/[\\[.+*?(){|^$\/]/g, '');
    } else {
      outputObj[key] = value;
    }
  }
  return outputObj;
}
// sorting function alphabetical order
function sortAccdgToTitle(array) {
  return array.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
}

// simplify timestamp
function simplifyTimeStamp(timeStamp) {
  let time = timeStamp.toLocaleTimeString();
  let date = timeStamp.toDateString();
  date = date.slice(0, -5) + ' ' + date.slice(-4);
  time = time.slice(0, -6) + ' ' + time.slice(-2);
  return date + ', ' + time;
}

// adds isOwner data in the document
function isDocOwner(userStr, doc) {
  if (!userStr) return false;
  if (!doc) return false;
  for (let i = 0; i < doc.owners.length; i++) {
    if (userStr === doc.owners[i].username) return true;
  }
  return false;
}

export { catchAsync, removeEmoji, sanitizeObj, trimStringsOfObj, sortAccdgToTitle, simplifyTimeStamp, isDocOwner };
