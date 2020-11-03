// 3rd party modules
const express = require('express');
// custom modules
const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
} = require('../controllers//reviewsController');
const advancedResults = require('../utils/advancedResults');
const advancedResultsReviews = require('../utils/advancedResultsReviews');
const Review = require('../models/Review');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');

// Contructing populate for reusable advancedResults middleware
const populate = [
    { path: 'course', select: 'title' },
    { path: 'user', select: 'name' },
];

// This is needed as we get url re-routing from bootcamps router
const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(advancedResultsReviews(populate), getReviews)
    .post(protected, roleAuthorize('user'), addReview);
router
    .route('/:id')
    .get(getReview)
    .put(protected, roleAuthorize('user'), updateReview)
    .delete(protected, roleAuthorize('user'), deleteReview);

module.exports = router;
