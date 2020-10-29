// 3rd party modules
const uuidShort = require('short-uuid');
const Razorpay = require('razorpay');
// core modules
const crypto = require('crypto');
// custom modules
const asyncHandler = require('../middlewares/asyncMiddlewareHandler');
const ErrorResponse = require('../utils/error');

const instance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});

/*
@description: To create a new order
@route: GET /api/v1/payments/order/:amount
@access: private (User)
*/
const createOrder = asyncHandler(async (request, response, next) => {
    const amount = request.params.amount;
    console.log(amount);
    try {
        const options = {
            amount: Number(amount) * 100, // As razorpay wants like Rs 10.00 as 1000
            currency: 'INR',
            receipt: `pymt_${uuidShort.generate()}`,
            payment_capture: 1, // 1 for automatic capture // 0 for manual capture
        };
        console.log(options);
        const razorpayResponse = await instance.orders.create(options);
        console.log(razorpayResponse);
        response.status(200).json({
            success: true,
            data: {
                id: razorpayResponse.id,
                currency: razorpayResponse.currency,
                amount: razorpayResponse.amount,
            },
        });
    } catch (err) {
        console.error(err);
        return response.status(500).json({
            success: false,
            data: err,
            error: true,
        });
    }
});

/*
@description: To capture an order
@route: GET /api/v1/payments/capture/:paymentId/:amount
@access: private (User)
*/
const confirmPayment = asyncHandler(async (request, response, next) => {
    const {
        order_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
    } = request.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET);
    hmac.update(`${order_id}|${razorpay_payment_id}`);

    const generatedSignature = hmac.digest('hex');

    console.log(generatedSignature, razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
        return next(
            new ErrorResponse(
                'Payment not captured or no confirmation received from the bank or walled provider',
                401
            )
        );
    }

    response.status(200).json({
        success: true,
        data: {
            message:
                'payment confirmed and amount is deducted from user successfully',
        },
        error: false,
    });
});

module.exports = {
    createOrder,
    confirmPayment,
};
