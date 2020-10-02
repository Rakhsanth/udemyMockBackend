// 3rd party modules
const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geoCoder');

const BootcampSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Each bootcamp must have a name'],
            unique: [true, 'Each bootcamp needs to have a unique name'],
            trim: true,
            maxlength: [50, 'Cannot exceed 50 characters'],
        },
        // This will get generated by using middleware for using in frontEnd. Slug is a url friendly string
        slug: String,
        description: {
            type: String,
            required: [true, 'Bootcamp must have description'],
            maxlength: [500, 'Cannot exceet 500 characters'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'User is not associated with this bootcamp'],
        },
        website: {
            type: String,
            match: [
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                'Use a valid URL with http or https',
            ],
        },
        phone: {
            type: String,
            maxlength: [20, 'Phone number cannot be greater than 10 numbers'],
        },
        email: {
            type: String,
            match: [
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                'please enter a valid email address',
            ],
        },
        address: {
            type: String,
            required: [true, 'please provide an address'],
        },
        zipcode: {
            type: Number,
            required: [true, 'Zipcode is mandatory'],
        },
        location: {
            // Will get auto generated using a geocoding concept. The data type is GeoJSON point (Can alos be GeoJSON polygon)
            type: {
                type: String, // Don't do `{ location: { type: String } }`
                enum: ['Point'], // 'location.type' can be 'Point or polygon'
                // required: false, //look at the docs for reference
            },
            coordinates: {
                type: [Number],
                // required: true,
                index: '2dsphere',
            },
            formattedAddress: String,
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String,
        },
        careers: {
            type: [String],
            required: true,
            enum: [
                'web development',
                'native application development',
                'game development',
                'data structures and algorithms',
                'data science',
                'digital marketing',
                'devops',
            ],
        },
        averageRating: {
            type: Number,
            min: [1, 'minimum rating allowed is 1'],
            max: [10, 'maximum rating allowed is 10'],
        },
        averageCost: Number,
        photo: {
            // Link of the iuploaded image
            type: String,
            default: 'no-photo.jpg',
        },
        housing: {
            type: Boolean,
            default: false,
        },
        jobAssistance: {
            type: Boolean,
            default: false,
        },
        jobGuarantee: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

BootcampSchema.pre('save', function (next) {
    // Mongoose tells thet here no arrow function to be used
    this.slug = slugify(this.name, { lower: true });
    next();
});
BootcampSchema.pre('save', async function (next) {
    // Using arrow functions causes this. to behave differently
    let location = await geocoder.geocode(this.zipcode);
    location = location[0];
    this.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        formattedAddress: location.formattedAddress,
        street: location.streetName,
        city: location.city,
        state: location.statecode,
        country: location.country,
        zipCode: location.zipcode,
    };
    // this.address = undefined; // Doing this as once we get the location details the adress is not needed.

    next();
});
// For this to work we should not do findByIdAndDelete or findByIdAndRemove. We need to findById and
// Delete the found document by using remove.
BootcampSchema.pre('remove', async function (next) {
    // this.model is used to get the course model and this.id is used to get the bootcamp model ID
    await this.model('Course').deleteMany({ bootcamp: this.id });
    next();
});

BootcampSchema.virtual('courses', {
    // Courses is the name of the virtual to be shown
    ref: 'Course', // Model name to use as a virtual, (virtuals are used for reverse populating)
    localField: '_id',
    foreignField: 'bootcamp', // This is the field in the courses as a ref
    justOne: false,
}); // This virtual is by best practice to be written at the bottom as written in this file.

module.exports = mongoose.model('Bootcamp', BootcampSchema);
