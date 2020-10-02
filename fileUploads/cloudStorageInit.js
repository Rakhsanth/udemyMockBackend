// 3rd party module
const { Storage } = require('@google-cloud/storage');
// core module
const path = require('path');
const rootPath = require('../utils/rootPath');

const serviceKey = path.join(
    rootPath,
    'fileUploads',
    'discoverbootcamps-9d619f27910a.json'
);

const storage = new Storage({
    keyFilename: serviceKey,
    projectId: 'your project id',
});

module.exports = storage;
