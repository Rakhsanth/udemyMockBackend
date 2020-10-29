const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
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

const Profile = mongoose.model('Profile', profileSchema);
