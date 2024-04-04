import User from '../models/userModel.js'
import Profile from '../models/profileModel.js'
import UserActivity from '../models/userActivityModel.js'
import Comment from '../models/commentModel.js'
import Post from '../models/postModel.js'
import checkInput from '../utils/utils.js'
import { deleteCommentHelper } from './commentController.js'
import { mongoose } from 'mongoose'
import admin from 'firebase-admin'
import { storageBucket } from '../utils/firebase.js'


const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No image file');
      }
      let newFileName = `pictures/${Date.now()}_${file.originalname}`;
  
      let fileUpload = storageBucket.file(newFileName);
  
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });
  
      blobStream.on('error', (error) => {
        reject('Something is wrong! Unable to upload at the moment.');
      });
  
      blobStream.on('finish', () => {
        // After upload, generate a signed URL for read access
        fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-09-2491', // Use a far future date or adjust according to your needs
        })
        .then(signedUrls => {
          // signedUrls[0] contains the URL you can use to publicly access the file
          resolve(signedUrls[0]);
        })
        .catch(error => {
          reject('Failed to obtain signed URL');
        });
      });
  
      blobStream.end(file.buffer);
    });
  };
  
  
  
  export const createPost = async (req, res) => {
      try {
          console.log("IN create post")
          let { title, content, user, ratings, type } = req.body
          // Assuming `images` are passed as an array of Express `req.files` if you're using something like multer for file handling
          const images = req.files; 
  
          const profile = await Profile.findOne({ user })
          if (!profile || profile.deleted) {
              console.log('User does not exist')
              throw Error('User does not exist')
          }

          if (ratings) {
            ratings = JSON.parse(ratings);
          }
  
          // Upload images to Firebase Storage
          let imageUrls = [];
          if(images) {
            const uploadPromises = images.map((image) => uploadImageToStorage(image));
            imageUrls = await Promise.all(uploadPromises);
          }
          
          console.log(imageUrls);
  
          const post = new Post({ title, content, user, images: imageUrls, ratings, type });
          await post.save();
  
          const userActivity = await UserActivity.findOne({ user });
          userActivity.posts.push(post._id);
          await userActivity.save();
  
          res.status(200).json(post);
      } catch (error) {
          console.log(error);
          res.status(401).json({ error: error.message });
      }
  };

  export const getPost = async (req, res) => {
    try {
        const { postID } = req.query;
        const user = req.body.user;
        checkInput(['postID'], req.query);

        const post = await Post.findOne({ _id: postID }).lean(); // Use .lean() for performance, if you don't need a full Mongoose document
        if (!post || post.deleted) {
            throw Error('Post does not exist');
        }

        const profile = await Profile.findOne({ user: user }).lean(); // Assuming 'user' is the ID or unique identifier
        if (!profile) {
            throw Error('Profile does not exist');
        }
        
        post.liked = post.likes && post.likes.map(id => id.toString()).includes(profile.user.toString());
        post.disliked = post.dislikes && post.dislikes.map(id => id.toString()).includes(profile.user.toString());
        post.saved = profile.savedPosts && profile.savedPosts.map(id => id.toString()).includes(post._id.toString());

        res.status(200).json(post);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};



export const deletePost = async (req, res) => {
    try {
        const { postID, user } = req.body;
        checkInput(['postID', 'user'], req.body);

        const post = await deletePostHelper(postID, user);
        if (post.error) {
            throw Error(post.error);
        }

        res.status(200).json( post );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

export const deletePostHelper = async (postID, user) => {
    try {
        const post = await Post.findOne({ _id: postID });
        const userActivity = await UserActivity.findOne({ user });
        if (!post || post.deleted) {
            throw Error('Post does not exist');
        }
        if (!post.user.equals(new mongoose.Types.ObjectId(user))) {
            throw Error('User is not authorized to delete this post');
        } 
        if (!userActivity || userActivity.deleted) {
            throw Error('User activity does not exist');
        }

        post.deleted = true;
        userActivity.posts = userActivity.posts.filter(post => !post.equals(new mongoose.Types.ObjectId(postID)));

        // Update userActivity for the post owner
        await userActivity.save();

        // Find all UserActivities that have liked or disliked this post and remove the like or dislike
        await UserActivity.updateMany(
            {},
            {
                $pull: {
                    likes: postID,
                    dislikes: postID
                }
            }
        );

        await Profile.updateMany(
            {},
            {
                $pull: {
                    savedPosts: postID,
                }
            }
        );

        for (const commentID of post.comments) {
            await deleteCommentHelper(commentID);
        }

        await post.save();

        return post;
    } catch (error) {
        console.log(error);
        return {error: error.message};
    }
}

export const clearPosts = async (req, res) => {
    try {
        const posts = await Post.find({});
        for (const post of posts) {
            await deletePostHelper(post._id, post.user);
        }
        res.status(200).json({ message: 'All posts deleted' });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}


export const likePost = async (req, res) => {
    try {
        const { postID, user } = req.body
        checkInput(['postID', 'user'], req.body);
        
        const post = await Post.findOne({ _id: postID })
        if (!post || post.deleted) {
            throw Error('Post does not exist')
        }
        const userActivity = await UserActivity.findOne({ user })
        if (!userActivity || userActivity.deleted) {
            throw Error('User activity does not exist')
        }
        //if they have already liked remove their like and if they haven't liked it add their like
        if (post.likes.includes(new mongoose.Types.ObjectId(user))) {
            post.likes = post.likes.filter(like => !like.equals(new mongoose.Types.ObjectId(user)))
            userActivity.likes = userActivity.likes.filter(like => !like.equals(new mongoose.Types.ObjectId(postID)))
        } else {
            post.likes.push(user)
            userActivity.likes.push(post._id)
        }
        await post.save()
        await userActivity.save()
        res.status(200).json( post )
    } catch (error) {
        res.status(401).json({ error: error.message })
    }
}

export const dislikePost = async (req, res) => {
    try {
        const { postID, user } = req.body
        checkInput(['postID', 'user'], req.body);
        
        const post = await Post.findOne({
            _id: postID
        })
        if (!post || post.deleted) {
            throw Error('Post does not exist')
        }
        const userActivity = await UserActivity.findOne({ user })
        if (!userActivity || userActivity.deleted) {
            throw Error('User activity does not exist')
        }
        //if they have already liked remove their like and if they haven't liked it add their like
        if (post.dislikes.includes(new mongoose.Types.ObjectId(user))) {
            post.dislikes = post.dislikes.filter(dislike => !dislike.equals(new mongoose.Types.ObjectId(user)))
            userActivity.dislikes = userActivity.dislikes.filter(dislike => !dislike.equals(new mongoose.Types.ObjectId(postID)))
        } else {
            post.dislikes.push(user)
            userActivity.dislikes.push(post._id)
        }
        await post.save()
        await userActivity.save()
        res.status(200).json( post )
    }
    catch (error) {
        res.status(401).json({ error: error.message })
    }
}

export const editPost = async (req, res) => {
    try {
        const { postID, title, content, user } = req.body;
        checkInput(['postID', 'title', 'content', 'user'], req.body);
        const post = await Post.findOne({ _id: postID });
        if (!post || post.deleted) {
            throw Error('Post does not exist');
        }
        if (!post.user.equals(new mongoose.Types.ObjectId(user))) {
            throw Error('User is not authorized to edit this post');
        }
        if(title) post.title = title;
        if(content) post.content = content;
        await post.save();
        res.status(200).json( post );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export const savePost = async (req, res) => {
    try {
        const { postID, user } = req.body;
        checkInput(['postID', 'user'], req.body);
        const post = await Post.findOne({ _id: postID});
        if (!post || post.deleted) {
            throw Error('Post does not exist');
        }
        const profile = await Profile.findOne({ user });
        if (!profile || profile.deleted) {
            throw Error('Profile does not exist');
        }
        if (profile.savedPosts.includes(post._id)) {
            profile.savedPosts = profile.savedPosts.filter(savedPost => !savedPost.equals(post._id));
        } else {
            profile.savedPosts.push(post._id);
        }
        await profile.save();
        res.status(200).json( profile );
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}




