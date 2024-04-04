import User from '../models/userModel.js';
import Profile from '../models/profileModel.js';
import UserActivity from '../models/userActivityModel.js';
import Comment from '../models/commentModel.js';
import Post from '../models/postModel.js';
import {checkInput} from '../utils/utils.js';

export const getPosts = async (req, res) => {
    try {
        const { followingFilter, typeFilter, lowRating, highRating, savedFilter, searchQuery } = req.query;
        const user = req.body.user;

        const profile = await Profile.findOne({ user });
        if (!profile || profile.deleted) {
            throw Error('Profile does not exist');
        }

        let matchQuery = { deleted: false };
        if (followingFilter) {
            matchQuery.user = { $in: profile.following };
        }
        if (typeFilter) {
            matchQuery.type = typeFilter;
        }
        if (savedFilter) {
            matchQuery._id = { $in: profile.savedPosts };
        }
        if (searchQuery) {
            // Adding the searchQuery condition to the matchQuery
            matchQuery.$or = [
                { title: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search in title
                { content: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search in content
            ];
        }

        if (lowRating != null && highRating != null) {
            const pipeline = [
                { $match: matchQuery },
                {
                    $project: {
                        user: 1, // Include necessary fields
                        type: 1,
                        averageRating: { $avg: "$ratings.stars" },
                        title: 1,
                        content: 1,
                        date: 1,
                        deleted: 1,
                        likes: 1,
                        dislikes: 1,
                        comments: 1,
                        ratings: 1,
                        images: 1
                    }
                },
                { $match: { averageRating: { $gte: parseFloat(lowRating), $lte: parseFloat(highRating) } } },
                { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                { $sort: { createdAt: -1 } }
            ];

            let posts = await Post.aggregate(pipeline);
            posts = posts.map(post => ({
                ...post,
                liked: post.likes.includes(profile.user),
                disliked: post.dislikes.includes(profile.user),
                saved: profile.savedPosts.includes(post._id)
            }));
            res.status(200).json(posts);
        } else {
            // For simpler queries without rating filter
            let posts = await Post.find(matchQuery).populate('user').sort({ createdAt: -1 }).lean();
            posts = posts.map(post => ({
                ...post,
                liked: post.likes.includes(profile.user),
                disliked: post.dislikes.includes(profile),
                saved: profile.savedPosts.includes(post._id)
            }));
            res.status(200).json(posts);
        }
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
