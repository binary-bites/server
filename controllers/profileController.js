import User from '../models/userModel.js'
import Profile from '../models/profileModel.js'
import UserActivity from '../models/userActivityModel.js'
import Comment from '../models/commentModel.js'
import Post from '../models/postModel.js'
import checkInput from '../utils/utils.js'

//MAKE PROFILE PICTURE EDIT WORK
export const editProfile = async (req, res) => {
    try {
        const { profilePicture, bio, user } = req.body
        const profile = await Profile.findOne({ user });
        if (!profile) {
            throw Error('Profile does not exist');
        }
        if(bio) profile.bio = bio;
        await profile.save();
        res.status(200).json( profile );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export const getProfile = async (req, res) => {
    try {
        const { otherUser } = req.query
        const user = req.body.user;
        console.log(user, otherUser)
        if (otherUser) {
            const otherUserProfile = await Profile.findOne({ user: otherUser });
            if (!otherUserProfile) {
                throw Error('Profile does not exist');
            }
            return res.status(200).json( otherUserProfile );
        }
        const profile = await Profile.findOne({ user });
        if (!profile) {
            throw Error('Profile does not exist');
        }
        res.status(200).json( profile );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export const followUser = async (req, res) => {
    try {
        const { user, follow } = req.body
        const profile = await Profile.findOne({ user });
        const followProfile = await Profile.findOne({ user: follow });
        if (!profile || !followProfile) {
            throw Error('Profile does not exist');
        }
        if(profile.following.includes(followProfile.user)) {
            console.log("in here")
            profile.following = profile.following.filter(following => !following.equals(followProfile.user));
            followProfile.followers = followProfile.followers.filter(follower => !follower.equals(profile.user));
        } else {
            profile.following.push(followProfile.user);
            followProfile.followers.push(profile.user);
        }
        await profile.save();
        await followProfile.save();
        res.status(200).json( {profile, followProfile} );
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export const getFollowers = async (req, res) => {
    try {
        const { user } = req.query
        const profile = await Profile.findOne({ user });
        if (!profile) {
            throw Error('Profile does not exist');
        }
        const followers = await Profile.find({ user }).populate('followers');
        res.status(200).json( followers );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}
