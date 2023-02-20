import mongoose from 'mongoose';
import { Campground, Location, CampReview, User, Geometry, Image, Country } from '../models/models.js';
import { cities } from './cities.js';
import { otherLocations } from './otherLocations.js';
import { places, descriptors } from './seed-helpers.js';
import axios from 'axios';

console.log('API retrieval started...');
async function seedDB() {
  console.log('seed process started');
  await Location.deleteMany({});
  await Geometry.deleteMany({});
  const locationArr = [];
  // US locations
  let USLocations = cities.splice(2, 69); // need only 69 entries
  USLocations.forEach(async el => {
    const newGeometry = new Geometry({ type: 'Point', coordinates: [el.longitude, el.latitude] });
    await newGeometry.save();
    const location = new Location({
      name: `${el.city}, ${el.state}, United States`,
      geometry: newGeometry,
      geoQueries: [`${el.city}, ${el.state}, United States`.toLowerCase()],
    });
    await location.save();
    locationArr.push(location);
  });
  otherLocations
    .filter(el => el.country !== 'US')
    .forEach(async el => {
      const newGeometry = new Geometry({ type: 'Point', coordinates: [el.longitude, el.latitude] });
      await newGeometry.save();
      const locCountryName = await Country.findOne({ ISO: el.country });
      const location = new Location({
        name: `${el.name}, ${locCountryName.name}`,
        geometry: newGeometry,
        geoQueries: [`${el.name}, ${locCountryName.name}`.toLowerCase()],
      });
      await location.save();
      locationArr.push(location);
    });

  // store data from unsplash API
  const campCount = 224;
  const links = [];
  const linksDesc = [];
  let unsplashJSON = {};
  for (let i = 1; i <= campCount - 1; i += 30) {
    unsplashJSON = await axios.get(
      `https://api.unsplash.com/collections/1319040/photos?page=${i}&per_page=30&client_id=TDfAVw41VTYheY2m2kgNcdCrc_WedqFC61hHwk-oPlc`
    );
    console.log('unsplash API page data length retrieved:', unsplashJSON.data.length);
    for (let j = 1; j <= 30; j++) {
      if (unsplashJSON.data[j]) {
        links.push(unsplashJSON.data[j].urls.regular);
        linksDesc.push(unsplashJSON.data[j].description);
      }
    }
    // console.log(unsplashJSON.data[2]);
    unsplashJSON = {};
  }
  console.log('API retrieval ended');
  console.log('API links array length:', links.length);
  console.log('API descriptions array length:', linksDesc.length);
  // delete all campgrounds
  await Campground.deleteMany({});
  await Image.deleteMany({});
  await CampReview.deleteMany({});
  // create data pseudo-randomly
  const adminUser = await User.findOne({ username: 'admin' });
  for (let i = 1; i <= campCount; i++) {
    const locatNum = Math.floor(Math.random() * locationArr.length);
    const descrNum = Math.floor(Math.random() * descriptors.length);
    const placeNum = Math.floor(Math.random() * places.length);
    // const imgNum = Math.floor(Math.random() * unsplashJSON.data.length);
    const newImage = new Image({ url: links[i], name: 'Unsplash API seed image' });
    await newImage.save();
    const camp = new Campground({
      user: adminUser,
      title: `${descriptors[descrNum]} ${places[placeNum]}`,
      description: linksDesc[i],
      location: locationArr[locatNum],
      images: [newImage],
      postTimeStamp: new Date(),
      owners: [adminUser],
      postedBy: adminUser,
    });
    await camp.save();
    // camp reviews
    const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.';
    const reviewNum = Math.floor(Math.random() * 4);
    for (let i = 0; i < reviewNum; i++) {
      const campReview = new CampReview({
        user: adminUser,
        owners: [adminUser],
        postedBy: adminUser,
        rating: Math.ceil(Math.random() * 5),
        message: loremIpsumMessage(),
        postTimeStamp: new Date(),
        campground: camp,
      });
      await campReview.save();
    }

    function loremIpsumMessage() {
      const mult = Math.ceil(Math.random() * 3);
      let output = '';
      for (let i = 0; i < mult; i++) {
        output += loremIpsum;
      }
      return output;
    }
  }
  console.log('locations stored:', locationArr.length);
}

seedDB().then(() => {
  console.log('seed process finished');
  mongoose.connection.close();
  console.log('mongodb connection closing...');
});
