// 3rd party modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// core modules
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is mandatory'],
    },
    email: {
        type: String,
        unique: [true, 'email already exists'],
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'must be a valid email address',
        ],
        required: [true, 'email is mandatory'],
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'password is mandatory'],
        select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    }); // Take a look at docs of jsonwebtoken module for more info on method and options
};

UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetToken = function () {
    // Creating 10 random characters for a reset password
    const resetToken = crypto.randomBytes(10).toString('hex');
    // refer documentation for the parameters and functions
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // setting expiry time to 10 minutes
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
