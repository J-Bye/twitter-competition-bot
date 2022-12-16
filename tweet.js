const rwClient = require("./twitterClient.js");
const User = require('./user.js');

class Tweet {
    constructor(tweet, loggedInUser){
        this.tweet = tweet,
        this.loggedInUser = loggedInUser,
        this.sensitiveContent = tweet.possibly_sensitive
    }

    //Getters to determine tweet actions
    get shouldFollowUser(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('follow')
    }
    
    get shouldRetweet(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('retweet') ||
               tweetToSearch.includes('share') ||
               tweetToSearch.includes(' rt') ||
               tweetToSearch.includes('RT')
    }
    
    get shouldTagFriends(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('tag') 
    }

    get shouldLikeTweet(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('like') ||
               tweetToSearch.includes('tweet a like') ||
               tweetToSearch.includes('heart this tweet') ||
               tweetToSearch.includes('like the tweet') ||
               tweetToSearch.includes('favorite this tweet') ||
               tweetToSearch.includes('favourite this tweet') ||
               tweetToSearch.includes('like” this tweet') ||
               tweetToSearch.includes('like and retweet') ||
               tweetToSearch.includes('❤️')
    
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