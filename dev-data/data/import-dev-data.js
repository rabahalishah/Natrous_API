const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('./../../models/tourmodel'); // Importing out model/collection

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
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);
/* parse() JSON parsing is the process of converting a JSON object in text format to a Javascript object
 that can be used inside a program*/

// importing data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
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
    console.log('All previous data deleted successfully');
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
