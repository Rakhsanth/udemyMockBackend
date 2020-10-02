// Custom modules
const Bootcamp = require('../models/Bootcamp');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');

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
    // if (!course) {
    //     return next(
    //         new ErrorResponse(`No course found with ID: ${request.params.id}`)
    //     );
    // }

    response.status(200).json({
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

    // Check if current user is course owner or admin
    if (
        course.user.toString() !== request.user.id &&
        request.user.role !== 'admin'
    ) {
        return next(
            new ErrorResponse(
                'current user is not an admin or owner of this course so cannot update a course',
                400
            )
        );
    }

    course = await Course.findByIdAndUpdate(request.params.id, request.body, {
        new: true,
        runValidators: true,
    });

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

module.exports = {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse,
};
