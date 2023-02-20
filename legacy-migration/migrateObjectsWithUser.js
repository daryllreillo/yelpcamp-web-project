import mongoose from 'mongoose';
import { Campground, Location, CampReview } from '../models/models.js';

// mongoose setup
async function main() {
  await mongoose.connect('mongodb://localhost:27017/yelpcamptest');
  console.log('mongoose connection started.');
}
main().catch(err => console.log(err));

console.log('migration start');
// const allCampgrounds = await Campground.find({});
// const allLocations = await Location.find({});
// const allCampReviews = await CampReview.find({});

async function updateUserStrToAdmin(dbArray, Model) {
  await dbArray.forEach(async el => {
    if (!el.user) {
      el.user = 'admin';
      const obj = new Model(el);
      await el.save();
    }
  });
}
// console.log(allCampReviews.filter(el => el.text === ''));

// await updateUserStrToAdmin(allCampgrounds, Campground);
// console.log(allCampgrounds.filter(el => el.user == undefined));

// await updateUserStrToAdmin(allLocations, Location);
// console.log(allLocations.filter(el => el.user == 'admin'));

// await updateUserStrToAdmin(allCampReviews, CampReview);
// console.log(allCampReviews.filter(el => el.user == 'admin'));

// await mongoose.connection.close();
console.log('migration of this table done');
