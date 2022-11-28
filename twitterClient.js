import TwitterApi from "twitter-api-v2";
import dotenv from 'dotenv';

dotenv.config();

var twitterClient = TwitterApi.default;
var client = new twitterClient({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
})

const rwClient = client.readWrite

export default rwClient