// migrated to typescript - works as before, but run with different command
// see run.sh for details

import dotenv from 'dotenv'
dotenv.config()

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import userRoutes from './routes/user.js';
import postRoutes from './routes/post.js';
import commentRoutes from './routes/comment.js';
import profileRoutes from './routes/profile.js';
import userActivityRoutes from './routes/userActivity.js';
import multer from 'multer';

const app = express()
const upload = multer()
app.use(cors());
app.use(upload.any())

// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

app.use('/api/user', userRoutes)
app.use('/api/post', postRoutes)
app.use('/api/comment', commentRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/userActivity', userActivityRoutes)

mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('connected to db & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error)
  })
