// 3rd party modules
const express = require('express');
// custom modules
const {
    getBootcamps,
    getBootcamp,
    postBootcamps,
    putBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    uploadBootcampImage,
} = require('../controllers/bootcampsController');
const coursesRouter = require('./courses');
const reviewsRouter = require('./reviews');
const advancedResults = require('../utils/advancedResults');
const Bootcamp = require('../models/Bootcamp');
const Course = require('../models/Course');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');

const router = express.Router();

// Now the concept of resourse routing. Here the course route have /bootcamps/:bootcampId/courses
// This need to be handled as a courses route but as it has bootcamps in url it will come here by default
// To route it back to courses we can use this concept
router.use('/:bootcampId/courses', coursesRouter); // When I tried get instead of use, it failed
router.use('/:bootcampId/reviews', reviewsRouter);

router
    .route('/')
    .get(advancedResults(Bootcamp, 'bootcamp', 'courses'), getBootcamps)
    .post(protected, roleAuthorize('publisher', 'admin'), postBootcamps);

router
    .route('/category/:category')
    .get(advancedResults(Bootcamp, 'bootcamp', 'courses'), getBootcamps);

router
    .route('/:id')
    .get(getBootcamp)
    .put(protected, roleAuthorize('publisher', 'admin'), putBootcamp)
    .delete(protected, roleAuthorize('publisher', 'admin'), deleteBootcamp);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
    .route('/:id/photo')
    .put(protected, roleAuthorize('publisher', 'admin'), uploadBootcampImage);

module.exports = router;
