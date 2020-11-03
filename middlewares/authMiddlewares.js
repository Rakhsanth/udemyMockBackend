// 3rd party module
const jwt = require('jsonwebtoken');
// custom module
const asyncMiddlewareHandler = require('./asyncMiddlewareHandler');
const User = require('../models/User');
const ErrorResponse = require('../utils/error');

const protected = asyncMiddlewareHandler(async (request, response, next) => {
    let token;
    if (
        request.headers.authorization &&
        request.headers.authorization.startsWith('Bearer')
    ) {
        token = request.headers.authorization.split(' ')[1];
    } else if (request.cookies) {
        token = request.cookies.token;
    }
    console.log(token);
    if (!token) {
        return next(
            new ErrorResponse('not authorized to access this route', 401)
        );
    }

    // Get the unique Id forn the JWT using the verify method
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        request.user = await User.findById(decoded.id);
        console.log(request.user);
        next();
    } catch (err) {
        console.log(err);
        return next(
            new ErrorResponse('not authorized to access this route', 401)
        );
    }
});

const roleAuthorize = (...roles) =>
    function (request, response, next) {
        if (!roles.includes(request.user.role)) {
            return next(
                new ErrorResponse(
                    `User with role ${request.user.role} is not authorized for this route`,
                    403
                )
            );
        }
        next();
    };

module.exports = {
    protected,
    roleAuthorize,
};
