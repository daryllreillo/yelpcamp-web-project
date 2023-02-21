import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { User } from '../models/models.js';
import { catchAsync } from '../error-validations/generic-functions.js';
import { userControl } from '../controllers/usersControl.js';
import { getPageBeforeLogin } from '../middlewares.js';

const app = express();
const usersRouter = express.Router();
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// login routes
usersRouter
  .route('/login')
  .get(getPageBeforeLogin, userControl.renderLogin)
  .post(passport.authenticate('local', { failureRedirect: '/login', failureFlash: true, keepSessionInfo: true }), userControl.attemptLogin);

// register routes
usersRouter.route('/register').get(getPageBeforeLogin, catchAsync(userControl.renderRegister)).post(catchAsync(userControl.attemptRegister));

// logut routes
usersRouter.route('/logout').get(userControl.logout);

export { usersRouter };
