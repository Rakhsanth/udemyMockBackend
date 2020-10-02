// 3rd party modules

// custom modules
const User = require('../models/User');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const advancedResults = require('../utils/advancedResults');

// @ description : Get all users
// @ route : GET api/v1/users
// @ access : private/admin
const getUsers = asyncMiddlewareHandler(async (request, response, next) => {
    response.status(200).json(response.advancedResults);
});
// @ description : Get user by ID
// @ route : GET api/v1/users/:id
// @ access : private/admin
const getUser = asyncMiddlewareHandler(async (request, response, next) => {
    const user = await User.findById(request.params.id);

    if (!user) {
        return next(new ErrorResponse('No such user found', 401));
    }

    response.status(200).json({
        success: true,
        data: user,
        error: false,
    });
});
// @ description : Create new user
// @ route : POST api/v1/users
// @ access : private/admin
const createUser = asyncMiddlewareHandler(async (request, response, next) => {
    const user = await User.create(request.body);

    response.status(201).json({
        success: true,
        data: user,
        error: false,
    });
});
// @ description : Create new user
// @ route : PUT api/v1/users/:id
// @ access : private/admin
const updateUser = asyncMiddlewareHandler(async (request, response, next) => {
    const user = await User.findByIdAndUpdate(request.params.id, request.body, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        if (!user) {
            return next(new ErrorResponse('No such user found', 401));
        }
    }

    response.status(201).json({
        success: true,
        data: user,
        error: false,
    });
});
// @ description : Create new user
// @ route : DELETE api/v1/users/:id
// @ access : private/admin
const deleteUser = asyncMiddlewareHandler(async (request, response, next) => {
    const user = await User.findByIdAndDelete(request.params.id);

    if (!user) {
        if (!user) {
            return next(new ErrorResponse('No such user found', 401));
        }
    }

    response.status(200).json({
        success: true,
        data: null,
        error: false,
    });
});

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
};
