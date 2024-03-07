import {Schema, model, Types} from 'mongoose';

// modified to support ts from: https://mongoosejs.com/docs/typescript.html


const postSchema = new Schema ({
    title: {
      type: String,
      required: true,
    },
    content: { type: String, default: ""},
    date: { type: Date, default: Date.now},
    deleted: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    ratings: {
        type: [
            {
                ratingType: { type: String, default: null },
                stars: { type: Number, default: 0.0 },
            }
        ],
        default: [] 
    },
    images: [{ type: String, default: [] }],
});

export default model('Post', postSchema)
