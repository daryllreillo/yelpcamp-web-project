'use strict';
/* This is the controller file for the camp reviews router */
import { CampReview, Location } from '../models/models.js';
import { AppError } from '../error-validations/error-class.js';

const campReviewControl = {};

campReviewControl.createNewCampReview = async (req, res) => {
  const { campId } = req.params;
  req.body.postTimeStamp = new Date();
  const newCampReview = new CampReview(req.body);
  newCampReview.save();
  req.flash('success', 'Review posted!');
  res.redirect(`/campgrounds/${campId}/view`);
};

campReviewControl.renderEditCampReview = async (req, res) => {
  const pageTitle = 'Edit Camp Review';
  const { campReviewId } = req.params;
  let campReview, location;
  try {
    campReview = await CampReview.findById(campReviewId).populate({ path: 'campground', populate: 'images' });
    location = await Location.findById(campReview.campground.location);
  } catch (err) {
    throw new AppError(`Camp Review ${campReviewId} not existing`, 500, 'Camp Review ID Error');
  }
  // req.flash('warning', 'Updates once saved are final.');
  res.render('campReview/campreview-edit.ejs', { pageTitle, campReview, location });
};

campReviewControl.editCampReview = async (req, res) => {
  const { campReviewId } = req.params;
  req.body.editTimeStamp = new Date();
  try {
    await CampReview.findByIdAndUpdate(campReviewId, req.body);
  } catch (err) {
    throw new AppError('Cannot post Review', 500, err);
  }
  req.flash('success', 'Review updated!');
  res.redirect(`/campgrounds/${req.body.campground.id}/view`);
};

campReviewControl.redirectToCampView = async (req, res) => {
  const { campReviewId } = req.params;
  let campId, campReview;
  try {
    campReview = await CampReview.findById(campReviewId).populate('campground');
    campId = campReview.campground.id;
  } catch (err) {
    throw new AppError('Cannot delete Review', 500, err);
  }
  res.redirect(`/campgrounds/${campId}/view`);
};

campReviewControl.redirectToCampView2 = async (req, res) => {
  // points to campgrounds view page to post a new review
  const { campId } = req.params;
  res.redirect(`/campgrounds/${campId}/view`);
};

campReviewControl.deleteCampReview = async (req, res) => {
  const { campReviewId } = req.params;
  let campId, campReview;
  try {
    campReview = await CampReview.findById(campReviewId).populate('campground');
    campId = campReview.campground.id;
    await CampReview.findByIdAndDelete(campReviewId);
  } catch (err) {
    throw new AppError('Cannot delete Review', 500, err);
  }
  req.flash('danger', 'Review deleted!');
  res.redirect(`/campgrounds/${campId}/view`);
};

export { campReviewControl };
