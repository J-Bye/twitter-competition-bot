const rwClient = require("./twitterClient.js");
const fs = require("fs");

//Follow rate limit is 50 per 15 minutes
const searchRateLimit = 50;
const friendsToTag = [{
    name: 'Josh',
    twitterId: 1369402574743498755,
    handle: '@hellwaiver'
},
{
    name: 'Kezia',
    twitterId: 1502053576197222404,
    handle: '@baxter_kezia'
},
{
    name: 'Trump',
    twitterId: 950002618163712004,
    handle: '@TheTrumpTaste'
}]

//Based off a limit of 50 follows per 15 minutes.
const minTweetInterval = 240000;

const competitionTweetSearchPhrases = ['retweet to enter', 'like to enter', 'to enter: retweet', 'to enter: follow', 'this tweet to enter'];

let enteredCompetitionTweetIds = [];

async function tweet(description){
    try {
        await rwClient.v2.tweet(description)
    } catch (e) {
        console.error(e)
    }
}

function getRandomEmoji(){
    const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","☺️","😊","😇","🙂","🙃","😉","😌","😍","😘","😗","😙","😚","😋","😜","😝","😛","🤑","🤗","🤓","😎","🤡","🤠","😏",
    "😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","😤","😠","😡","😶","😐","😑","😯","😦","😧","😮","😲","😵","😳","😱","😨","😰","😢","😥","🤤","😭","😓","😪","😴","🙄",
    "🤔","🤥","😬","🤐","🤢","🤧","😷","🤒","🤕","😈","👿","👹","👺","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","👐","🙌","👏","🙏","🤝",
    "👍","👎","👊","✊","🤛","🤜","🤞","✌️","🤘","👌","👈","👉","👆","👇","☝️","✋","🤚","🖐","🖖","👋","🤙","💪","🖕","✍️","🤳","💅","💍","💄","💋","👄","👅","👂","👃","👣","👁",
    "👀", "🧠","🗣","👤","👥","👶","👦","👧","👨","👩","👱‍♀","👱","👴","👵","👲","👳‍♀","👳","👮‍♀","👮","👷‍♀","👷","💂‍♀","💂","🕵️‍♀️","🕵","👩‍⚕","👨‍⚕","👩‍🌾","👨‍🌾","👩‍🍳","👨‍🍳","👩‍🎓","👨‍🎓","👩‍🎤",
    "👨‍🎤","👩‍🏫","👨‍🏫","👩‍🏭","👨‍🏭","👩‍💻","👨‍💻","👩‍💼","👨‍💼","👩‍🔧","👨‍🔧","👩‍🔬","👨‍🔬","👩‍🎨","👨‍🎨","👩‍🚒","👨‍🚒","👩‍✈","👨‍✈","👩‍🚀","👨‍🚀","👩‍⚖","👨‍⚖","🤶","🎅","👸","🤴","👰","🤵","👼","🤰","🙇‍♀","🙇","💁","💁‍♂"
    ,"🙅","🙅‍♂","🙆","🙆‍♂","🙋","🙋‍♂","🤦‍♀","🤦‍♂","🤷‍♀","🤷‍♂","🙎","🙎‍♂","🙍","🙍‍♂","💇","💇‍♂","💆","💆‍♂","🕴","💃","🕺","👯","👯‍♂","🚶‍♀","🚶","🏃‍♀","🏃","👫","👭","👬","💑","👩‍❤️‍👩","👨‍❤️‍👨","💏","👩‍❤️‍💋‍👩",
    "👨‍❤️‍💋‍👨","👪","👨‍👩‍👧","👨‍👩‍👧‍👦","👨‍👩‍👦‍👦","👨‍👩‍👧‍👧","👩‍👩‍👦","👩‍👩‍👧","👩‍👩‍👧‍👦","👩‍👩‍👦‍👦","👩‍👩‍👧‍👧","👨‍👨‍👦","👨‍👨‍👧","👨‍👨‍👧‍👦","👨‍👨‍👦‍👦","👨‍👨‍👧‍👧","👩‍👦","👩‍👧","👩‍👧‍👦","👩‍👦‍👦","👩‍👧‍👧","👨‍👦","👨‍👧","👨‍👧‍👦","👨‍👦‍👦","👨‍👧‍👧","👚","👕","👖","👔","👗","👙","👘","👠","👡",
    "👢","👞","👟","🧣","🧤","🧥","🧦","🧢","👒","🎩","🎓","👑","⛑","🎒","👝","👛","👜","💼","👓","🕶","🌂","☂️"]

    return emojis[Math.floor(Math.random()*emojis.length)]
}
function findTweets(searchParameters, maxResults){
    try{
        return rwClient.v2.search(`("retweet to enter" OR "like to enter" OR "to enter: like" OR "to enter: follow" OR "competition time") -is:retweet -is:quote -is:reply -furry -NFT -WL -Whitelist -blockchain`, { 'max_results': maxResults, 'expansions': 'author_id', 'tweet.fields': 'possibly_sensitive'});;
    } catch (e){
        console.log(e)
    }
    
}

