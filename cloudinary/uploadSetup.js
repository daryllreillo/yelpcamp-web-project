import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// env config
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'TestFolder',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    format: 'jpg',
  },
});

export { cloudinary, storage };
