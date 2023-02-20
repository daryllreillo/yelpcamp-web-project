/* This is the routers file for camp review */
import express from 'express';
import { catchAsync } from '../error-validations/generic-functions.js';
import { requireLogin, validateUser, validateCampReview } from '../middlewares.js';
import { campReviewControl } from '../controllers/campReviewControl.js';

// constants
const campReviewsRouter = express.Router({ mergeParams: false });

// pre-middlewares

// create camp review routes
campReviewsRouter
  .route('/:campId/post')
  .get(requireLogin, catchAsync(campReviewControl.redirectToCampView2))
  .post(requireLogin, validateCampReview, catchAsync(campReviewControl.createNewCampReview));

// update camp review routes
campReviewsRouter
  .route('/:campReviewId/edit')
  .get(requireLogin, validateUser, catchAsync(campReviewControl.renderEditCampReview))
  .post(requireLogin, validateUser, validateCampReview, catchAsync(campReviewControl.editCampReview));

// delete camp review routes
campReviewsRouter
  .route('/:campReviewId/delete')
  .get(requireLogin, validateUser, catchAsync(campReviewControl.redirectToCampView))
  .delete(requireLogin, validateUser, catchAsync(campReviewControl.deleteCampReview));

export { campReviewsRouter };
