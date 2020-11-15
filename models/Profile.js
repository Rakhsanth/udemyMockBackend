// 3rd party modules
const mongoose = require('mongoose');
// custom modules
const ErrorResponse = require('../utils/error');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        unique: [true, 'Each user can have only one profile created'],
        required: [true, 'Each profile needs to be associated with a user'],
        ref: 'User',
    },
    unReadCount: {
        type: Number,
        min: [0, 'No of unread notifications cannot be less that 0'],
        default: 0,
    },
    notifications: {
        type: [
            {
                title: {
                    type: String,
                    required: [true, 'Each notification needs a title'],
                },
                description: {
                    type: String,
                    required: [true, 'Each notification needs a description'],
                },
            },
        ],
        default: [],
    },
    picture: {
        type: String,
        default: 'no-photo.jpg',
    },
    name: {
        type: String,
        required: [true, 'Name is required for a profile'],
    },
    resume: {
        type: String,
    },
    websiteLink: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Email is mandatory for a profile'],
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Must be a valid email address',
        ],
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is mandatory for a profile'],
        match: [
            /\d{10}/,
            'Mobile number cannot have characters or numbers lss than 10 digits',
        ],
    },
});

// profileSchema.pre('save', async function (next) {
//     const currentUserDoc = await mongoose.model('User').findById(this.id);
//     const currentUserRole = currentUserDoc.role;
//     if (role === 'publisher' && )
// });
profileSchema.statics.incrementUnRead = async function (profileId) {
    const currentUserProfile = await this.findById(profileId);
    const unReadCount = currentUserProfile.unReadCount + 1;
    const updatedDoc = await this.findByIdAndUpdate(
        profileId,
        { unReadCount },
        { new: true, runValidators: true }
    );
    return updatedDoc;
};

module.exports = mongoose.model('Profile', profileSchema);
