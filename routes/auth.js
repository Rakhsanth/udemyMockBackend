// 3rd party module
const express = require('express');
// custom modules
const {
    getCurrentUser,
    userRegister,
    userLogin,
    userLogout,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
} = require('../controllers/authController');
const { protected } = require('../middlewares/authMiddlewares');

const router = express.Router();

router.route('/me').get(protected, getCurrentUser);
router.route('/register').post(userRegister);
router.route('/login').post(userLogin);
router.route('/logout').get(protected, userLogout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:resetPasswordToken').put(resetPassword);
router.route('/updateDetails').put(protected, updateDetails);
router.route('/updatePassword').put(protected, updatePassword);

module.exports = router;
