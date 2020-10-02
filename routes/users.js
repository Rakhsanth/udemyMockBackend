// 3rd party module
const express = require('express');
// custom modules
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
} = require('../controllers/usersController');
const User = require('../models/User');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');
const advancedResults = require('../utils/advancedResults');

const router = express.Router();

// These are included here to make this check to all the below routes
router.use(protected);
router.use(roleAuthorize('admin'));

router.route('/').get(advancedResults(User), getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
