import { MongoClient } from 'mongodb'
import dotenv from 'dotenv';

dotenv.config();

export async function connectToCluster() {
    let mongoClient;
 
    try {
        mongoClient = new MongoClient(process.env.MONGODB_URI);
        console.log('Connecting to external database...');
        await mongoClient.connect();
        console.log('Successfully connected to the MongoDB Atlas data engine!');
 
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
 }