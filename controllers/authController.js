const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsnyc = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsnyc(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsnyc(async (req, res, next) => {
  const { email, password } = req.body;

  //checking email and password exists or not

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // Checking the user exist and password is correct.
  const user = await User.findOne({ email: email }).select('+password'); //here + sign is for the fields which are by default not selected in User Model as select:false

  //here correctPassword is our custom made global instance method for user document thats why we can use it here.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }

  // If everything ok, then send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

exports.protect = catchAsnyc(async (req, res, next) => {
  //Getting the token and check its true or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log('My Token: ', token);

  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please log in first to get access',
        401,
      ),
    );
  }

  //verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user is still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The token belonging to this user no longer exist. Please login again!',
        401,
      ),
    );
  }

  //check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401),
    );
  }

  //Grant access to protected route
  req.user = freshUser; //assigning current user to req.user to have access to the current user
  console.log('req.user:', req.user);
  console.log('req.user.role: ', req.user.role);
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // where roles = ['admin', 'lead-guie'] are allowed
    console.log('roles: ', roles);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not have permission to perform this action', 403),
      );
    }
    next();
  };
};
// here we cannot pass aurguments to a middleware function thats why we are wrapping our middleware function
// into a restrictTo wrapper function

exports.forgotPassword = catchAsnyc(async (req, res, next) => {
  // Get the user email tand verify the email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address!', 404));
  }
  // Generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send that token to the provided email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirm password to: ${resetURL}.\nIf you didn't forget your password then Please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'You Password Reset Token (Valid for 10 mins)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error in sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = (req, res, next) => {};
