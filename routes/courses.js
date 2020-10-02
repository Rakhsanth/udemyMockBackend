// 3rd party modules
const express = require('express');
// custom modules
const {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse,
} = require('../controllers/coursesController');
const advancedResults = require('../utils/advancedResults');
const Course = require('../models/Course');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');

// Contructing populate for reusable advancedResults middleware
const populate = {
    path: 'bootcamp',
    select: 'name careers',
};

// This is needed as we get url re-routing from bootcamps router
const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(advancedResults(Course, populate), getCourses)
    .post(protected, roleAuthorize('publisher', 'admin'), addCourse);
router
    .route('/:id')
    .get(getCourse)
    .put(protected, roleAuthorize('publisher', 'admin'), updateCourse)
    .delete(protected, roleAuthorize('publisher', 'admin'), deleteCourse);

module.exports = router;
