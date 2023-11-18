const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel'); // Importing out model/collection
const User = require('../../models/userModel'); // Importing out model/collection
const Review = require('../../models/reviewModel'); // Importing out model/collection

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  // eslint-disable-next-line no-console
  .then(() => console.log('Database Connected Successfully'));

// Readung json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);
/* parse() JSON parsing is the process of converting a JSON object which is in text format to a Javascript object
 that can be used inside a program*/

// importing data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Deleting already present data in database
const deleteData = async () => {
  try {
    await Tour.deleteMany(); //we will pass nothing so it will delete all the data
    await User.deleteMany(); //we will pass nothing so it will delete all the data
    await Review.deleteMany(); //we will pass nothing so it will delete all the data
    console.log('All previous data have deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Process.argv
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);

// For delete
// node ./dev-data/data/import-dev-data.js --delete
// For Import
// node ./dev-data/data/import-dev-data.js --import
