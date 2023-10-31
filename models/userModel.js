const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'Please tell use your name'],
  },
  email: {
    type: String,
    require: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'], //isEmail is a builtin function validator npm doucment.
  },
  photo: { type: String, require: true },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, 'Please confirm your password'],
    validate: {
      //This will work only on saving or creating a user
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //Only run this function when the password is actually modified
  if (!this.isModified('password')) return next();

  //Hashing the password

  this.password = await bcrypt.hash(this.password, 12);

  //Deleting the confirm password unnecessaary field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});
// This query middleware will run just before any mongoose method starting with "find" here regex means /^find/ that too.
// this query is like filter. It will only show the users whose active status is not false in the database

//(An instance method is a method which is available to all the docuemnt in whcih it has created
// as in this case it is user Document)
//creating a global Instance method to compare the password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
// here candidate password is password which is pass by the user and which is not hashed, whereas userPassword is the hasned password
//and already stored in database. This method will return either true or false

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimeStamp;
  }

  //false means password not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // generating a token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encypting the generated token and storing into our database

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema); //it will store as users in mongoDB automatically

module.exports = User;
