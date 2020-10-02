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
        required: [true, 'please select an associated bootcamp'],
        ref: 'Bootcamp', // this is to tell that this is a reference to another model (Bootcamp model)
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'must have associated user'],
        ref: 'User',
        unique: [true, 'only 1 review is allowed per user'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

ReviewSchema.statics.getAverageRating = async function (bootcampId) {
    const aggregateObj = await this.aggregate([
        { $match: { bootcamp: bootcampId } }, // match and group are part of mongo aggregate stages. Refer docs of MongoDB
        { $group: { _id: '$bootcamp', averageRating: { $avg: '$rating' } } },
    ]);
    console.log('getting average rating'.blue.inverse);
    console.log(aggregateObj);
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageRating: aggregateObj[0].averageRating,
        });
    } catch (err) {
        console.log(err);
    }
};

ReviewSchema.post('save', async function (dummyDoc, next) {
    await this.constructor.getAverageRating(this.bootcamp);
    next();
});
ReviewSchema.pre('remove', async function (next) {
    await this.constructor.getAverageRating(this.bootcamp);
    next();
});

module.exports = mongoose.model('Review', ReviewSchema);
