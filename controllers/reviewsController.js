// Custom modules

const ErrorResponse = require('../utils/error');
const asyncMiddlewareHandler = require('../middlewares/asyncMiddlewareHandler');
const Bootcamp = require('../models/Bootcamp');
const User = require('../models/User');
const Review = require('../models/Review');

// @ description : get all the reviews or get reviews about a single bootcamp
// @ route : GET api/v1/reviews
// @ route : GET api/v1/bootcamps/:bootcampId/reviews
// @ access : public
const getReviews = asyncMiddlewareHandler(async (request, response, next) => {
    if (request.params.bootcampId) {
        const reviews = await Review.find({
            bootcamp: request.params.bootcampId,
        });
        response.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
            error: false,
        });
    } else {
        response.status(200).json(response.advancedResults); // This advancedResults is passed as middleware
    }
});
// @ description : get a single review
// @ route : GET api/v1/reviews/:id
// @ access : public
const getReview = asyncMiddlewareHandler(async (request, response, next) => {
    const review = await Review.findById(request.params.id).populate({
        path: 'bootcamp',
        select: 'name careers',
    });
    if (!Review) {
        return next(
            new ErrorResponse(
                `No course found with ID: ${request.params.id}`,
                400
            )
        );
    }

    response.status(200).json({
        success: true,
        data: review,
        error: false,
    });
});
// @ description : add a review
// @ route : POST api/v1/bootcamps/:bootcampId/reviews
// @ access : private/user
const addReview = asyncMiddlewareHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(request.params.bootcampId);

    if (!bootcamp) {
        return next(new ErrorResponse(`No such bootcamp exists`, 400));
    }

    // Associate logged in user and bootcamp to this review
    request.body.bootcamp = request.params.bootcampId;
    // This is comming from the protected middleware
    request.body.user = request.user.id;

    const review = await Review.create(request.body);

    response.status(200).json({
        success: true,
        data: review,
        error: false,
    });
});
// @ description : update a review
// @ route : PUT api/v1/reviews/:id
// @ access : private/user
const updateReview = asyncMiddlewareHandler(async (request, response, next) => {
    let review = await Review.findById(request.params.id);

    if (!review) {
        return next(new ErrorResponse(`No such review exists`, 401));
    }

    if (review.user.toString() !== request.user.id) {
        return next(
            new ErrorResponse(`Not autorized to edit this review`, 401)
        );
    }

    review = await Review.findByIdAndUpdate(request.params.id, request.body, {
        new: true,
        runValidators: true,
    });

    response.status(200).json({
        success: true,
        data: review,
        error: false,
    });
});
// @ description : delete a review
// @ route : DELETE api/v1/reviews/:id
// @ access : private/user
const deleteReview = asyncMiddlewareHandler(async (request, response, next) => {
    let review = await Review.findById(request.params.id);

    if (!review) {
        return next(new ErrorResponse(`No such review exists`, 401));
    }

    if (review.user.toString() !== request.user.id) {
        return next(
            new ErrorResponse(`Not autorized to delete this review`, 401)
        );
    }

    await Review.remove();

    response.status(200).json({
        success: true,
        data: null,
        error: false,
    });
});

module.exports = {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
};
