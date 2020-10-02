// 3rd party module
const dotenv = require('dotenv');
const colors = require('colors');
// core module
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
// custom module
const rootPath = require('./utils/rootPath');
const connectDB = require('./config/db');
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');

dotenv.config({ path: path.join(rootPath, 'config', 'config.env') });

const processExitEvent = new EventEmitter();

connectDB();

let bootcampOperationDone = false;
let courseOperationDone = false;

const importToBootcampsDB = async (bootcamps) => {
    try {
        await Bootcamp.create(bootcamps); // Mongo mongoose command to insert to db.
        bootcampOperationDone = true;
        console.log('DB data are loaded'.green.inverse);
        processExitEvent.emit('exitEvent', 'process completed');
    } catch (err) {
        console.log(err);
    }
};
const deleteBootcampsDBData = async () => {
    try {
        await Bootcamp.deleteMany();
        bootcampOperationDone = true;
        console.log('DB data are destroyed'.red.inverse);
        processExitEvent.emit('exitEvent', 'process completed');
    } catch (err) {
        console.log(err);
    }
};

const importCoursesToDB = async (courses) => {
    try {
        await Course.create(courses);
        courseOperationDone = true;
        console.log('DB data loaded'.green.inverse);
        processExitEvent.emit('exitEvent', 'process completed');
    } catch (err) {
        console.log(err);
    }
};
const deleteCoursesDBData = async () => {
    try {
        await Course.deleteMany();
        courseOperationDone = true;
        console.log('DB data are destroyed'.red.inverse);
        processExitEvent.emit('exitEvent', 'process completed');
    } catch (err) {
        console.log(err);
    }
};

fs.readFile(
    path.join(rootPath, 'testData', 'bootcamps.json'),
    { encoding: 'utf-8' },
    (err, data) => {
        if (err) throw err;
        const bootcamps = JSON.parse(data);
        if (process.argv[2] === '-import') {
            // Getting the variable from the command like args..
            importToBootcampsDB(bootcamps);
        } else if (process.argv[2] === '-delete') {
            deleteBootcampsDBData();
        }
    }
);
fs.readFile(
    path.join(rootPath, 'testData', 'courses.json'),
    { encoding: 'utf-8' },
    (err, data) => {
        if (err) throw err;
        const courses = JSON.parse(data);
        if (process.argv[2] === '-import') {
            // Getting the variable from the command like args..
            importCoursesToDB(courses);
        } else if (process.argv[2] === '-delete') {
            deleteCoursesDBData();
        }
    }
);

processExitEvent.on('exitEvent', (msg) => {
    if (bootcampOperationDone && courseOperationDone) {
        console.log(`${msg}`.yellow.inverse);
        processExitEvent.removeAllListeners('exitEvent');
        process.exit();
    }
});
