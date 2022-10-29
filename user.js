import rwClient from "./twitterClient.js";
import config from "./config.js";

export default class User{
    constructor(loggedInUser){
    this.loggedInUserId = loggedInUser.data.id;
    }

    async followUser(userId){
        await this.runFollowPolicy()
        // await rwClient.v2.follow(this.loggedInUserId, userId);
    }

    async runFollowPolicy(){
        let following = [];
        try{
            const userFollowingPagnited1 = await rwClient.v2.following(this.loggedInUserId, { asPaginator: true, max_results: 1000});
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
        if(following.length < 2000){
            return
        }

        const userToUnfollow = following.pop();
        if(userToUnfollow){
            console.log(userToUnfollow.id);
            return rwClient.v2.unfollow(this.loggedInUserId, userToUnfollow.id);
        }
    }

    async tweet(description){
        try {
            await rwClient.v2.tweet(description)
        } catch (e) {
            console.error(e)
        }
    }

    async like(tweetId){
        try{
            await rwClient.v2.like(this.loggedInUserId, tweetId)
        }
        catch(err){
            console.error(err)
        }
    }

    async retweet(tweetId){
        try{
            await rwClient.v2.retweet(this.loggedInUserId, tweetId)
        }
        catch(err){
            console.error(err)
        }
    }

    async tagFriends(tweetDescription, tweetId){
        const tweetToSearch = tweetDescription.toLowerCase();

        //Attempt to extract single digit number of friends. If null (eg. 'a' friend) just tag
        let numberOfFriendsToTag = Number(tweetToSearch.split('tag ')[1].split('')[0]);

        if(isNaN(numberOfFriendsToTag)){
            numberOfFriendsToTag = 1;
        }

        //Combine list of friends and combine into a string of required length
        let usersToTagString = config.friendsToTag
        .slice(0, numberOfFriendsToTag)
        .flatMap((x)=>x.handle)
        .join()
        .replaceAll(',', ' ')

        let comment = `${usersToTagString} 🤞 ${this.getRandomEmoji()}`
        return await this.commentOnTweet(comment, tweetId)
    }

    async commentOnTweet(comment, tweetId){
        return await rwClient.v2.reply(
            comment,
            tweetId,
          );
    }

    getRandomEmoji(){
        const emojis = config.emojis;
        return emojis[Math.floor(Math.random()*emojis.length)]
    }

}