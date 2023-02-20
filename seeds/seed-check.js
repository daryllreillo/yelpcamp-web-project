import mongoose from 'mongoose';
import { Campground, Location, CampReview, User, Geometry, Image } from '../models/models.js';

async function modelCount(Model) {
  const allModels = await Model.find({});
  const count = allModels.reduce((a, b) => {
    return a + 1;
  }, 0);
  console.log(Model, ': ', count);
}

async function seedCheck() {
  await modelCount(Campground);
  await modelCount(Location);
  await modelCount(CampReview);
  await modelCount(User);
  await modelCount(Geometry);
  await modelCount(Image);
}

async function deleteAll() {
  await Campground.deleteMany({});
  await Location.deleteMany({});
  await CampReview.deleteMany({});
  await Geometry.deleteMany({});
  await Image.deleteMany({});
  console.log('DELETED ALL in DB except users');
}

await seedCheck();
// // only use this if you want to delete
// await deleteAll();

console.log('mongoose connection closing...');
await mongoose.connection.close();
