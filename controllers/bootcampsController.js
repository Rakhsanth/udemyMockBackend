// core modules
const path = require('path');
// Custom modules
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const geocoder = require('../utils/geoCoder');
const { uploadImageToGoogleBucket } = require('../fileUploads/fileUploader');

// @ description : get list of all bootcamps
// @ route : GET api/v1/bootcamps
// @ access : public
const getBootcamps = asyncMiddlewareHandler(async (request, response, next) => {
    response.status(200).json(response.advancedResults);
});
// @ description : get a single bootcamp
// @ route : GET api/v1/bootcamps/:id
// @ access : public
const getBootcamp = asyncMiddlewareHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(request.params.id);
    if (!bootcamp) {
        // returning to prevent the execution of below steps after this if.
        return next(
            new ErrorResponse('No resource exist for the request', 400)
        );
    }
    response.status(200).json({
        success: true,
        data: bootcamp,
        error: false,
    });
});
// @ description : Create new bootcamp
// @ route : POST api/v1/bootcamps
// @ access : private
const postBootcamps = asyncMiddlewareHandler(
    async (request, response, next) => {
        // only admin can create multiple bootcamps. Check if user already created a bootcamp and he is admin
        const existingBootcamp = await Bootcamp.findOne({
            user: request.user.id,
        });

        if (existingBootcamp && request.user.role !== 'admin') {
            return next(
                new ErrorResponse(
                    `Current user is not allowed to create multiple bootcamps`,
                    403
                )
            );
        }

        // associate a user for each created bootcamp
        // current user comes form the auth middleware in request.user
        request.body.user = request.user.id;

        const bootcamp = await Bootcamp.create(request.body);
        response.status(201).json({
            success: true,
            data: bootcamp,
            error: false,
        });
    }
);
// @ description : Update a bootcamp
// @ route : PUT api/v1/bootcamps/:id
// @ access : private
const putBootcamp = asyncMiddlewareHandler(async (request, response, next) => {
    let bootcamp = await Bootcamp.findById(request.params.id);
    if (!bootcamp) {
        return next(
            new ErrorResponse('couldnot update as no such resource exist', 400)
        );
    }

    if (
        bootcamp.user.toString() !== request.user.id &&
        request.user.role !== 'admin'
    ) {
        return next(
            new ErrorResponse(
                'User is not an admin or owner of this bootcamp',
                400
            )
        );
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(
        request.params.id,
        request.body,
        {
            new: true,
            runValidators: true,
        }
    );

    response.status(201).json({
        success: true,
        data: bootcamp,
        error: false,
    });
});
// @ description : Delete a bootcamp
// @ route : DELETE api/v1/bootcamps/:id
// @ access : private
const deleteBootcamp = asyncMiddlewareHandler(
    async (request, response, next) => {
        const bootcamp = await Bootcamp.findById(request.params.id);
        if (!bootcamp) {
            return next(
                new ErrorResponse(
                    'resource cant be deleted as it doesnot exist',
                    400
                )
            );
        }

        if (
            bootcamp.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse(
                    'User is not an admin or owner of this bootcamp',
                    400
                )
            );
        }

        bootcamp.remove(); // Used this idea instead of findByIdAndDelete/findByIdAndRemove do get pre('remove') functionality.
        response.status(201).json({
            success: true,
            data: null,
            error: false,
        });
    }
);
// @ description : Get bootcamps within a radius of given zipCode
// @ route : GET api/v1/bootcamps/radius/:zipode/:distance(in kms)
// @ access : private
const getBootcampsInRadius = asyncMiddlewareHandler(
    async (request, response, next) => {
        const { zipcode, distance } = request.params;
        let loc = await geocoder.geocode(zipcode);
        loc = loc[0];
        const latitude = loc.latitude;
        const longitude = loc.longitude;
        const radius = distance / 6371;
        const bootcamps = await Bootcamp.find({
            location: {
                $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
            },
        });
        if (!bootcamps) {
            return next(
                new ErrorResponse('no bootcamps found within this area', 400)
            );
        }
        response.status(201).json({
            success: true,
            count: bootcamps.length,
            data: bootcamps,
            error: false,
        });
    }
);
// @ description : Upload a bootcamp image
// @ route : PUT api/v1/bootcamps/:id/photo
// @ access : private
const uploadBootcampImage = asyncMiddlewareHandler(
    async (request, response, next) => {
        const bootcamp = await Bootcamp.findById(request.params.id);
        if (!bootcamp) {
            return next(
                new ErrorResponse(
                    'resource cant be deleted as it doesnot exist',
                    400
                )
            );
        }

        if (
            bootcamp.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse(
                    'User is not an admin or owner of this bootcamp',
                    400
                )
            );
        }

        if (!request.files) {
            return next(new ErrorResponse('please upload a file', 400));
        }

        if (request.files.file.mimetype.search(/(jpg|jpeg|png)/i) === -1) {
            return next(new ErrorResponse('please upload an image file', 400));
        }

        const uploadedFile = request.files.file;

        uploadedFile.name = `image_${bootcamp._id}${
            path.parse(uploadedFile.name).ext
        }`;

        console.log('logging file uploaded'.cyan.inverse);
        console.log(uploadedFile);

        const bootcampImageURL = await uploadImageToGoogleBucket(
            request.files.file,
            bootcamp._id
        );
        if (!bootcampImageURL) {
            return next(
                new ErrorResponse(
                    'problem with the cloud storage, please try again after some time',
                    500
                )
            );
        }

        await Bootcamp.findByIdAndUpdate(bootcamp._id, {
            photo: bootcampImageURL,
        });

        response.status(201).json({
            success: true,
            data: {
                message: 'successfully uploaded',
                imageURL: `${bootcampImageURL}`,
            },
            error: false,
        });
    }
);

module.exports = {
    getBootcamps,
    getBootcamp,
    postBootcamps,
    putBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    uploadBootcampImage,
};
