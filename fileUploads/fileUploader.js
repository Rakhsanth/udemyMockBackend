// custom module
const googleStorage = require('./cloudStorageInit');
//
const { format } = require('util'); // This was needed to get the GAPI work. Dont know what was the magic

const bucket = googleStorage.bucket('bootcamp-discovery-file-uploads'); // Google cloud bucket name

const uploadImageToGoogleBucket = (file) =>
    new Promise((resolve, reject) => {
        const { name, data } = file;
        const blob = bucket.file(name);
        const blobStream = blob.createWriteStream({
            resumable: false, // need to read docs
        });
        blobStream
            .on('finish', () => {
                const publicUrl = format(
                    `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                );
                resolve(publicUrl);
            })
            .on('error', (err) => {
                // reject(`Unable to upload image, something went wrong`);
                reject(`Something went wrong in google API ${err}`);
            })
            .end(data); // need to read docs
    });

module.exports = {
    uploadImageToGoogleBucket,
};
