// 3rd party module
const NodeGeocoder = require('node-geocoder');
const dotenv = require('dotenv');
// core module
const path = require('path');
// custom module
const rootPath = require('../utils/rootPath');

dotenv.config({
    // without this dotenv the environment variables where not fetched.
    path: path.join(rootPath, 'config', 'config.env'),
});

const options = {
    provider: process.env.GEOCODER_PROVIDER,

    // Optional depending on the providers
    //   fetch: customFetchImplementation,
    apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, Google Premier
    formatter: null, // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
