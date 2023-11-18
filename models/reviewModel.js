const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: false },
  },
);

//populating user and tour
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name Photo',
  // });
  this.populate({
    path: 'user',
    select: 'name Photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // here we will make aggregation pipeline
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  console.log('stats: ', stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true,
  },
);

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
  //here this.construtor points toward Review Model
});

//findByIdAndUpdate
//findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); //executing the query to get review document here r stands for review,
  // saving the data in this.r this is a trick to pass data from pre middleware to post middleware
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); THIS will not work here as query has already executed.
  await this.r.constructor.calcAverageRatings(this.r.tour); //here this.r is from the above pre middleware
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
