import mongodb, { MongoClient } from 'mongodb'
import dotenv from 'dotenv';
dotenv.config();

// const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

export async function connectToCluster() {
    let mongoClient;
 
    try {
        mongoClient = new MongoClient(process.env.MONGODB_URI);
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB Atlas!');
 
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
 }