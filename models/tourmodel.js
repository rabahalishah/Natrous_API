// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// Creating schemas
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less than or equal to 40 characters'],
      minlength: [
        10,
        'A tour name must have greater or equal than 10 character',
      ],
      // validate: [validator.isAlpha, 'Tour Name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can either be: easy, medium or difficult',
      },
      //enum is only for strings
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      minlength: [1, 'Rating must be above 1.0'],
      maxlength: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // here this keyword is pointing toward the value entered by the user on creating NEW document
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be less than the actual price',
      },
    },
    summary: {
      type: String,
      trim: true, //Trim will remove spaces in the start and end of the string
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover Image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: false },
  },
);
// Here above in schema options we have set to show our created virtuals to true in case of JSON and to hide them in case of object.

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// here the virtual is a category which we specify when we do not want to store the information in the database but just want to
// show. As it doesn't make sense to store the same info with different units. Now from schema options we can manage this virtual property. REMEMBER: we cannot use queries on virtuals as they are actually
// not a part of database.

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// This middleware will not work for .insertMany()
// tourSchema.pre('save', function (next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('will save document');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log('doc: ', doc);
//   next();
// });

//QUERY MIDDLEWARE

// tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
// This query will not work for findOne, findOneAndUpdate etc.
//To make it work for that we are using regular expressions
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});
// here this experssion /^find/ means that any query starting with find

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  // console.log(`The Query Took ${(Date.now() - this.start) / 1000} seconds`);
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log('aggregation middleware pipeline: ', this.pipeline());

  next();
});
// creating Model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
