const Review = require('../models/Review');
const ErrorRespnse = require('./error');

const advancedResultsReviews = (populate) => {
    return async (request, response, next) => {
        let query;

        const reqQuery = { ...request.query };
        // deciding what all may cause error to mongoDb query
        const objectsToRemove = ['select', 'sort', 'page', 'limit', 'percents'];
        // removing above objects if present
        objectsToRemove.forEach((element) => delete reqQuery[element]);

        let queryString = JSON.stringify(reqQuery);
        queryString = queryString.replace(
            /\b(lte|lt|gte|gt|eq|in)\b/g,
            (match) => `$${match}`
        );

        const queryObject = JSON.parse(queryString);

        if (!request.params.bootcampId && !request.params.courseId) {
            return next(new ErrorRespnse());
        } else {
            const bootcampOrCourseId =
                request.params.bootcampId || request.params.courseId;
            queryObject.$or = [
                { bootcamp: bootcampOrCourseId },
                { course: bootcampOrCourseId },
            ];
        }

        query = Review.find(queryObject);

        if (populate) {
            query = query.populate(populate);
        }
        if (request.query.select) {
            const select = request.query.select.split(',').join(' ');
            query = query.select(select);
        }
        if (request.query.sort) {
            const sortBy = request.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        const pagination = {
            prev: null,
            current: Number(request.query.page) || 1,
            next: null,
        };

        let pageNumber = Number(request.query.page) || 1;
        let limit = Number(request.query.limit) || 1;
        let toSkip = (pageNumber - 1) * limit;
        let startIndex = toSkip;
        let endIndex = pageNumber * limit;

        let tempResult = await query;
        const totalCount = tempResult.length;

        query = query.skip(toSkip).limit(limit);

        let result = await query;

        if (startIndex > 0) {
            pagination.prev = pageNumber - 1;
        }
        if (endIndex < totalCount) {
            pagination.prev = pageNumber + 1;
        }

        if (!result) {
            return next(err);
        }

        let percents = {
            one: 0,
            two: 0,
            three: 0,
            four: 0,
            five: 0,
        };
        if (request.query.percents) {
            tempResult.forEach((review, index) => {
                let currentRating = review.rating;
                currentRating = Math.floor(currentRating);
                if (currentRating === 1) {
                    percents.one++;
                }
                if (currentRating === 2) {
                    percents.two++;
                }
                if (currentRating === 3) {
                    percents.three++;
                }
                if (currentRating === 4) {
                    percents.four++;
                }
                if (currentRating === 5) {
                    percents.five++;
                }
            });
            const percentsList = Object.entries(percents);
            percentsList.forEach(([key, value], index) => {
                percentsList[index][1] = (value / totalCount) * 100;
            });
            percents = Object.fromEntries(percentsList);
            console.log(percents);
        }

        response.advancedReviewResults = {
            success: true,
            count: totalCount,
            pagination,
            data: result,
            error: false,
        };

        if (percents) {
            response.advancedReviewResults.percents = percents;
        }

        next(); // forgot once and got the hard hit for it
    };
};

module.exports = advancedResultsReviews;
