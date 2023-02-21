import Joi from 'joi';
import { User, Campground, CampReview, Location, Geometry, Image } from './models/models.js';
import { AppError } from './error-validations/error-class.js';
import { sanitizeObj, trimStringsOfObj, removeEmoji, catchAsync } from './error-validations/generic-functions.js';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
import mapboxgl from 'mapbox-gl'; // this is needed in the script tags. DO NOT REMOVE!!
import sanitizeHtml from 'sanitize-html';

const geocoder = Geocoding({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });

const campgroundSchema = Joi.object({
  user: Joi.object().required(),
  title: Joi.string().max(90).required(),
  price: Joi.number().positive().precision(2),
  description: Joi.string().max(500).min(0),
  location: Joi.object().required(),
  // imageLink: Joi.string()
  //   .pattern(/https?:.+/)
  //   .required(),
  images: Joi.array().required(),
  postTimeStamp: Joi.date(),
  editTimeStamp: Joi.date(),
  owners: Joi.array().required(),
  postedBy: Joi.object().required(),
}).required();

const campReviewSchema = Joi.object({
  user: Joi.object().required(),
  rating: Joi.number().positive().precision(0).required(),
  message: Joi.string().required(),
  campground: Joi.object().required(),
  postTimeStamp: Joi.date(),
  editTimeStamp: Joi.date(),
  owners: Joi.array().required(),
  postedBy: Joi.object().required(),
}).required();

const requireLogin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('warning', 'Please log in to do that');
    res.redirect('/login');
  } else {
    next();
  }
};

const getPageBeforeLogin = (req, res, next) => {
  if (!req.session.returnTo) {
    let refererIndex = req.rawHeaders.findIndex(el => el == 'Referer');
    if (refererIndex !== -1) req.session.prevPage = req.rawHeaders[refererIndex + 1].replace(/https?:\/\/localhost:1027(.+)/, '$1');
  }
  next();
};

const validateUser = catchAsync(async (req, res, next) => {
  let { campId, campReviewId } = sanitizeObj(req.params);
  const userStr = req.session.passport?.user;
  let userError = null;
  let campOwnerError, campReviewOwnerError;
  try {
    campOwnerError = await checkIfInvalidUser(userStr, Campground, campId);
  } catch (err) {
    throw new AppError(err, 400, 'Campground ID not found');
  }
  try {
    campReviewOwnerError = await checkIfInvalidUser(userStr, CampReview, campReviewId);
  } catch (err) {
    throw new AppError(err, 400, 'Camp Review ID not found');
  }
  if ((userError = campOwnerError || campReviewOwnerError)) {
    // redirect to to a return path if a user Error is found
    let returnTo = '';
    if (campId) {
      returnTo = `/campgrounds/${campId}/view`;
    } else if (campReviewId) {
      try {
        let review = await CampReview.findById(campReviewId).populate('campground');
        returnTo = `/campgrounds/${review.campground.id}/view`;
      } catch (err) {
        throw new AppError('Url findpath error', 400, err);
      }
    } else returnTo = '/';
    req.flash('danger', userError.message);
    res.redirect(returnTo);
  } else {
    next();
  }

  // return an error if user id is not one of owners of the document
  async function checkIfInvalidUser(userStr, Model, modelId) {
    if (!modelId) return false;
    const model = await Model.findById(modelId).populate('owners');
    const user = await User.findOne({ username: userStr });
    if (!user) return new AppError('User not existing', 400, 'Invalid user');
    //populate owners ID array
    let ownersIdArr = [];
    model.owners.forEach(owner => ownersIdArr.push(owner.id));
    // check if user is listed as an owner
    if (!ownersIdArr.includes(user.id)) {
      console.log('owners:', ownersIdArr, ' | user: ', user.id);
      return new AppError('Sorry, you are not the document owner.', 400, 'Invalid user');
    }
    return false;
  }
});

// validates Campground Review from req.body
const validateCampReview = catchAsync(async (req, res, next) => {
  let { campId, campReviewId } = sanitizeObj(req.params);
  let campReview = sanitizeObj(trimStringsOfObj(req.body));
  // populate user details from session
  campReview.user = await User.findOne({ username: req.session.passport?.user });
  const admin = await User.findOne({ username: 'admin' });

  if (campReviewId) {
    // if campReview already in DB i.e. campReview edit route
    // get campId with populated campground details
    try {
      // find campId and get read-only details from DB
      const campReviewDB = await CampReview.findById(campReviewId).populate('campground');
      campId = campReviewDB.campground.id;
      campReview.postedBy = campReviewDB.postedBy;
      campReview.owners = campReviewDB.owners;
    } catch (err) {
      throw new AppError('Camp Review Validation Error', 400, err);
    }
  } else {
    // populate owners array property
    if (campReview.user.username !== 'admin') {
      campReview.owners = [campReview.user, admin];
    } else {
      campReview.owners = [admin];
    }
    // populate postedBy
    campReview.postedBy = campReview.user;
  }

  // populate campground details
  try {
    campReview.campground = await Campground.findById(campId);
  } catch (err) {
    throw new AppError('DB Error', 400, err);
  }

  // validate campReview
  const validation = campReviewSchema.validate(campReview);
  req.body = campReview;
  if (validation.error) {
    console.log(validation.error);
    throw new AppError('Camp Review Validation Error', 400, validation.error.message);
  } else {
    next();
  }
});

