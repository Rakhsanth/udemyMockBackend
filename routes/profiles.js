// 3rd party
const express = require('express');
// custom modules and middlewares
const {
    getProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
} = require('../controllers/profileController');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');
const advancedResults = require('../utils/advancedResults');
// Models
const Profile = require('../models/Profile');

const populate = {
    path: 'user',
    select: 'name email role',
};

const router = express.Router();

router
    .route('/')
    .get(
        protected,
        roleAuthorize('admin'),
        advancedResults(Profile, 'profile', populate)
    )
    .post(
        protected,
        roleAuthorize('user', 'publisher', 'admin'),
        createProfile
    );
router
    .route('/:id')
    .get(protected, roleAuthorize('user', 'publisher', 'admin'), getProfile)
    .put(protected, roleAuthorize('user', 'publisher', 'admin'), updateProfile)
    .delete(
        protected,
        roleAuthorize('user', 'publisher', 'admin'),
        deleteProfile
    );

module.exports = router;
