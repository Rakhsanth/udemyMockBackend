// 3rd party modules

// custom modules
const User = require('../models/User');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const sendMailToUser = require('../utils/mailer');
// core modules
const crypto = require('crypto');

// @ description : Get current logged in user details
// @ route : GET api/v1/auth/me
// @ access : private
const getCurrentUser = asyncMiddlewareHandler(
    async (request, response, next) => {
        // request.user is coming from the protected middleware
        const user = await User.findById(request.user.id);

        response.status(200).json({
            success: true,
            data: user,
            error: false,
        });
    }
);
// @ description : Register a user
// @ route : POST api/v1/auth/register
// @ access : public
const userRegister = asyncMiddlewareHandler(async (request, response, next) => {
    const { thirdParty, name, email, password, role } = request.body;

    const user = await User.create({ thirdParty, name, email, password, role });
    // as we have added a method similar to statics. this thing will give the generated jwt.
    // const token = user.getSignedJwtToken();
    // response.status(200).json({ success: true, token });
    // here we can call the cookie setting util function below
    setTokenInCookie(user, 200, response);
});

// @ description : login a user
// @ route : POST api/v1/auth/login
// @ access : public
const userLogin = asyncMiddlewareHandler(async (request, response, next) => {
    const { email, password } = request.body;

    if (!email || !password) {
        return next(new ErrorResponse('please enter the credentials', 401));
    }
    // This should be email: email(email from request)
    // + is used because we have coded as should not be able to select by default in the model.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('invalid credential: email', 401));
    }

    const isMatching = await user.comparePassword(password);

    if (!isMatching) {
        return next(new ErrorResponse('invalid credential: password', 401));
    }

    // response.status(200).json({ success: true, token });
    // here we can call the cookie setting util function below
    setTokenInCookie(user, 200, response);
});
// @ description : Logout a user
// @ route : GET api/v1/auth/logout
// @ access : private
const userLogout = asyncMiddlewareHandler(async (request, response, next) => {
    // Get rif of cookie and the authorization header
    // cookies always to be sent in response and not as part of request
    response.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    request.headers.authorization = null;

    response.status(200).json({
        success: true,
        message: 'User has been logged out',
        error: false,
    });
});
// @ description : Forgot password
// @ route : POST api/v1/auth/forgotPassword
// @ access : public
const forgotPassword = asyncMiddlewareHandler(
    async (request, response, next) => {
        const { email } = request.body;

        if (!email) {
            return next(new ErrorResponse('please enter the email', 401));
        }
        // This should be email: email(email from request)
        // + is used because we have coded as should not be able to select by default in the model.
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new ErrorResponse('no user found for this email', 404));
        }

        // getting reset token and meanwhile this functions sets the hashed reset password and expiry in DB
        resetToken = user.getResetToken();

        await user.save({ validateBeforeSave: false });

        const resetPasswordLink = `${request.protocol}://${request.get(
            'host'
        )}/api/v1/auth/resetPassword/${resetToken}`;

        // create the object for sending email
        const emailParameters = {
            mailSubject: 'Reset Password',
            mailContent: `<p>
                            <a href="https://google.com">click here to reset the password</a><br>
                            or use the link : ${resetPasswordLink} in your preferred browser
                          </p>`,
            userEmail: email,
        };

        try {
            await sendMailToUser(emailParameters);

            // console.log(resetToken);

            response.status(200).json({
                success: true,
                message: 'Email sent to the user',
                error: false,
            });
        } catch (err) {
            console.log(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
        }
    }
);
// @ description : password Reset
// @ route : PUT api/v1/auth/passwordReset/:resetPasswordToken
// @ access : public
const resetPassword = asyncMiddlewareHandler(
    async (request, response, next) => {
        // hashing the received reset token from the url params
        const hashedResetToken = crypto
            .createHash('sha256')
            .update(request.params.resetPasswordToken)
            .digest('hex');

        // Getting the user with respective hashed reset token
        const user = await User.findOne({
            resetPasswordToken: hashedResetToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        // Check if such user is present
        if (!user) {
            return next(
                new ErrorResponse(
                    'Invalid reset password or reset password expired',
                    404
                )
            );
        }
        // update this new password from the body
        user.password = request.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        // Create the jwt and set it to cookie for logging this user immediately.
        setTokenInCookie(user, 200, response);
    }
);
// @ description : update current user details
// @ route : PUT api/v1/auth/updateDetails
// @ access : private
const updateDetails = asyncMiddlewareHandler(
    async (request, response, next) => {
        const { name, email } = request.body;

        // Getting the current user. Got from the protected middleware
        const user = await User.findByIdAndUpdate(
            request.user.id,
            { name, email },
            {
                new: true,
                runValidators: true,
            }
        );

        response.status(201).json({
            success: true,
            data: user,
            error: false,
        });
    }
);
// @ description : update current user password
// @ route : PUT api/v1/auth/updatePassword
// @ access : private
const updatePassword = asyncMiddlewareHandler(
    async (request, response, next) => {
        const { currentPassword, newPassword } = request.body;

        // Getting the current user. Got from the protected middleware
        // .select is done as by default the password is set to select: false. So to select it we should do this
        const user = await User.findById(request.user.id).select('+password');

        // If we dont select like above the password will not be passed in this.password which is needed for comparison
        if (!(await user.comparePassword(currentPassword))) {
            return next(
                new ErrorResponse('current password entered in incorrect', 403)
            );
        }

        user.password = newPassword;
        await user.save();

        // Set the token to cookie and also send token in reponse
        setTokenInCookie(user, 201, response);
    }
);

// The below arguments are just for our custom logic. response is for setting response from here
const setTokenInCookie = (user, statusCode, response) => {
    const token = user.getSignedJwtToken();

    const options = {
        // As cookie expire is given in milliseconds we get a number in env and convert to day here.
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // This is to enable only the client side script to access this cookie
        secure: false,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    console.log(options);

    response.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
    });
};

module.exports = {
    getCurrentUser,
    userRegister,
    userLogin,
    userLogout,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
};
