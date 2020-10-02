const advancedResults = (model, populate) => {
    return async (request, response, next) => {
        let query;

        const reqQuery = { ...request.query };

        const objectsToRemoveFromQuery = ['select', 'sort', 'page'];
        // This removal is done for query formatting to get rid of slect and such words which are not part of the model.
        objectsToRemoveFromQuery.forEach(
            (eachObject) => delete reqQuery[eachObject] // here reqQuery.eachObject didnot work
        );

        // This generally gives jason of the query in url like ?ssss&daf and express formats as objects
        let queryString = JSON.stringify(reqQuery);
        // If any of these are found just add a $ symbol before it so that it becomes a mongo query.
        queryString = queryString.replace(
            /\b(lte|lt|gte|gt|in)\b/g,
            (match) => `$${match}`
        );
        query = model.find(JSON.parse(queryString)); //.populate({
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
        let limit = 2;
        let toSkip = (pageNumber - 1) * limit;
        let startIndex = (pageNumber - 1) * limit;
        let endIndex = pageNumber * limit;

        const tempResult = await query;
        query = query.skip(toSkip).limit(limit);

        const results = await query;

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
            count: results.length,
            pagination,
            data: results,
            error: false,
        };

        next();
    };
};

module.exports = advancedResults;
