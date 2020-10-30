const mongoose = require('mongoose');
const Pusher = require('pusher');

// Pusher related stuff
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});
const channel = 'courses';

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
    author: {
        type: String,
        default: 'Bootcamp people',
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
    startDate: {
        type: Date,
        required: [true, 'Please provide a starting date for the course'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date for the course'],
    },
    maxStudentsAllowed: {
        type: Number,
        required: [
            true,
            'Please provide the maximum no of students for this course',
        ],
    },
    currentStudentsCount: {
        type: Number,
        default: 0,
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
        default: 0,
    },
    picture: {
        type: String,
        default: 'no-photo.jpg',
    },
    video: {
        type: String,
        default: 'no-video',
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
        default: 1,
        min: [1, 'Average rating cannot be below 1'],
        max: [5, 'average rating cannot exceed 5'],
    },
    ratings: {
        type: Number,
        default: 0,
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
CourseSchema.statics.setCourseDuration = async function (course) {
    try {
        const intervalInMillis =
            course.endDate.getTime() - course.startDate.getTime();
        const noOfDays = intervalInMillis / 24 / 60 / 60 / 1000;
        const duration = Math.round((noOfDays * 1.0) / 30);
        const updatedCourse = await this.findByIdAndUpdate(
            course.id,
            { duration: duration },
            { new: true }
        );
        console.log(updatedCourse);
        return updatedCourse;
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
    if (this.endDate < this.startDate) {
        throw new Error('Course end date cannot be less than start date');
    }
    next();
});
CourseSchema.post('save', async function (updatedDoc, next) {
    await this.constructor.getAverageCost(this.bootcamp);
    const intervalInMillis = this.endDate.getTime() - this.startDate.getTime();
    const noOfDays = intervalInMillis / 24 / 60 / 60 / 1000;
    this.duration = Math.round((noOfDays * 1.0) / 30);
    console.log('Triggered pusher here'.green.bold);
    // console.log(updatedDoc);
    pusher.trigger(channel, 'updated', {
        updatedDoc,
    });
    next();
});
CourseSchema.post('findOneAndUpdate', async function (updatedDoc, next) {
    console.log('Triggered pusher here'.green.bold);
    // console.log(updatedDoc);
    pusher.trigger(channel, 'updated', {
        updatedDoc,
    });
    next();
});
CourseSchema.pre('remove', async function (next) {
    await this.constructor.getAverageCost(this.bootcamp);
    next();
});

module.exports = mongoose.model('Course', CourseSchema);
