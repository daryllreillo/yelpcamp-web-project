'use strict';

// imports
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import { cloudinary } from '../cloudinary/uploadSetup.js';

// mongodb connection
async function main() {
  const mongoDbUrl = process.env.DB_URL;
  await mongoose.connect(mongoDbUrl); // local mongoDB: 'mongodb://localhost:27017/yelpcamptest'
  console.log('mongodb connection started.');
}
mongoose.set('strictQuery', false);
main().catch(err => console.log(err));

// constants
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const geometrySchema = new Schema({
  type: { type: String, enum: ['Point'] },
  coordinates: Array,
});
const Geometry = mongoose.model('Geometry', geometrySchema);

const countrySchema = new Schema({
  name: { type: String, required: true },
  ISO: String,
});
const Country = mongoose.model('Country', countrySchema);

const locationSchema = new Schema({
  name: { type: String, required: true },
  geometry: { type: ObjectId, ref: 'Geometry' },
  geoQueries: [String],
});
const Location = mongoose.model('Location', locationSchema);

const imageSchema = new Schema({ url: String, name: String });
imageSchema.virtual('thumbNail').get(function () {
  if (/https:\/\/res\.cloudinary\.com.*/.test(this.url)) {
    return this.url.replace('/upload', '/upload/w_400,c_scale');
  } else if (/https:\/\/images\.unsplash\.com.*/.test(this.url)) {
    return this.url.replace('&w=1080', '&w=400');
  } else return this.url;
});
imageSchema.virtual('carousel').get(function () {
  if (/https:\/\/res\.cloudinary\.com.*/.test(this.url)) {
    return this.url.replace('/upload', '/upload/w_640');
  } else if (/https:\/\/images\.unsplash\.com.*/.test(this.url)) {
    return this.url;
  } else return this.url;
});
const Image = mongoose.model('Image', imageSchema);

// setting the virtuals to JSON transfer as true
const opts = { toJSON: { virtuals: true } };
const campgroundSchema = new Schema(
  {
    postedBy: { type: ObjectId, ref: 'User' },
    user: { type: ObjectId, ref: 'User' }, // aka lastEditBy
    owners: [{ type: ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    price: Number,
    description: String,
    // 1:few relationship for Campground:Location
    location: { type: ObjectId, ref: 'Location', required: [true, 'Please enter a valid location with format: City, State'] },
    images: [{ type: ObjectId, ref: 'Image' }],
    postTimeStamp: { type: Date, required: true },
    editTimeStamp: { type: Date },
  },
  // optional schema settings here
  opts
);

// setting virtual properties
campgroundSchema.virtual('properties').get(function () {
  return {
    title: this.title,
    location: { name: this.location.name },
    id: this.id,
    // the popupMarkup doesn't translate well when transferred to client side
    // popupMarkup: `<a href="/campgrounds/${this.id}/view"> ${this.title} </a>`,
  };
});
campgroundSchema.virtual('geometry').get(function () {
  return { type: 'Point', coordinates: this.location.geometry.coordinates };
});

// post-middleware to delete related camp reviews when campgrounds are deleted
campgroundSchema.post('findOneAndDelete', async (doc, next) => {
  console.log('post findOneAndDelete mongoose hook ==>');
  let campReviewsArr = await CampReview.find({ campground: doc._id });
  campReviewsArr = campReviewsArr.map(campReview => {
    return campReview.id;
  });
  await CampReview.deleteMany({ _id: { $in: campReviewsArr } });
  const imgsArr = doc?.images;
  imgsArr.forEach(async imgsEl => {
    const image = await Image.findOne(imgsEl);
    if (/https:\/\/res\.cloudinary\.com.*/.test(image.url)) {
      await cloudinary.uploader.destroy(image.name);
    }
  });
  // const campUsingLoc = await Campground.findOne({ location: doc?.location });
  // if (!campUsingLoc) {
  //   await Location.findByIdAndDelete(doc?.location._id);
  // }
  console.log('post findOneAndDelete mongoose hook ==>');
  next();
});
// middleware to delete location if no other camp is using it
campgroundSchema.pre('findOneAndUpdate', async (doc, next) => {
  // // console.log('==================== findOneAndUpdate post hook ====================');
  // // console.log(doc);
  // const campUsingLoc = await Campground.findOne({ location: doc?.location });
  // // console.log(campUsingLoc);
  // if (!campUsingLoc) {
  //   await Location.findByIdAndDelete(doc?.location._id);
  // }
  next();
});
const Campground = mongoose.model('Campground', campgroundSchema);

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);

const campReviewSchema = new Schema({
  user: { type: ObjectId, ref: 'User' }, // aka lastEditBy
  owners: [{ type: ObjectId, ref: 'User' }],
  postedBy: { type: ObjectId, ref: 'User' },
  rating: { type: Number, required: [true, 'Please include a rating.'] },
  message: { type: String, required: false },
  postTimeStamp: { type: Date, required: true },
  editTimeStamp: { type: Date },
  // 1:many relationship for Campground:CampReview
  campground: { type: ObjectId, ref: 'Campground', index: true },
});
const CampReview = mongoose.model('CampReview', campReviewSchema);

export { Campground, Location, CampReview, User, Image, Geometry, Country };
