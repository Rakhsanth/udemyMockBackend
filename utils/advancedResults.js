const Course = require('../models/Course');

const advancedResults = (model, modelType, populate) => {
    return async (request, response, next) => {
        let query;
        let bootcampIds = [];

        const reqQuery = { ...request.query };

        const objectsToRemoveFromQuery = ['select', 'sort', 'page', 'limit'];
        // This removal is done for query formatting to get rid of slect and such words which are not part of the model.
        objectsToRemoveFromQuery.forEach(
            (eachObject) => delete reqQuery[eachObject] // here reqQuery.eachObject didnot work
        );

        // This generally gives jason of the query in url like ?ssss&daf and express formats as objects
        let queryString = JSON.stringify(reqQuery);
        // If any of these are found just add a $ symbol before it so that it becomes a mongo query.
        queryString = queryString.replace(
            /\b(lte|lt|gte|gt|in|eq)\b/g,
            (match) => `$${match}`
        );

        const queryObject = JSON.parse(queryString);

        if (queryObject.duration !== undefined) {
            console.log(queryObject.duration);
            if (Array.isArray(queryObject.duration.$lte)) {
                queryObject.duration.$lte = Math.max(
                    ...queryObject.duration.$lte
                );
            }
            if (Array.isArray(queryObject.duration.$gte)) {
                queryObject.duration.$gte = Math.min(
                    ...queryObject.duration.$gte
                );
            }
            console.log(queryObject.duration);
        }

        console.log(queryObject);

        if (request.params.category) {
            if (modelType === 'bootcamp') {
                const courses = await Course.find({
                    category: request.params.category,
                });
                bootcampIds = courses.map((course) => course.bootcamp);
                console.log(bootcampIds);
                queryObject._id = { $in: bootcampIds };
            }
            if (modelType === 'course') {
                queryObject.category = { $eq: request.params.category };
            }
        }

        console.log(queryObject);
        query = model.find(queryObject);

        // query = query.find({ id: { $in: bootcampIds } });

        //.populate({
        // path: 'courses', // This will not work until virtuals are used. because, the course doesnot have a ref to this bootcamp model
        // // select: 'title',   // Can add selects in case of reverse population using virtuals also
        // populate, // This is passed for reusability
        // });
        // To use above populate for resusing we may need to check if the populate is passed or not.
        if (populate) {
            query = query.populate(populate); // Populate is created in controller and passed accordingly
        }

        if (request.query.select) {
            const fields = request.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        if (request.query.sort) {
            const sortBy = request.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        const pagination = {
            prev: null,
            next: null,
        };
        let pageNumber = Number(request.query.page) || 1;
        let limit = Number(request.query.limit) || 5;
        console.log(`limit : ${limit}`.yellow);
        let toSkip = (pageNumber - 1) * limit;
        let startIndex = (pageNumber - 1) * limit;
        let endIndex = pageNumber * limit;

        let tempResult = await query;
        console.log(`result length before page : ${tempResult.length}`.yellow);

        query = query.skip(toSkip).limit(limit);

        let results = await query;

        const totalNoOfDocuments = tempResult.length;
        if (startIndex > 0) {
            pagination.prev = pageNumber - 1;
        }
        if (endIndex < totalNoOfDocuments) {
            pagination.next = pageNumber + 1;
        }

        if (!results) {
            return next(err);
        }

        response.advancedResults = {
            success: true,
            count: tempResult.length,
            pagination,
            data: results,
            error: false,
        };

        next();
    };
};

module.exports = advancedResults;
