const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Must have a title'],
        maxlength: [100, 'cannot exceed 200 characters'],
    },
    description: {
        type: String,
        maxlength: [500, 'Should not exceed 500 characters'],
        required: [true, 'Must add a short or brief description'],
    },
    contentList: {
        type: [String],
        // Required cannot be given for arrays so did in pre save middleware
    },
    category: {
        type: String,
        required: [true, 'please provide a category for the course'],
        enum: [
            'development',
            'design',
            'data science',
            'digital marketing',
            'finance',
        ],
    },
    weeks: {
        type: Number,
        required: [true, 'please add course length in number of weeks'],
    },
    cost: {
        type: Number,
        required: [true, 'please add the tuition cost'],
    },
    requirementDescription: {
        type: String,
        required: [true, 'please describe the skills needed'],
    },
    requiredSkillSet: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: [true, 'please select a skill set'],
    },
    duration: {
        type: Number,
        required: [true, 'provide a duration for the course'],
    },
    picture: {
        type: String,
        default: 'no-photo.jpg',
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
    },
    averageRating: {
        type: Number,
        min: [1, 'Average rating cannot be below 1'],
        max: [5, 'average rating cannot exceed 5'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

CourseSchema.statics.getAverageCost = async function (bootcampId) {
    const aggregateObj = await this.aggregate([
        { $match: { bootcamp: bootcampId } }, // match and group are part of mongo aggregate stages. Refer docs of MongoDB
        { $group: { _id: '$bootcamp', averageCost: { $avg: '$cost' } } },
    ]);
    console.log('getting average'.blue.inverse);
    console.log(aggregateObj);
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.floor(aggregateObj[0].averageCost),
        });
    } catch (err) {
        console.log(err);
    }
};

CourseSchema.pre('save', async function (next) {
    if (this.contentList.length === 0) {
        throw new Error(
            'please provide list of major learning contents provided'
        );
    }
    const length = 100;
    this.contentList.forEach((content) => {
        if (content.length > length) {
            throw new Error('Each content cannot exceed 100 characters');
        }
    });
    next();
});
CourseSchema.post('save', async function (dummyDoc, next) {
    await this.constructor.getAverageCost(this.bootcamp);
    next();
});
CourseSchema.pre('remove', async function (next) {
    await this.constructor.getAverageCost(this.bootcamp);
    next();
});

module.exports = mongoose.model('Course', CourseSchema);
