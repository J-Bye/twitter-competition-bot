import rwClient from "./twitterClient.js";
import fs from 'fs'
import config from "./config.js";
import Tweet from './tweet.js';
 

let enteredCompetitionTweetIds = [];

function findTweets(searchParameters, maxResults){
    try{
        return rwClient.v2.search(`("retweet to enter" OR "like to enter" OR "to enter: like" OR "to enter: follow" OR "competition time") -is:retweet -is:quote -is:reply -furry -NFT -WL -Whitelist -blockchain`, { 'max_results': maxResults, 'expansions': 'author_id', 'tweet.fields': 'possibly_sensitive'});;
    } catch (e){
        console.log(e)
    }
    
}

async function processTweets(tweets){

    const competitionTweetsPromises = []

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

        enteredCompetitionTweetIds.push(tweet.id);

        const tweetIdsString = JSON.stringify(enteredCompetitionTweetIds);
        fs.writeFile('data.json', tweetIdsString, (err) => {
        if (err){
            console.log(err);
        }
        else {
          console.log("Tweet id saved successfully...");
        }
        })
        
        //Twitters rate limit * the current iteration (they each fire off asynchronously) plus a
        //random number, up to 120000 (4 mins in ms) to avoid detection
        const randomNumber = Math.floor(Math.random() * (config.maxRandomWait - 0 + 1) + 0);
        const randomWaitTime = config.minTweetInterval + randomNumber;

        console.log(`Sleeping for ${(Math.floor(randomWaitTime/1000)/60)} minutes 😴`)
        await new Promise(resolve => setTimeout(resolve, randomWaitTime));
    
    }
    console.log(`
    New competitions so far entered: ${tweets.length} ✅
    Total competitions entered: ${enteredCompetitionTweetIds.length} ✅`)

}


async function start(){
    let tweets = []
        try{
            const searchQuery = config.competitionTweetSearchPhrases.join(" OR ")
            tweets = await findTweets(searchQuery, Math.floor(config.searchRateLimit/config.competitionTweetSearchPhrases.length))
            const foundTweets = await tweets.data;
            const rawdata = fs.readFileSync('data.json');
            enteredCompetitionTweetIds = JSON.parse(rawdata);
            const tweetsToAction = foundTweets.data
            .filter((tweet)=>enteredCompetitionTweetIds
            .every((x)=> x != tweet.id))

            await processTweets(tweetsToAction);
            const randomNumber = Math.floor(Math.random() * (3500000 - 0 + 1) + 0);

            await new Promise(resolve => setTimeout(resolve, randomNumber));
            start()

        }
        catch(err){
            console.error(err)
        }

}

start()

