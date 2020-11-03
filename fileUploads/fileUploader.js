// custom module
const { imageStorage, videoStorage } = require('./cloudStorageInit');
//
const { format } = require('util'); // This was needed to get the GAPI work. Dont know what was the magic

const imageBucket = imageStorage.bucket('bootcamp-discovery-file-uploads'); // Google cloud bucket name

const uploadImageToGoogleBucket = (file) =>
    new Promise((resolve, reject) => {
        const { name, data } = file;
        const blob = imageBucket.file(name);
        const blobStream = blob.createWriteStream({
            resumable: false, // need to read docs
        });
        blobStream
            .on('finish', () => {
                const publicUrl = format(
                    `https://storage.googleapis.com/${imageBucket.name}/${blob.name}`
                );
                resolve(publicUrl);
            })
            .on('error', (err) => {
                // reject(`Unable to upload image, something went wrong`);
                reject(`Something went wrong in google API ${err}`);
            })
            .end(data); // need to read docs
    });

const videoBucket = videoStorage.bucket('discoverbootcampsvideos'); // Google cloud bucket name

const uploadVideoToGoogleBucket = (file) =>
    new Promise((resolve, reject) => {
        const { name, data, mimetype } = file;
        const blob = videoBucket.file(name);
        console.log('uploeading video to cloud...'.yellow.inverse);
        const blobStream = blob.createWriteStream({
            metadata: { contetType: mimetype },
            resumable: true, // need to read docs
        });
        blobStream
            .on('finish', () => {
                const publicUrl = format(
                    `https://storage.googleapis.com/${videoBucket.name}/${blob.name}`
                );
                resolve(publicUrl);
            })
            .on('error', (err) => {
                // reject(`Unable to upload image, something went wrong`);
                reject(`Something went wrong in google API ${err}`);
            })
            .end(data); // need to read docs
    });

const deleteImageFromBucket = async (fileName) => {
    const file = await imageBucket.file(fileName);
    await file.delete();
};

const deleteVideoFromBucket = async (fileName) => {
    const file = await videoBucket.file(fileName);
    await file.delete();
};

module.exports = {
    uploadImageToGoogleBucket,
    uploadVideoToGoogleBucket,
    deleteImageFromBucket,
    deleteVideoFromBucket,
};
