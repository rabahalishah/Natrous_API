const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsnyc = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),

    httpOnly: true, //so browser cannot access or modify it
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
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
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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

exports.resetPassword = catchAsnyc(async (req, res, next) => {
  // get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //If token hase not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired, 400'));
  }
  //updating password and confirm password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // deleting the Reset token and reset Token expire from the db once the password is updated
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); //here we are not truning OFF the validators. As we want to validate the password.

  //update  changedPasswordAt property for the user

  // log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsnyc(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //here req.user is our current user which we have stored in the above code of protect middleware function

  // Check if the posted current password is correct by comparing it with the password stored in the database
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!'));
  }
  // If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log user in send JWT
  createSendToken(user, 200, res);
});
