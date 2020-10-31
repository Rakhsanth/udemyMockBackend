// Core modules
const path = require('path');
// Custom modules
const Bootcamp = require('../models/Bootcamp');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const {
    uploadImageToGoogleBucket,
    uploadVideoToGoogleBucket,
    deleteImageFromBucket,
    deleteVideoFromBucket,
} = require('../fileUploads/fileUploader');

// global constants
const megabytes = 1048576;

// @ description : get list of all courses or list of courses in a specific bootcamp
// @ route : GET api/v1/courses
// @ route : GET api/v1/bootcamps/:bootcampId/courses
// @ access : public
const getCourses = asyncMiddlewareHandler(async (request, response, next) => {
    if (request.params.bootcampId) {
        const courses = await Course.find({
            bootcamp: request.params.bootcampId,
        });
        response.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
            error: false,
        });
    } else {
        response.status(200).json(response.advancedResults); // This advancedResults is passed as middleware
    }
});

// @ description : get a single course
// @ route : GET api/v1/courses/:id
// @ access : public
const getCourse = asyncMiddlewareHandler(async (request, response, next) => {
    const courses = await Course.findById(request.params.id);
    if (!courses) {
        return next(
            new ErrorResponse(
                `No course found with ID: ${request.params.id}`,
                400
            )
        );
    }

    response.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
        error: false,
    });
});

// @ description : Add a new course and associate it to a bootcamp ID
// @ route : POST api/v1/bootcamps/:bootcampId/courses
// @ access : private
const addCourse = asyncMiddlewareHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(request.params.bootcampId);
    // getting a the bootcamp by ID and checking if it is present
    if (!bootcamp) {
        // If not present, give an error response
        return next(
            new ErrorResponse(
                `No bootcamps found with ID: ${request.params.bootcampId}`,
                400
            )
        );
    }
    // If it is present then associate the new course with it
    request.body.bootcamp = request.params.bootcampId;

    if (
        bootcamp.user.toString() !== request.user.id &&
        request.user.role !== 'admin'
    ) {
        return next(
            new ErrorResponse(
                'current user is not an admin or owner of this bootcamp so cannot add a course',
                400
            )
        );
    }

    request.body.user = request.user.id;

    const course = await Course.create(request.body);

    response.status(201).json({
        success: true,
        data: course,
        error: false,
    });
});
// @ description : Update a course
// @ route : PUT api/v1/courses/:id
// @ access : private
const updateCourse = asyncMiddlewareHandler(async (request, response, next) => {
    let course = await Course.findById(request.params.id);

    // Check if the course exists
    if (!course) {
        return next(
            new ErrorResponse(`No course found with ID: ${request.params.id}`)
        );
    }

    // No user validations provided because any logged in user can get enrolled to a course
    // And the needful needs to be updated here.

    // Copying new values to be updated to the main course object
    Object.assign(course, request.body);
    // Issued save query instead of update related things
    //to make validating middlewares to work as ecpected.
    await course.save();

    response.status(200).json({
        success: true,
        data: course,
        error: false,
    });
});
// @ description : Delete a course
// @ route : DELETE api/v1/courses/:id
// @ access : private
const deleteCourse = asyncMiddlewareHandler(async (request, response, next) => {
    const course = await Course.findById(request.params.id);
    if (!course) {
        return next(
            new ErrorResponse(`No course found with ID: ${request.params.id}`)
        );
    }

    if (
        course.user.toString() !== request.user.id &&
        request.user.role !== 'admin'
    ) {
        return next(
            new ErrorResponse(
                'current user is not an admin or owner of this course so cannot delete a course',
                400
            )
        );
    }

    await course.remove(); // For writing mongoose pre('remove') middleware

    response.status(200).json({
        success: true,
        data: null,
        error: false,
    });
});

