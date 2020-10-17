// 3rd party module
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Must have a title'],
        maxlength: [100, 'cannot exceed 100 characters'],
    },
    review: {
        type: String,
        maxlength: [500, 'Should not exceed 500 characters'],
        required: [true, 'Must add a short or brief description'],
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'please add a rating between  to 5'],
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp', // this is to tell that this is a reference to another model (Bootcamp model)
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
    }, // Either bootcamp or course needs to be associated for a review
    user: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'must have associated user'],
        ref: 'User',
        // unique: [true, 'only 1 review is allowed per user'], User along with course or bootcamp should be unique
        // This is done using compound indexing after the schema declaration.
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

ReviewSchema.index({ bootcamp: 1, course: 1, user: 1 }, { unique: true });
// ReviewSchema.index({ course: 1, user: 1 }, { unique: true });

ReviewSchema.statics.getAverageRating = async function (bootcampId, courseId) {
    if (bootcampId) {
        const aggregateObj = await this.aggregate([
            { $match: { bootcamp: bootcampId } }, // match and group are part of mongo aggregate stages. Refer docs of MongoDB
            {
                $group: {
                    _id: '$bootcamp',
                    averageRating: { $avg: '$rating' },
                },
            },
        ]);
        console.log('getting average rating'.blue.inverse);
        console.log(aggregateObj);
        try {
            await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
                averageRating: Number(
                    aggregateObj[0].averageRating.toPrecision(2)
                ),
            });
        } catch (err) {
            console.log(err);
        }
    }
    if (courseId) {
        const aggregateObj = await this.aggregate([
            { $match: { course: courseId } }, // match and group are part of mongo aggregate stages. Refer docs of MongoDB
            { $group: { _id: '$course', averageRating: { $avg: '$rating' } } },
        ]);
        console.log('getting average rating'.blue.inverse);
        console.log(aggregateObj);
        try {
            await this.model('Course').findByIdAndUpdate(courseId, {
                averageRating: Number(
                    aggregateObj[0].averageRating.toPrecision(2)
                ),
            });
        } catch (err) {
            console.log(err);
        }
    }
};
ReviewSchema.statics.getBootcampRatingCount = async function (bootcampId) {
    const aggregateObj = await this.aggregate([
        { $match: { bootcamp: bootcampId } },
        { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    console.log('getting average rating'.yellow.inverse);
    console.log(aggregateObj[0].count);
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            ratings: aggregateObj[0].count,
        });
    } catch (err) {
        console.log(err);
    }
};
ReviewSchema.statics.getCourseRatingCount = async function (courseId) {
    const aggregateObj = await this.aggregate([
        { $match: { course: courseId } },
        { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    console.log('getting average rating'.yellow.inverse);
    console.log(aggregateObj[0].count);
    try {
        await this.model('Course').findByIdAndUpdate(courseId, {
            ratings: aggregateObj[0].count,
        });
    } catch (err) {
        console.log(err);
    }
};

ReviewSchema.pre('save', async function (next) {
    if (this.bootcamp || this.course) {
        next();
    } else {
        throw new Error(
            'review needs to be associated with either a course or a bootcamp'
        );
    }
});
ReviewSchema.post('save', async function (dummyDoc, next) {
    await this.constructor.getAverageRating(this.bootcamp, this.course);
    next();
});
ReviewSchema.post('save', async function (dummyDoc, next) {
    await this.constructor.getBootcampRatingCount(this.bootcamp);
    next();
});
ReviewSchema.post('save', async function (dummyDoc, next) {
    await this.constructor.getCourseRatingCount(this.course);
    next();
});
ReviewSchema.pre('remove', async function (next) {
    await this.constructor.getAverageRating(this.bootcamp, this.course);
    next();
});

module.exports = mongoose.model('Review', ReviewSchema);
