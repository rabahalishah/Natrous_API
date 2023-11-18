// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./../models/userModel');

// Creating schemas
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
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
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
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
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
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
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: false },
  },
);
// Here above in schema options we have set to show our created virtuals to true in case of JSON and to hide them in case of object.

// setting index to increase reading data performance
// 1 for ascending and -1 for descending
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound
tourSchema.index({ slug: 1 }); //unique
tourSchema.index({ startLocation: '2dsphere' }); // 2D in index for geospatial properties
//We did this cause $geoWithin & $geoNear requires an a 2dSphere index to execute the query and this index will help us to find or match the results.
// tourSchema.index({ price: 1 });

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// here the virtual is a category which we specify when we do not want to store the information in the database but just want to
// show. As it doesn't make sense to store the same info with different units. Now from schema options we can manage this virtual property. REMEMBER: we cannot use queries on virtuals as they are actually
// not a part of database.

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  //Now connecting two models.
  foreignField: 'tour', //here we specify the field to connet. In reviewModel we have tour field where the id of tour is being stored.
  localField: '_id', //here the _id which is id in the current model will be called tour in Foreign Model that is reviewModel.
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// This middleware will not work for .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// For embedding user data in tour model
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
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

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  // here its trick to unselect the object which we do not want to show or you can say we want to hide.

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  console.log(`The Query Took ${(Date.now() - this.start) / 1000} seconds`);
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log('aggregation middleware pipeline: ', this.pipeline());

//   next();
// });
// creating Model
mongoose.models = {};
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
