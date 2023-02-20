import axios from 'axios';
import mongoose from 'mongoose';
import { otherLocations } from './otherLocations.js';

// mongodb connection
async function main() {
  const mongoDbUrl = 'mongodb+srv://hseeyo:Managon327955@mongodbcluster0.jmmj23o.mongodb.net/yelpcamptest?retryWrites=true&w=majority';
  await mongoose.connect(mongoDbUrl); // local mongoDB: 'mongodb://localhost:27017/yelpcamptest'
  console.log('mongodb connection started.');
}
mongoose.set('strictQuery', false);
main().catch(err => console.log(err));

const Schema = mongoose.Schema;

otherLocations.forEach(async location => {
  const countryGetAPI = await axios.get('https://api.api-ninjas.com/v1/country?name=' + location.country, {
    headers: { 'X-Api-Key': '4XTmT4FTPCqTXAQL/IB3dQ==w1oErNG7HwQtINgW' },
  });
  const countryName = countryGetAPI.data[0].name;
  const country = new Country({ name: countryName, ISO: location.country });
  await country.save();
});

const countrySchema = new Schema({
  name: { type: String, required: true },
  ISO: String,
});
const Country = mongoose.model('Country', countrySchema);

// console.log(test.data[0].name);