// validates Campground from req.body
const validateCampground = catchAsync(async (req, res, next) => {
  const campgroundObj = sanitizeObj(trimStringsOfObj(req.body));
  let { campId } = sanitizeObj(req.params);
  //  populate user details from session
  campgroundObj.user = await User.findOne({ username: req.session.passport?.user });
  const admin = await User.findOne({ username: 'admin' });

  if (campId) {
    // if campground is not new. i.e. edit route or delete route
    // populate read-only data
    const campgroundDB = await Campground.findById(campId).populate('images');
    campgroundObj.owners = campgroundDB.owners;
    campgroundObj.postedBy = campgroundDB.postedBy;
    campgroundObj.images = campgroundDB.images;
    // push each image file to campground.images
    req.files?.forEach(async file => {
      const image = new Image({ url: file.path, name: file.filename });
      await image.save();
      campgroundObj.images.push(image);
    });
    // console.log(campgroundObj);
    // req.files
    //   .map(file => {
    //     return { url: file.path, name: file.filename };
    //   })
    //   .forEach(file => campgroundObj.images.push(file));
  } else {
    // campground is new and no campId is found. i.e. create route
    // push each image file to campground.images
    campgroundObj.images = [];
    req.files?.forEach(async file => {
      const image = new Image({ url: file.path, name: file.filename });
      await image.save();
      campgroundObj.images.push(image);
    });
    // populate owners array property
    if (campgroundObj.user.username !== 'admin') {
      campgroundObj.owners = [campgroundObj.user, admin];
    } else {
      campgroundObj.owners = [admin];
    }
    // populate postedBy
    campgroundObj.postedBy = campgroundObj.user;
  }
  // populate location details
  try {
    campgroundObj.location = await getCampLocation(campgroundObj.location);
  } catch (err) {
    throw new AppError('Location1 Validation Error', 400, err);
  }

  const validation = campgroundSchema.validate(campgroundObj);
  req.body = campgroundObj;
  if (validation.error) {
    console.log(validation.error);
    throw new AppError('Campground Validation Error', 400, validation.error.message);
  } else {
    next();
  }
});

async function getCampLocation(str) {
  // validate location format
  let queryStr = removeEmoji(sanitizeHtml(str)).trim().toLowerCase();
  // check in DB if same geocoding query has been used before
  let location = await Location.findOne({ geoQueries: queryStr });
  if (!location) {
    // if location not found in db using the query string, use geoCoding API
    const geoData = await geocoder.forwardGeocode({ query: queryStr, limit: 5 }).send();
    // console.log('geoData.body ==>', geoData.body);
    // priority place_type must be 'place' or 'region'
    let regionPlaceIndex = geoData.body.features.findIndex(mapPoint => mapPoint.place_type.includes('place') || mapPoint.place_type.includes('region'));
    // if priority place_type not found, the first hit of the query result is selected
    if (regionPlaceIndex === -1) regionPlaceIndex = 0;
    let locName = geoData.body.features[regionPlaceIndex].text;
    geoData.body.features[regionPlaceIndex].context?.forEach(context => {
      if (!/postcode\..+/.test(context.id)) locName += `, ${context.text}`;
    });

    // console.log('location name posted in DB: ==>', locName);
    // check if duplicate location is found from DB
    location = await Location.findOne({ name: locName });
    // if duplicate location, push the query string to the location doc
    location?.geoQueries.push(queryStr);
    // if no duplicate, create new location data
    if (!location) {
      const geometry = new Geometry(geoData.body.features[0].geometry);
      await geometry.save();
      location = new Location({ name: locName, geometry, geoQueries: [queryStr] });
    }
    // console.log('Location saved in DB ==> ', location.name, ' | geoCoding query string ==> ', queryStr);
    // save changes
    await location.save();
  } else {
    // console.log('Location found in DB ==> ', location.name);
  }
  // if found, return location data directly from DB
  return location;
}

export { requireLogin, validateUser, validateCampground, validateCampReview, getPageBeforeLogin };
