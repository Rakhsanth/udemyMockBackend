// 3rd party modules
const express = require('express');
// custom modules
const {
    createOrder,
    confirmPayment,
} = require('../controllers/paymentController');
const { protected, roleAuthorize } = require('../middlewares/authMiddlewares');

const router = express.Router();

router
    .route('/order/:amount')
    .get(protected, roleAuthorize('user'), createOrder);
router.route('/confirm').post(protected, roleAuthorize('user'), confirmPayment);

module.exports = router;
