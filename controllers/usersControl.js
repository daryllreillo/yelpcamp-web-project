'use strict';
/* This is the controller file for the users router */
// imports
import { User } from '../models/models.js';

// constants
const userControl = {};

userControl.renderLogin = (req, res) => {
  if (req.session?.passport) {
    req.flash('Success', 'Welcome!');
    res.redirect('/campgrounds');
  } else {
    res.render('users/login.ejs', { pageTitle: 'Login' });
  }
};

userControl.attemptLogin = async (req, res) => {
  const returnTo = req.session.returnTo || req.session.prevPage || '/campgrounds';
  delete req.session.returnTo;
  delete req.session.prevPage;
  req.flash('success', 'Logged in. Welcome back!');
  res.redirect(returnTo);
};

userControl.renderRegister = async (req, res) => {
  if (req.session?.passport) {
    req.flash('success', 'Welcome back!');
    res.redirect('/campgrounds');
  } else {
    res.render('users/register.ejs', { pageTitle: 'Sign up' });
  }
};

userControl.attemptRegister = async (req, res) => {
  const { username, password, email } = req.body;
  const returnTo = req.session.returnTo || req.session.prevPage || '/campgrounds';
  delete req.session.returnTo;
  delete req.session.prevPage;
  try {
    let foundUser = await User.findOne({ username });
    if (!foundUser) foundUser = await User.findOne({ email });
    if (foundUser) {
      req.flash('warning', 'User or email already used. Please try a different user or email');
      res.redirect('/register');
    } else {
      const newUser = new User({ username, email });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, err => {
        if (err) req.flash('error', err);
        else req.flash('success', 'Successfully registered!');
        res.redirect(returnTo);
      });
    }
  } catch (err) {
    req.flash('danger', err.message);
    res.redirect('/register');
  }
};

userControl.logout = (req, res) => {
  if (req.session?.passport) {
    req.logout({ keepSessionInfo: false }, () => {
      req.flash('success', 'Successfully logged out.');
      res.redirect('/login');
    });
  } else {
    req.logout({ keepSessionInfo: true }, () => {
      req.flash('warning', 'You are not logged in.');
      res.redirect('/login');
    });
  }
};

export { userControl };
