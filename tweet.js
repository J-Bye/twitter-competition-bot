import rwClient from "./twitterClient.js";
import User from './user.js';
import config from "./config.js";

export default class Tweet {
    constructor(tweet){
        this.tweet = tweet,
        this.sensitiveContent = tweet.possibly_sensitive
    }

    //Getters
    get shouldFollowUser(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('follow')
    }
    
    get shouldRetweet(){
        let tweetToSearch = this.tweet.text.toLowerCase();
        return tweetToSearch.includes('retweet') ||
               tweetToSearch.includes('share') ||
               tweetToSearch.includes(' rt')
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

    //Functions
    async process(){
        let followed = false;
        let liked = false;
        let retweeted = false;
        let friendsTagged = false;

        const loggedInUser = await rwClient.currentUserV2();
        const user = new User(loggedInUser);
    
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

        //THIS HAS BEEN TURNED OFF DUE TO TWITTER API LIMITATIONS
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
            FriendsTagged: ${friendsTagged} <- TEMPORARILY UNAVAILABLE`);
            const entered = liked || followed || retweeted || friendsTagged
            return entered;
    }    

    
}