//Using FIFO, we can maintain under 2001 following (and avoid hitting the limit)
async function runFollowPolicy(currentUser){
    let following = [];
    const userId = currentUser.data.id;
    try{
        const userFollowingPagnited1 = await rwClient.v2.following(userId, { asPaginator: true, max_results: 1000});
        following = userFollowingPagnited1.data.data;
        if(userFollowingPagnited1.meta.next_token){
            const userFollowingPagnited2 = await userFollowingPagnited1.fetchNext(1000);
            following = [...following, ...userFollowingPagnited2.data.data];
        }
    }
    catch(err){
        console.error(err)
    }
    //TEST THIS SOON!
    if(following.data.length > 2000){
        return
    }

    const userToUnfollow = following.pop();
    if(userToUnfollow){
        console.log(userToUnfollow.data.id);
        return rwClient.v2.unfollow(currentUser, userToUnfollow.id);
    }
}

function shouldLikeTweet(tweet){
    let tweetToSearch = tweet.toLowerCase();
    return tweetToSearch.includes('like') ||
           tweetToSearch.includes('tweet a like') ||
           tweetToSearch.includes('heart this tweet') ||
           tweetToSearch.includes('like the tweet') ||
           tweetToSearch.includes('favorite this tweet') ||
           tweetToSearch.includes('favourite this tweet') ||
           tweetToSearch.includes('like” this tweet') ||
           tweetToSearch.includes('like and retweet') 

}

async function tagFriends(tweetDescription, tweetId){
    const tweetToSearch = tweetDescription.toLowerCase();

    //Attempt to extract single digit number of friends. If null (eg. 'a' friend) just tag
    let numberOfFriendsToTag = Number(tweetToSearch.split('tag ')[1].split('')[0]);

    if(isNaN(numberOfFriendsToTag)){
        numberOfFriendsToTag = 1;
    }

    //Combine list of friends and combine into a string of required length
    let usersToTagString = friendsToTag
    .slice(0, numberOfFriendsToTag)
    .flatMap((x)=>x.handle)
    .join()
    .replaceAll(',', ' ')

    let comment = `${usersToTagString} 🤞 ${getRandomEmoji()}`
    console.log(comment)
    return await commentOnTweet(comment, tweetId)
}


async function commentOnTweet(comment, tweetId){
    return await rwClient.v2.reply(
        comment,
        tweetId,
      );

}

function shouldFollowUser(tweet){
    let tweetToSearch = tweet.toLowerCase();
    return tweetToSearch.includes('follow')
}

function shouldRetweet(tweet){
    let tweetToSearch = tweet.toLowerCase();
    return tweetToSearch.includes('retweet') ||
           tweetToSearch.includes('share') ||
           tweetToSearch.includes(' rt')
}

