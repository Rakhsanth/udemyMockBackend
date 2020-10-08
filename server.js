// 3rd party modules
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fileupload = require('express-fileupload');
const expressMongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const preventXSS = require('xss-clean');
const expressRateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const colors = require('colors');
//core modules
const path = require('path');
//custom modules
const rootPath = require('./utils/rootPath');
const bootcampRoutes = require('./routes/bootcamps');
const courseRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');
const connectDB = require('./config/db');
const mongoErrorHandler = require('./middlewares/mongoErrorHandler');

// configuring environment variables (for process.env using dotenv module)
dotenv.config({
    path: path.join(rootPath, 'config', 'config.env'),
});

// Connect to MongoDB
connectDB();

const app = express();

// Using the body parser from express to parse the body from request without that chunk and buffer thing.
app.use(express.json()); // I think it has the next method so that this can pass to all middlewares

// This will add the cookie parsing functionlity and enables to get get and send cookie on req and res.
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(fileupload()); // File uploading express middleware.

app.use(express.static(path.join(rootPath, 'public')));

app.use(expressMongoSanitize()); // to prevent NOSQL injection

app.use(helmet()); // To add securinty headers

app.use(preventXSS()); // to prevent XSS

// API rate limiting
const rateLimiter = expressRateLimit({
    windowMs: 1 * 60 * 1000, // For 1 minute
    max: process.env.API_LIMIT,
    message: 'exceeded the API limit. Please try after few minutes.',
});
app.use(rateLimiter); // Plugging in the rate limiter

app.use(hpp()); // prevent http parameter pollution

app.use(cors({ credentials: true, origin: ['http://localhost:3000'] })); // Enable CORS (Cross Origin Resource Sharing)

app.use('/api/v1/bootcamps', bootcampRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
// error handling middleware. This recieves the next() from the above router middleware.
app.use(mongoErrorHandler);

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port : ${PORT}`
            .yellow.bold
    );
});

// As we are using async and await, promises with then and err are not handeled so, we can handle them
// globally as below by just logging them for now.
process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error.message}`.red);
    // close server and exit the process.
    server.close(() => {
        // To make our app crash when some promises fail by logging the promise errors
        process.exit(1);
    });
});
