const rwClient = require("./twitterClient.js");
const config = require("./config.js");

class User{
    constructor(loggedInUser){
    this.loggedInUserId = loggedInUser.data.id;
    }

    async followUser(userId){
        await this.runFollowPolicy()
        await rwClient.v2.follow(this.loggedInUserId, userId);
    }

    //The bot must follow a FIFO policy once it reaches 2k following due to Twitter restrictions
    async runFollowPolicy(){
        let following = [];
        try{
            const userFollowingPaginater = await rwClient.v2.following(this.loggedInUserId, { asPaginator: true});

            for await (const user of userFollowingPaginater){
                following.push(user);
            }
        }
        
        catch(err){
            throw err;
        }

        if(following.length < config.maxFollowing){
            return
        }

        const userToUnfollow = following.pop();
        if(userToUnfollow){
            return rwClient.v2.unfollow(this.loggedInUserId, userToUnfollow.id);
        }
    }

    //Actions a user can make against a tweet

    async tweet(description){
        try {
            await rwClient.v2.tweet(description)
        } catch (err) {
            throw err;
        }
    }

    async like(tweetId){
        try{
            await rwClient.v2.like(this.loggedInUserId, tweetId)
        }
        catch(err){
            throw err;
        }
    }

    async retweet(tweetId){
        try{
            await rwClient.v2.retweet(this.loggedInUserId, tweetId)
        }
        catch(err){
            throw err;
        }
    }

    async tagFriends(tweetDescription, tweetId){
        const tweetToSearch = tweetDescription.toLowerCase();

        //Attempt to extract single digit number of friends
        let numberOfFriendsToTag = Number(tweetToSearch.split('tag ')[1].split('')[0]);

        //If null (eg. 'a' friend) just tag 1
        if(isNaN(numberOfFriendsToTag)){
            numberOfFriendsToTag = 1;
        }

        //Combine the necessary number of friends to tag into a string
        let usersToTagString = config.friendsToTag
        .slice(0, numberOfFriendsToTag)
        .flatMap((x)=>x.handle)
        .join()
        .replaceAll(',', ' ')

        //Random emoji appends the comment to avoid Twitter ban on duplicate comments
        let comment = `${usersToTagString} 🤞 ${this.getRandomEmoji()}`
        return await this.commentOnTweet(comment, tweetId)
    }

    async commentOnTweet(comment, tweetId){
        return await rwClient.v2.reply(
            comment,
            tweetId,
          );
    }

    //Can be used to make a tweet appear unique when tagging the same users repetitively
    getRandomEmoji(){
        const emojis = config.emojis;
        return emojis[Math.floor(Math.random()*emojis.length)]
    }

}

module.exports = User