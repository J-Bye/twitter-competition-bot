const rwClient = require("./twitterClient.js");
const User = require('./user.js');
const config = require('./config')

class Tweet {
    constructor(tweet, loggedInUser){
        this.tweet = tweet,
        this.loggedInUser = loggedInUser,
        this.sensitiveContent = tweet.possibly_sensitive
    }

    //Getters to determine tweet actions
    get shouldFollowUser(){
        const tweetToSearch = this.tweet.text.toLowerCase(); 
        const followIndicators = config.followIndicators;

        return followIndicators.some((li)=> tweetToSearch.includes(li))
    }
    
    get shouldRetweet(){
        const tweetToSearch = this.tweet.text.toLowerCase(); 
        const retweetIndicators = config.retweetIndicators

        return retweetIndicators.some((li)=> tweetToSearch.includes(li))
    }
    
    //Turned off while I figure out how to handle this!
    // get shouldTagFriends(){
    //     let tweetToSearch = this.tweet.text.toLowerCase();
    //     return tweetToSearch.includes('tag') 
    // }

    get shouldLikeTweet(){
        const tweetToSearch = this.tweet.text.toLowerCase(); 
        const likeIndicators = config.likeIndicators

        return likeIndicators.some((li)=> tweetToSearch.includes(li))
    }

    //Find the appropriate actions to perform and execute them, log results.
    async process(){
        let followed = false;
        let liked = false;
        let retweeted = false;
        let friendsTagged = false;

        const user = new User(this.loggedInUser);
    
        if(this.shouldFollowUser){
            await user.followUser(this.tweet.author_id)
            followed = true;
        }
    
        if(this.shouldLikeTweet){
            await user.like(this.tweet.id)
            liked = true;
        }
    
        if(this.shouldRetweet){
            await user.retweet(this.tweet.id)
            retweeted = true;
        }

        //THIS HAS BEEN TURNED OFF DUE TO TWITTER A BAN ON BOTS MENTIONING USERS

        // if(this.shouldTagFriends){
        //     await user.tagFriends(this.tweet.text, this.tweet.id)
        //     friendsTagged = true;
        // }

        console.log(
`Tweet: ${this.tweet.text}
----------------------------------------------------------------
ACTIONS TAKEN:
Liked: ${liked}
Followed: ${followed}
Retweeted: ${retweeted}
FriendsTagged: ${friendsTagged}
${new Date()}`);
            const entered = liked || followed || retweeted || friendsTagged
const currentDate = new Date().toISOString()
            return {
                processed: entered,
                tweetId: this.tweet.id, 
                dateProcessed: currentDate, 
                liked: liked, 
                followed: followed, 
                retweeted: retweeted, 
                friendsTagged: friendsTagged
            };
    }    

    
}

module.exports = Tweet