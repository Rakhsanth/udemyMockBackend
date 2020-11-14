// 3rd party modules
const Pusher = require('pusher');
// custom modules
const User = require('../models/User');
const Profile = require('../models/Profile');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');

// Pusher related stuff
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});
const channel = 'notifications';

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
        data.email = request.user.email;
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

        console.log('logging input body'.yellow.inverse);
        console.log(request.body);

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

        const updatedUnReadCount = profile;

        // For realtime pushing of notification count update
        pusher.trigger(channel, 'updated', { doc: updatedUnReadCount });

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

        response.status(201).json({
            success: true,
            message: 'Successfully removed your profile',
            error: false,
        });
    }
);

// @ description : Add a notification using user ID
// @ route : POST api/v1/profiles/notification/:userId
// @ access : frontend flow will decide (Only if user is logged in)
const addNotification = asyncMiddlewareHandler(
    async (request, response, next) => {
        const userId = request.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorResponse('user does not exist', 404));
        }

        const userProfile = await Profile.findOne({ user: user.id });

        if (!userProfile) {
            return next(
                new ErrorResponse('User does not have profile created yet', 404)
            );
        }

        userProfile.notifications.unshift(request.body);
        console.log(userProfile);

        const updatedProfile = await userProfile.save();
        if (!updatedProfile) {
            return next(
                new ErrorResponse(
                    'Could not add notification MongoDB error, Please try again later',
                    404
                )
            );
        }

        const updatedUnReadCount = await Profile.incrementUnRead(
            updatedProfile
        );
        if (!updatedUnReadCount) {
            return next(
                new ErrorResponse(
                    'Could not add notification MongoDB error, Please try again later',
                    404
                )
            );
        }

        console.log('Triggered pusher here'.green.bold);
        // console.log(updatedDoc);
        pusher.trigger(channel, 'updated', { doc: updatedUnReadCount });

        response
            .status(201)
            .json({ success: true, data: updatedUnReadCount, error: false });
    }
);

// @ description : Add a notification using user ID
// @ route : DELETE api/v1/profiles/notification/:userId/:notificationId
// @ access : frontend flow will decide (User needs to be logged in)
const removeNotification = asyncMiddlewareHandler(
    async (request, response, next) => {
        const userId = request.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorResponse('user does not exist', 404));
        }

        const userProfile = await Profile.findOne({ user: user.id });

        if (!userProfile) {
            return next(
                new ErrorResponse('User does not have profile created yet', 404)
            );
        }

        const indexToRemove = userProfile.notifications.findIndex(
            (notification) =>
                notification._id.toString() === request.params.notificationId
        );
        if (indexToRemove === -1) {
            return next(
                new ErrorResponse(
                    'Notification does not exist or already is viewed by the user and deleted',
                    404
                )
            );
        }

        userProfile.notifications.splice(indexToRemove, 1);

        const updatedProfile = await userProfile.save();

        response
            .status(201)
            .json({ success: true, data: updatedProfile, error: false });
    }
);

module.exports = {
    getProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    addNotification,
    removeNotification,
};
