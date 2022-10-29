import rwClient from "./twitterClient.js";
import config from "./config.js";
import Tweet from './tweet.js';
import { connectToCluster } from "./databaseClient.js";

//Main startup method
start()

async function start(){
    let tweets = []
        try{
            //Connect with database to retrieve which tweets have been entered
            const enteredCompetitionTweetIds = [];
            const mongoClient = await connectToCluster();
            const db = mongoClient.db('twitter-competitions');
            const savedTweets = db.collection('tweets');
            const databaseTweetCursor = await savedTweets.find();
            await databaseTweetCursor.forEach((tweet)=>{enteredCompetitionTweetIds.push(tweet.tweetId)})

            //Search Twitter API for new competition tweets
            tweets = await findTweets()
            const foundTweets = await tweets.data;

            //Remove already entered competitions from search results
            const tweetsToAction = foundTweets.data
            .filter((tweet)=>enteredCompetitionTweetIds
            .every((x)=> x != tweet.id))

            //Process competition actions against filtered tweets
            await processTweets(tweetsToAction, savedTweets);

            //Restart process!
            start();

        }
        catch(err){
            console.error(err)
        }

}

async function processTweets(tweets, mongoDbCollection){

    for(let i = 0; i < tweets.length; i++){
        const tweet = new Tweet(tweets[i]);

        //Keep competition entries SFW (as much as possible)
        if(tweet.sensitiveContent){continue};

        //Complete follow, like, retweet, tag actions where applicable
        const processed = await tweet.process();

        //If no actions can be made, skip the tweet!
        if(!processed){
            continue
        }

        //Add successfully entered competition tweets to external database (Heroku wipes data on restart, data is stored in mongo)
        await mongoDbCollection.insertOne({tweetId: tweet.tweet.id, text: tweet.tweet.text});

        //Random wait interval to avoid detection, defined by the config. User information
        const randomNumber = Math.floor(Math.random() * (config.maxRandomWait - 0 + 1) + 0);
        const randomWaitTime = config.minTweetInterval + randomNumber;
        console.log(`
----------------------------------------------------------------
Sleeping for ${(Math.floor(randomWaitTime/1000)/60)} minutes 😴
----------------------------------------------------------------`)
        await new Promise(resolve => setTimeout(resolve, randomWaitTime));
    }
}

function findTweets(){
    //Parse search criteria from config file and return the search promise
    const searchTerms = `"${config.searchItems.join('" OR "')}"`;
    const negativeSearchItems = `-${config.negativeSearchItems.join(' -')}`
    const params = { 'max_results': config.searchRateLimit, 'expansions': 'author_id', 'tweet.fields': 'possibly_sensitive'}
    
    try{
        return rwClient.v2.search(`(${searchTerms}) -is:retweet -is:quote -is:reply ${negativeSearchItems}`, params);;
    } catch (e){
        console.log(e)
    }
    
}


