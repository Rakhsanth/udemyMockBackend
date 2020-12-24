// 3rd party modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// core modules
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    thirdParty: {
        type: Boolean,
        required: [true, 'Type of user is mandatory'],
    },
    thirdPartyId: {
        type: String,
        // required if thirdParty is true
    },
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
        // Required validation provided based on 3rd party login/signup
    },
    role: {
        type: String,
        enum: ['user', 'publisher', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        // required: [true, 'password is mandatory'], validation provided based on 3rd party login/signup
        select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    currentCourses: [],
    completedCourses: [],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

// 3rd party users do not need a password or email.
UserSchema.path('thirdPartyId').required(function () {
    return this.thirdParty;
}, 'thirdPartyId is mandatory for thirdParty signed up in users');
UserSchema.path('email').required(function () {
    return !this.thrirdParty;
}, 'email is mandatory for no 3rd party users');
UserSchema.path('password').required(function () {
    return !this.thrirdParty;
}, 'password is mandatory for no 3rd party users');

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

UserSchema.pre('remove', async function (next) {
    await this.model('Profile').deleteMany({ user: this.id });
    next();
});

module.exports = mongoose.model('User', UserSchema);
