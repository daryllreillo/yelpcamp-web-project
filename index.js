'use strict';
// initiate environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// imports
import express from 'express';
import engine from 'ejs-mate';
import methodOverride from 'method-override';
import session from 'express-session';
import flash from 'connect-flash';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AppError } from './error-validations/error-class.js';
import { rootRouter } from './routes/root.js';
import { campgroundsRouter } from './routes/campgrounds.js';
import { campReviewsRouter } from './routes/campreviews.js';
import { usersRouter } from './routes/users.js';
import { loadGenericErrorPage } from './error-validations/loadGenericError.js';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { User } from './models/models.js';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import crypto from 'node:crypto';
import MongoStore from 'connect-mongo';

// express setup
const app = express();
const __filepath = fileURLToPath(import.meta.url);
const __dirname = dirname(__filepath);
const port = process.env.PORT;
const mongoStore = MongoStore.create({
  mongoUrl: process.env.DB_URL,
  secret: process.env.SESSION_SECRET,
  touchAfter: 24 * 3600,
  autoRemove: 'interval',
  autoRemoveInterval: 10, // 10 minutes interval
});
mongoStore.on('error', function (error) {
  console.log('session store error: ', error);
});

const sessionConfig = {
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  cookie: {
    expires: Date.now() + 3 * 24 * 60 * 60 * 1000, // expiration in ms (3 days)
    maxAge: 3 * 24 * 60 * 60 * 1000, // same as expires
    httpOnly: true,
    // secure: true, // once deployed, this should be activated
  },
  store: mongoStore,
};

// standard pre-middlewares
app.engine('ejs', engine);
app.set('views', join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(join(__dirname, '/public')));
app.use(morgan('dev'));
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// custom middlewares
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.danger = req.flash('danger');
  res.locals.warning = req.flash('warning');
  res.locals.error = req.flash('error');
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex');
  next();
});
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", 'events.mapbox.com', 'api.mapbox.com', 'a.tiles.mapbox.com', 'b.tiles.mapbox.com'],
      scriptSrc: ["'self'", 'unsafe-inline', 'api.mapbox.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'res.cloudinary.com', 'images.unsplash.com', 'w3.org'],
      styleSrc: ["'self'", 'api.mapbox.com', (req, res) => `'nonce-${res.locals.cspNonce}'`],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      fontSrc: ["'self'", 'data:', 'api.mapbox.com', 'api.tiles.mapbox.com'],
    },
  })
);

// root route
app.use('/', rootRouter);

// campgrounds route
app.use('/campgrounds', campgroundsRouter);

// camp rewviews route
app.use('/campReviews', campReviewsRouter);

// camp rewviews route
app.use('/', usersRouter);

// page not found view
app.all('*', (req, res) => {
  throw new AppError('Page Not Found', 404, '404');
});

// post-middleware for handling errors
app.use((err, req, res, next) => {
  loadGenericErrorPage(res, err);
});

// listen to port
app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
