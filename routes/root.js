import express from 'express';

const rootRouter = express.Router();

rootRouter.route('/').get((req, res) => {
  res.render('home.ejs', { pageTitle: 'Welcome to YelpCamp' });
});

export { rootRouter };
