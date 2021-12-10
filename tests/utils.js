const { randomBytes } = require('crypto');

const getRandomInt = (max) =>
    Math.floor(Math.random() * Math.floor(max));

exports.getRandomInt = getRandomInt;

const generateFileName = () => 
    `${Date.now()}-${getRandomInt(1000)}.log`;

exports.generateFileName = generateFileName;

const generateFile = (maxSize = 524288) => ({
    name: generateFileName(),
    data: randomBytes(getRandomInt(maxSize)),
});

exports.generateFile = generateFile;

exports.delay = (time) => new Promise(resolve => setTimeout(resolve, time));