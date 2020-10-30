// 3rd party modules

// custom modules
const User = require('../models/User');
const Profile = require('../models/Profile');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const { findOneAndUpdate, remove } = require('../models/User');

// @ description : Get all profiles
// @ route : GET api/v1/profiles
// @ access : private/admin
const getProfiles = asyncMiddlewareHandler(async (request, response, next) => {
    response.status(200).json(response.advancedResults);
});
// @ description : Get single profile by ID
// @ route : GET api/v1/profiles/:id
// @ access : private/ user, admin
const getProfile = asyncMiddlewareHandler(async (request, response, next) => {
    const profile = await Profile.findById(request.params.id);

    if (!profile) {
        return next(new ErrorResponse('No such profile found', 401));
    }

    if (
        request.user.id !== profile.user.toString() &&
        request.user.role !== 'admin'
    ) {
        {
            return next(
                new ErrorResponse(
                    'User is not an admin or owner of this profile',
                    400
                )
            );
        }
    }

    response.status(200).json({
        success: true,
        data: profile,
        error: false,
    });
});
// @ description : Create a profile
// @ route : POST api/v1/profiles
// @ access : private/ user, admin
const createProfile = asyncMiddlewareHandler(
    async (request, response, next) => {
        const data = request.body;

        data.user = request.user.id;
        const profile = await Profile.create(data);

        response
            .status(201)
            .json({ success: true, data: profile, error: false });
    }
);
// @ description : Update a profile using ID
// @ route : PUT api/v1/profiles/:id
// @ access : private/ user, admin
const updateProfile = asyncMiddlewareHandler(
    async (request, response, next) => {
        let profile = await Profile.findById(request.params.id);

        if (!profile) {
            return next(new ErrorResponse('No such profile found', 401));
        }

        if (
            profile.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse(
                    'User is not an admin or owner of this profile',
                    400
                )
            );
        }

        profile = await Profile.findOneAndUpdate(
            { _id: profile.id },
            request.body,
            {
                new: true,
                runValidators: true,
            }
        );

        response
            .status(201)
            .json({ success: true, data: profile, error: false });
    }
);
// @ description : delete a profile using ID
// @ route : DELETE api/v1/profiles/:id
// @ access : private/ user, admin
const deleteProfile = asyncMiddlewareHandler(
    async (request, response, next) => {
        const profile = await Profile.findById(request.params.id);

        if (!profile) {
            return next(new ErrorResponse('No such profile found', 401));
        }

        if (
            profile.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse(
                    'User is not an admin or owner of this profile',
                    400
                )
            );
        }

        await profile.remove();

        response
            .status(201)
            .json({
                success: true,
                message: 'Successfully removed your profile',
                error: false,
            });
    }
);

module.exports = {
    getProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
};
