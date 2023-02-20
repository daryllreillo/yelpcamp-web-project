import express from 'express';
// import session from 'express-session';
// import engine from 'ejs-mate';
import passport from 'passport';
import LocalStrategy from 'passport-local';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
import { User } from '../models/models.js';
import { catchAsync } from '../error-validations/generic-functions.js';
import { userControl } from '../controllers/usersControl.js';
import { getPageBeforeLogin } from '../middlewares.js';

const app = express();
const usersRouter = express.Router();
// const __filepath = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filepath);
// const sessionConfig = {
//   secret: 'secretShiz',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
//     maxAge: 1000 * 60 * 60 * 24 * 30,
//     httpOnly: true,
//   },
// };

// app.engine('ejs', engine);
// app.set('views', join(__dirname, '/views'));
// app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: true }));
// app.use(session(sessionConfig));
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
