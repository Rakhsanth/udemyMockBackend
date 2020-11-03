const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        unique: [true, 'Each user can have only one profile created'],
        required: [true, 'Each profile needs to be associated with a user'],
    },
    notifications: {
        type: [
            {
                title: {
                    type: String,
                    required: [true, 'Each notification needs a title'],
                },
            },
        ],
        default: [],
    },
});

module.exports = mongoose.model('Profile', profileSchema);
