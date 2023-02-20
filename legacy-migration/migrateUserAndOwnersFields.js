import e from 'connect-flash';
import mongoose from 'mongoose';
import { Campground, Location, CampReview, User } from '../models/models.js';

// mongoose setup
async function main() {
  await mongoose.connect('mongodb://localhost:27017/yelpcamptest');
  console.log('mongoose connection started.');
}
main().catch(err => console.log(err));

console.log('migration start');

// add tempUser to model definition before executing
async function updateUserField(Model, userValue) {
  const allDbObjects = await Model.find({});
  allDbObjects.forEach(async el => {
    if (el.user !== 'admin') {
      // const foundUser = await User.findOne({ username: el.user });
      // el.tempUser = foundUser.id;
      el.tempUser = userValue;
    } else {
      el.tempUser = userValue;
    }
    await el.save();
  });
}
// next function to call after above.
// please remove tempUser in model definition after executing
async function updateUserFieldNext(Model) {
  const allDbObjects = await Model.find();
  allDbObjects.forEach(async el => {
    el.user = el.tempUser;
    const jsObj = el.toObject();
    delete jsObj.tempUser;
    await Model.deleteOne({ _id: el._id });
    el = new Model(jsObj);
    await el.save();
  });
}

async function updateOwnersField(Model, userValueArr) {
  const allDbObjects = await Model.find();
  let userArr = [];
  userValueArr.forEach(async userValue => {
    const user = await User.findById(userValue);
    userArr.push(user);
    console.log(userArr);

    allDbObjects.forEach(async el => {
      el.owners = userArr;
      let newReview = el.toObject();
      delete newReview.__v;
      await CampReview.deleteOne({ _id: el._id });
      el = new Model(newReview);
      console.log(el);
      await el.save();
    });
  });
}

async function initPostedBy(Model, userValue) {
  const allDbObj = await Model.find({});
  const user = await User.findOne({ username: userValue });
  // console.log(allDbObj);
  // console.log(user);
  allDbObj.forEach(doc => {
    doc.postedBy = user;
    doc.save();
  });
}
await initPostedBy(Campground, 'admin');
await initPostedBy(CampReview, 'admin');

// run update for locations
// await updateUserField(Location, '63be7c0b73a456d5afe5bb3f');
// await updateUserFieldNext(Location);

// checking locations
// const allLocations = await Location.find({}).populate('user');
// console.log(allLocations.filter(el => el.user.id === '63be7c0b73a456d5afe5bb3f'));
// console.log(allLocations.length, 'total locations');

// run update for campgrounds
// await updateUserField(Campground, '63be7c0b73a456d5afe5bb3f');
// await updateUserFieldNext(Campground);

// checking campgrounds
// const allCampgrounds = await Campground.find({}).populate('user');
// console.log(allCampgrounds.filter(el => el.user.id === '63be7c0b73a456d5afe5bb3f').length);
// console.log(allCampgrounds.length, 'total Campgrounds');

// // run update for campreviews
// await updateUserField(CampReview, '63be7c0b73a456d5afe5bb3f');
// await updateUserFieldNext(CampReview);

// checking campreviews
// const allCampReviews = await CampReview.find({});
// const adminCampReviews = await CampReview.find({ user: '63be6491f2ba8f38a9b51875' });
// const nonAdminCampReviews = await CampReview.find({ user: { $ne: '63be6491f2ba8f38a9b51875' } });
// console.log(allCampReviews);
// console.log('camp reviews count ==>', allCampReviews.length);
// console.log('admin camp reviews count ==>', adminCampReviews.length);
// console.log('non-admin camp reviews count ==>', nonAdminCampReviews.length);

// // run owners field update for locations
// await updateOwnersField(Location, ['63be7c0b73a456d5afe5bb3f', '63bfc863e75bc9c587b288df']);
// // check owners field for locations
// const allLocations = await Location.find({});
// allLocations.forEach(async location => {
//   const loc = await Location.findById(location._id).populate('owners').populate('user');
//   console.log(loc);
// });
// console.log(allLocations.length, '<== all locations count');

// // run owners field update for campgrounds
// await updateOwnersField(Campground, ['63be7c0b73a456d5afe5bb3f', '63bfc863e75bc9c587b288df']);
// // check owners field for locations
// const allCampgrounds = await Campground.find({});
// allCampgrounds.forEach(async campground => {
//   const camp = await Campground.findById(campground._id).populate('owners').populate('user');
//   console.log(camp);
// });
// console.log(allCampgrounds.length, '<== all campgrounds count');

// run owners field update for camp reviews
// await updateOwnersField(CampReview, ['63be7c0b73a456d5afe5bb3f', '63bfc863e75bc9c587b288df']);
// check owners field for locations
// const allCampReviews = await CampReview.find({});
// allCampReviews.forEach(async campReview => {
//   const review = await CampReview.findById(campReview._id).populate('owners').populate('user');
//   console.log(review);
// });
// console.log(allCampReviews.length, '<== all locations count');

console.log('migration of this table: DONE ');
