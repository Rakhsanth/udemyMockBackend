// 3rd party modules
const express = require('express');
// custom modules
const {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCourseImage,
    uploadCourseVideo,
} = require('../controllers/coursesController');
const advancedResults = require('../utils/advancedResults');
const Course = require('../models/Course');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');
const reviewRouter = require('./reviews');

// Contructing populate for reusable advancedResults middleware
const populate = {
    path: 'bootcamp',
    select: 'name',
};

// This is needed as we get url re-routing from bootcamps router
const router = express.Router({ mergeParams: true });

router.use('/:courseId/reviews', reviewRouter);

router
    .route('/')
    .get(advancedResults(Course, 'course', populate), getCourses)
    .post(protected, roleAuthorize('publisher', 'admin'), addCourse);

router
    .route('/category/:category')
    .get(advancedResults(Course, 'course', populate), getCourses);

router
    .route('/:id')
    .get(getCourse)
    .put(protected, roleAuthorize('user', 'publisher', 'admin'), updateCourse)
    .delete(protected, roleAuthorize('publisher', 'admin'), deleteCourse);

router
    .route('/:id/image')
    .put(protected, roleAuthorize('publisher', 'admin'), uploadCourseImage);

router
    .route('/:id/video')
    .put(protected, roleAuthorize('publisher', 'admin'), uploadCourseVideo);

module.exports = router;
