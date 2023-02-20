'use strict';
// imports
import express from 'express';
import multer from 'multer';
import { catchAsync } from '../error-validations/generic-functions.js';
import { requireLogin, validateUser, validateCampground } from '../middlewares.js';
import { campgroundControl } from '../controllers/campgroundsControl.js';
import { storage } from '../cloudinary/uploadSetup.js';

// constants
const upload = multer({ storage });
const campgroundsRouter = express.Router();

// pre-middlewares

// read routes
campgroundsRouter.route('/').get(campgroundControl.root);
campgroundsRouter.route('/all').get(catchAsync(campgroundControl.showAll));
campgroundsRouter.route('/multi').get(catchAsync(campgroundControl.showMultis));
campgroundsRouter.route('/:campId/view').get(catchAsync(campgroundControl.displayCampground));
campgroundsRouter.route('/:loc/location').get(catchAsync(campgroundControl.showCampOnLocation));

// create routes
campgroundsRouter
  .route('/post')
  .get(requireLogin, campgroundControl.renderPostNewCamp)
  .post(requireLogin, validateUser, upload.array('images'), validateCampground, catchAsync(campgroundControl.postNewCamp));

// update routes
campgroundsRouter
  .route('/:campId/edit')
  .get(requireLogin, validateUser, catchAsync(campgroundControl.renderEditCamp))
  .post(requireLogin, validateUser, upload.array('images'), validateCampground, catchAsync(campgroundControl.editCamp));

//delete routes
campgroundsRouter
  .route('/:campId/delete')
  .get(requireLogin, validateUser, catchAsync(campgroundControl.renderDeleteCamp))
  .delete(requireLogin, validateUser, catchAsync(campgroundControl.deleteCamp));

campgroundsRouter
  .route('/:campId/images/:imageId/delete')
  .get(requireLogin, validateUser, catchAsync(campgroundControl.renderDeleteCamp))
  .delete(requireLogin, validateUser, catchAsync(campgroundControl.deleteImage));

export { campgroundsRouter };