// @ description : upload course image
// @ route : PUT api/v1/courses/:id/image
// @ access : private
const uploadCourseImage = asyncMiddlewareHandler(
    async (request, response, next) => {
        const course = await Course.findById(request.params.id);

        if (!course) {
            return next(new ErrorResponse('No such course exists', 404));
        }

        if (
            course.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse('User not authorised to do this action', 401)
            );
        }

        if (!request.files) {
            return next(new ErrorResponse('please upload a file', 400));
        }

        if (request.files.file.mimetype.search(/(jpg|jpeg|png)/i) === -1) {
            return next(new ErrorResponse('please upload an image file', 400));
        }

        if (course.picture !== 'no-photo.jpg') {
            // if already has an image delete that from GCP
            let filename = course.picture.split('/');
            filename = filename[filename.length - 1];
            console.log('has an image already'.yellow);
            console.log(`deleting existing image ${filename}`);
            deleteImageFromBucket(filename);
            console.log('Previous image deleted successfully'.green);
        }

        const uploadedVideo = request.files.file;

        const fileLimit = 5 * megabytes;
        if (uploadedVideo.size > fileLimit) {
            return next(
                new ErrorResponse('please upload an image less than 5 MB', 400)
            );
        }

        uploadedVideo.name = `courseImage${course.id}${
            path.parse(uploadedVideo.name).ext
        }`;

        console.log('logging image uploading'.cyan.inverse);
        console.log(uploadedVideo);

        const courseImageURL = await uploadImageToGoogleBucket(uploadedVideo);

        if (!courseImageURL) {
            return next(
                new ErrorResponse(
                    'Unable to upload image. Issue with GCP please try later',
                    404
                )
            );
        }

        await Course.findByIdAndUpdate(course.id, { picture: courseImageURL });

        response.status(201).json({
            success: true,
            data: {
                message: 'successfully uploaded',
                imageURL: `${courseImageURL}`,
            },
            error: false,
        });
    }
);

// @ description : upload course video
// @ route : PUT api/v1/courses/:id/video
// @ access : private
const uploadCourseVideo = asyncMiddlewareHandler(
    async (request, response, next) => {
        const course = await Course.findById(request.params.id);

        if (!course) {
            return next(new ErrorResponse('No such course exists', 404));
        }

        if (
            course.user.toString() !== request.user.id &&
            request.user.role !== 'admin'
        ) {
            return next(
                new ErrorResponse('User not authorised to do this action', 401)
            );
        }

        if (!request.files) {
            return next(new ErrorResponse('please upload a file', 400));
        }

        if (
            request.files.file.mimetype.search(/(mp4|avi|flv|wmv|mov)/i) === -1
        ) {
            return next(new ErrorResponse('please upload an image file', 400));
        }

        if (course.video !== 'no-video') {
            // if already has an image delete that from GCP
            let filename = course.video.split('/');
            filename = filename[filename.length - 1];
            console.log('has a video already'.yellow);
            console.log(`deleting existing video ${filename}`);
            deleteVideoFromBucket(filename);
            console.log('Previous video deleted successfully'.green);
        }

        const uploadedVideo = request.files.file;

        const fileLimit = 100 * megabytes;
        if (uploadedVideo.size > fileLimit) {
            return next(
                new ErrorResponse('please upload a video less than 100 MB', 400)
            );
        }

        uploadedVideo.name = `courseVideo${course.id}${
            path.parse(uploadedVideo.name).ext
        }`;

        console.log('logging video uploading'.cyan.inverse);
        console.log(uploadedVideo);

        const courseVideoURL = await uploadVideoToGoogleBucket(uploadedVideo);

        if (!courseVideoURL) {
            return next(
                new ErrorResponse(
                    'Unable to upload image. Issue with GCP please try later',
                    404
                )
            );
        }

        await Course.findByIdAndUpdate(course.id, { video: courseVideoURL });

        response.status(201).json({
            success: true,
            data: {
                message: 'successfully uploaded',
                imageURL: `${courseVideoURL}`,
            },
            error: false,
        });
    }
);

module.exports = {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCourseImage,
    uploadCourseVideo,
};
