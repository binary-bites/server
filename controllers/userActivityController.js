import User from '../models/userModel.js'
import Profile from '../models/profileModel.js'
import UserActivity from '../models/userActivityModel.js'
import Comment from '../models/commentModel.js'
import Post from '../models/postModel.js'
import checkInput from '../utils/utils.js'

export const getPosts = async (req, res) => {
    try {
        const { followingFilter, typeFilter, lowRating, highRating } = req.query;
        const user = req.body.user
        // Initial base query - posts that are not deleted
        let matchQuery = { deleted: false };

        // If followingFilter is true, adjust the query to include only the posts from following users
        if (followingFilter) {
            const profile = await Profile.findOne({ user });
            if (!profile || profile.deleted) {
                throw Error('Profile does not exist');
            }
            matchQuery.user = { $in: profile.following };
        }

        // If typeFilter is specified (Homemade or Restaurant), adjust the query to include only posts of that type
        if (typeFilter) {
            matchQuery.type = typeFilter; // Assumes typeFilter is either 'Homemade', 'Restaurant', or null
        }

        // If rating filters are specified, we need to handle this in the aggregation pipeline
        if (lowRating != null && highRating != null) {
            const posts = await Post.aggregate([
                { $match: matchQuery },
                {
                    $project: {
                        user: 1, // Include user field in the output
                        type: 1,
                        averageRating: {
                            $avg: "$ratings.stars" // Calculate the average rating
                        },
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
                { 
                    $match: {
                        averageRating: { 
                            $gte: parseFloat(lowRating), 
                            $lte: parseFloat(highRating)
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users', // Adjust based on your collection name
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $sort: { createdAt: -1 } } // Sort by creation date, descending
            ]);
            res.status(200).json(posts);
        } else {
            // If we're not filtering by rating, we can use a simpler query
            let posts = await Post.find(matchQuery).populate('user').sort({ createdAt: -1 });
            res.status(200).json(posts);
        }
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
