// 3rd party module
const { Storage } = require('@google-cloud/storage');
// core module
const path = require('path');
const rootPath = require('../utils/rootPath');

const imageServiceKey = path.join(
    rootPath,
    'fileUploads',
    'discoverbootcamps-9d619f27910a.json'
);

const videoServiceKey = path.join(
    rootPath,
    'fileUploads',
    'discoverbootcamps-fed2a36f5133.json'
);

const imageStorage = new Storage({
    keyFilename: imageServiceKey,
    projectId: 'discoverbootcamps',
});

const videoStorage = new Storage({
    keyFilename: videoServiceKey,
    projectId: 'discoverbootcamps',
});

module.exports = {
    imageStorage,
    videoStorage,
};
