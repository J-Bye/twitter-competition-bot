import rwClient from "./twitterClient.js";
import config from "./config.js";
import Tweet from './tweet.js';
import { connectToCluster } from "./databaseClient.js";


function findTweets(){
    const maxResults = config.searchRateLimit;

    const searchTerms = `"${config.searchItems.join('" OR "')}"`;
    const negativeSearchItems = `-${config.negativeSearchItems.join(' -')}`

    const params = { 'max_results': maxResults, 'expansions': 'author_id', 'tweet.fields': 'possibly_sensitive'}
    try{
        return rwClient.v2.search(`(${searchTerms}) -is:retweet -is:quote -is:reply ${negativeSearchItems}`, params);;
    } catch (e){
        console.log(e)
    }
    
}

async function processTweets(tweets, mongoDbCollection){

    for(let i = 0; i < tweets.length; i++){
        const tweet = new Tweet(tweets[i]);
        //Trying to avoid the masses of furry porn 
        if(tweet.sensitiveContent){continue};

        //Complete follow, like, retweet, tag actions
        const processed = await tweet.process();

        //If no actions could be made, skip the tweet
        if(!processed){
            continue
        }

        //PUSH TO MONGO DB HERE
        await mongoDbCollection.insertOne({tweetId: tweet.tweet.id, text: tweet.tweet.text});

        
        //Twitters rate limit * the current iteration (they each fire off asynchronously) plus a
        //random number, up to 120000 (4 mins in ms) to avoid detection
        const randomNumber = Math.floor(Math.random() * (config.maxRandomWait - 0 + 1) + 0);
        const randomWaitTime = config.minTweetInterval + randomNumber;

        console.log(`
----------------------------------------------------------------
Sleeping for ${(Math.floor(randomWaitTime/1000)/60)} minutes 😴
----------------------------------------------------------------`)
        await new Promise(resolve => setTimeout(resolve, randomWaitTime));
    
    }

}


async function start(){
    let tweets = []
        try{
            const enteredCompetitionTweetIds = [];


                const mongoClient = await connectToCluster();
                const db = mongoClient.db('twitter-competitions');
                const savedTweets = db.collection('tweets');


                const databaseTweetCursor = await savedTweets.find();


                await databaseTweetCursor.forEach((tweet)=>{enteredCompetitionTweetIds.push(tweet.tweetId)})

            tweets = await findTweets()
            const foundTweets = await tweets.data;
           
            const tweetsToAction = foundTweets.data
            .filter((tweet)=>enteredCompetitionTweetIds
            .every((x)=> x != tweet.id))

            await processTweets(tweetsToAction, savedTweets);

            //Restart the process each time
            start();

        }
        catch(err){
            console.error(err)
        }

}

start()

