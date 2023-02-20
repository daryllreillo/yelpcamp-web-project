'use strict';
/* This is the controller file for the camp reviews router */
import { Campground, CampReview, Location, Image, Geometry } from '../models/models.js';
import { AppError } from '../error-validations/error-class.js';
import { sortAccdgToTitle, simplifyTimeStamp, isDocOwner } from '../error-validations/generic-functions.js';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { cloudinary } from '../cloudinary/uploadSetup.js';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

const campgroundControl = {};
campgroundControl.root = (req, res) => {
  res.render('campground/campgrounds-main.ejs', { pageTitle: 'Campgrounds' });
};

campgroundControl.showAll = async (req, res) => {
  const pageTitle = 'All posted campgrounds';
  const campgroundsList = await findAllCampgrounds();
  res.render('campground/campgrounds-list.ejs', { pageTitle, campgroundsList });
};

campgroundControl.showMultis = async (req, res) => {
  const pageTitle = 'Locations with Multi-Campgrounds';
  const campgroundsList = await Campground.find({}).populate({ path: 'location', populate: 'geometry' });
  const multiList = await findMultiCampgroundsFromDb(campgroundsList, 2);
  res.render('campground/campgrounds-multi-view.ejs', { pageTitle, multiList });
};

campgroundControl.displayCampground = async (req, res) => {
  const { campId } = req.params;
  let currUser = req.session.passport?.user;
  let campground, reviews;
  try {
    campground = await Campground.findOne({ _id: campId })
      .populate({ path: 'location', populate: 'geometry' })
      .populate('user')
      .populate('owners')
      .populate('postedBy')
      .populate('images');
    if (!campground) {
      req.flash('danger', 'Campground not existing.');
      return res.redirect('/campgrounds/all');
    }
    if (campground.editTimeStamp) {
      campground.editTimeStampSimple = simplifyTimeStamp(campground.editTimeStamp);
      campground.editTimeAgo = timeAgo.format(campground.editTimeStamp);
    }
    campground.postTimeStampSimple = simplifyTimeStamp(campground.postTimeStamp);
    campground.postTimeAgo = timeAgo.format(campground.postTimeStamp);
    campground.isOwner = isDocOwner(currUser, campground);
  } catch (err) {
    throw new AppError('Campground not existing', 500, err);
  }
  try {
    reviews = await CampReview.find({ campground: campId }).populate('user').populate('owners');
  } catch (err) {
    throw new AppError('Camp Reviews retrieval error', 500, 'Camp Reviews Error');
  }
  if (reviews.length !== 0) {
    for (let i = 0; i < reviews.length; i++) {
      reviews[i].postTimeStampSimple = simplifyTimeStamp(reviews[i].postTimeStamp);
      reviews[i].postTimeAgo = timeAgo.format(reviews[i].postTimeStamp);
      if (reviews[i].editTimeStamp) {
        reviews[i].editTimeStampSimple = simplifyTimeStamp(reviews[i].editTimeStamp);
        reviews[i].editTimeAgo = timeAgo.format(reviews[i].editTimeStamp);
      }
      reviews[i].isOwner = isDocOwner(currUser, reviews[i]);
    }
  }
  res.render('campground/campground-view.ejs', { pageTitle: campground.title, campground, reviews, currUser });
};

campgroundControl.showCampOnLocation = async (req, res) => {
  const { loc } = req.params;
  const pageTitle = 'Location: ' + loc;
  const location = await Location.findOne({ name: loc });
  const campgroundsList = sortAccdgToTitle(await Campground.find({ location }).populate('images').populate({ path: 'location', populate: 'geometry' }));
  res.render('campground/campgrounds-list.ejs', { pageTitle, campgroundsList });
};

campgroundControl.renderPostNewCamp = (req, res) => {
  const pageTitle = 'Post a new Campground';
  res.render('campground/campground-post.ejs', { pageTitle });
};

