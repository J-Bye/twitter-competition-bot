const mongo = require('mongodb')
const dotenv = require('dotenv');

dotenv.config();

async function connectToCluster() {
    let mongoClient = mongo.MongoClient;
 
    try {
        mongoClient = new mongoClient(process.env.MONGODB_URI);
        console.log('Connecting to external database...');
        await mongoClient.connect();
        console.log('Successfully connected to the MongoDB Atlas data engine!');
 
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
 }

 module.exports = {connectToCluster}