function shouldTagFriends(tweet){
    let tweetToSearch = tweet.toLowerCase();
    return tweetToSearch.includes('tag') 
}

async function processTweets(tweets){
    const loggedInUser = await rwClient.currentUserV2();

    const competitionTweetsPromises = []

    for(let i = 0; i < tweets.length; i++){
        let tweet = tweets[i];
        //Trying to avoid the masses of furry porn 
        if(tweet.possibly_sensitive){continue};

        //Complete follow, like, retweet, tag actions
        const competitionEntered = await processTweet(tweet, loggedInUser);
        //If no actions could be made, skip the tweet
        if(!competitionEntered){
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
        let maxRandomWait = 120000
        const randomNumber = Math.floor(Math.random() * (maxRandomWait - 0 + 1) + 0);
        const randomWaitTime = minTweetInterval + randomNumber;

        console.log(`Sleeping for ${(Math.floor(randomWaitTime/1000)/60)} minutes 😴
        ___________________________________________________________________________________________________________________________________________________________________`)
        await new Promise(resolve => setTimeout(resolve, randomWaitTime));
    // await Promise.allSettled(competitionTweetsPromises)
    
    }
    console.log(`
    New competitions so far entered: ${tweets.length} ✅
    Total competitions entered: ${enteredCompetitionTweetIds.length} ✅

                             _   _
                            ( | / )
                           __\ Y /,-')
                          (__     .-'
                             |   (
                             [___]
                             |oo |
                           ,' \  |
                          <___/  |
                             |   |
                             |   |
                             |   |
                             |   |
                         _,-/_._  \_
                        |_.-"^  /   \ '''''^"-.,__
                        |     ,/     \          /
                        \,-":;       ;  \-.,_/'
                         ||       |   ;
                         ||       ;   |
                         :\      /    ;
                          \`----'    /
                           '._____.-'
                             | | |
                           __| | |__
                          |    /    |    
                           """"'""""'
`)

}

async function processTweet(tweet, loggedInUser){
    let followed = false;
    let liked = false;
    let retweeted = false;
    let friendsTagged = false;


    if(shouldFollowUser(tweet.text)){
        try{
            // await runFollowPolicy(loggedInUser);
            await rwClient.v2.follow(loggedInUser.data.id, tweet.author_id);
            followed = true;
        }
        catch(err){
            console.error(err)
        }
    }

    if(shouldLikeTweet(tweet.text)){
        try{
            await rwClient.v2.like(loggedInUser.data.id, tweet.id)
            liked = true
        }
        catch(err){
            console.error(err)
        }
    }

    if(shouldRetweet(tweet.text)){
        try{
            await rwClient.v2.retweet(await loggedInUser.data.id, tweet.id)
            retweeted = true;
        }
        catch(err){
            console.error(err)
        }
    }
    console.log(
`Tweet: ${tweet.text}
 -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Liked: ${liked}
 Followed: ${followed}
 Retweeted: ${retweeted}
 FriendsTagged: ${friendsTagged}
_______________________________________________________________________________________________________________________________________________________________________
        `);
        const entered = liked || followed || retweeted || friendsTagged
        return entered;
}
async function start(){

    //Gather tweets based on competitionPhrases and rate limits
    // const phrases = competitionTweetSearchPhrases;
    // const competitionTweets = [];
    // for (const phrase of phrases) {
    let tweets = []
        try{
            const searchQuery = competitionTweetSearchPhrases.join(" OR ")
            tweets = await findTweets(searchQuery, Math.floor(searchRateLimit/competitionTweetSearchPhrases.length))
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
        
   // }

}
//Begin every morning at 8AM
// var job = new CronJob(
// 	'0 8 * * *',
// 	function() {
// 		start();
// 	},
// 	null,
// 	true,
// 	'Europe/London'
// );

// job.start();

start()