campgroundControl.postNewCamp = async (req, res) => {
  req.body.postTimeStamp = new Date();
  const newCampground = new Campground(req.body);
  const id = newCampground._id;
  await newCampground.save();
  req.flash('success', 'Campground posted!');
  res.redirect(`/campgrounds/${id}/view`);
};

campgroundControl.renderEditCamp = async (req, res) => {
  const pageTitle = 'Edit Campground';
  const { campId } = req.params;
  let campground;
  // campground = await Campground.findById(id);
  try {
    campground = await Campground.findById(campId).populate({ path: 'location', populate: 'geometry' }).populate('images');
    if (!campground) {
      req.flash('danger', 'Campground not existing.');
      return res.redirect('/campgrounds/all');
    }
  } catch (err) {
    throw new AppError(err, 500, 'Campground not existing');
  }
  // req.flash('warning', 'Updates once posted are final.');
  res.render('campground/campground-edit.ejs', { pageTitle, campground });
};

campgroundControl.editCamp = async (req, res) => {
  const { campId } = req.params;
  req.body.editTimeStamp = new Date();
  await Campground.findOneAndUpdate({ _id: campId }, req.body);
  req.flash('success', 'Campground updated!');
  res.redirect(`/campgrounds/${campId}/view`);
};
campgroundControl.renderDeleteCamp = async (req, res) => {
  const { campId } = req.params;
  res.redirect(`/campgrounds/${campId}/edit`);
};

campgroundControl.deleteCamp = async (req, res) => {
  const { campId } = req.params;
  await Campground.findOneAndDelete({ _id: campId });
  req.flash('danger', 'Campground deleted!');
  res.redirect(`/campgrounds/`);
};

campgroundControl.deleteImage = async (req, res) => {
  const { campId, imageId } = req.params;
  const camp = await Campground.findById(campId).populate('images');
  if (camp.images.length <= 1) throw new AppError('Not Allowed', 400, 'Final image not allowed to be deleted');
  const imageToDelete = camp?.images.filter(image => image.id == imageId)[0];
  console.log(imageToDelete);
  // console.log(imageToDelete);
  await Campground.findByIdAndUpdate(campId, { $pull: { images: imageToDelete } });
  await cloudinary.uploader.destroy(imageToDelete.name);
  // cloudinary.search
  //   .sort_by('public_id')
  //   .execute()
  //   .then(result => console.log(result));
  req.flash('danger', 'Image deleted');
  res.redirect(`/campgrounds/${campId}/edit`);
};

// function to return all campgrounds in database
async function findAllCampgrounds() {
  const allCamps = await Campground.find({}, '-__v').populate('images').populate({ path: 'location', populate: 'geometry' });
  // sort according to country >> region >> place >> camp title
  return allCamps
    .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
    .sort((a, b) => a.location.name.split(', ').reverse().join(' ').localeCompare(b.location.name.split(', ').reverse().join(' ')));
}

async function findMultiCampgroundsFromDb(campgroundsList, minCount = 2) {
  // create a frequency list: { location: location.name, count: frequencyCount }
  const freqList = [];
  campgroundsList.forEach(el => {
    if (freqList.some(freqItem => freqItem.location === el.location.name)) {
      freqList[freqList.findIndex(freqItem => freqItem.location === el.location.name)].count++;
    } else {
      freqList.push({ location: el.location.name, count: 1 });
    }
  });
  // filter the output array where frequency count >= minimum count
  const multiList = freqList.filter(el => el.count >= minCount);
  // expected output array element: { location: locationName, count: frequencyCount }
  let output = [];
  for (let i = 0; i < multiList.length; i++) {
    let loc = {};
    try {
      loc = await Location.findOne({ name: multiList[i].location });
    } catch (e) {
      throw new AppError('Database retrieval issue', 500, 'DB Error');
    }
    output.push({ location: `${loc.name}`, count: multiList[i].count });
  }
  // sort by country >> region >> place
  let sortedOutput = output.sort((a, b) => a.location.split(', ').reverse().join(' ').localeCompare(b.location.split(', ').reverse().join(' ')));
  // return the sorted output
  return sortedOutput;
}

export { campgroundControl };
