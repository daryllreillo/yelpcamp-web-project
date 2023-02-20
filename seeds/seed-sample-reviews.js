import mongoose from 'mongoose';
import { Campground, Location, CampReview, User } from '../models/models.js';
import axios from 'axios';

// mongoose setup
async function main() {
  await mongoose.connect('mongodb://localhost:27017/yelpcamptest');
  console.log('mongoose connection started.');
}
main().catch(err => console.log(err));
console.log('seed process started');

async function seedDB() {
  //
  const review = new CampReview({
    user: 'pig',
    // owners: ['63be7c0b73a456d5afe5bb3f', '63be6491f2ba8f38a9b51875'],
    rating: 5,
    message: 'what the fox say',
    postTimeStamp: new Date(),
    campground: '63ae9e7aa0e1a0aca2059b7e',
  });
  await review.save();
  console.log('Saved');
}

await seedDB().then(() => {
  console.log('mongoose connection closing...');
  mongoose.connection.close();
});
