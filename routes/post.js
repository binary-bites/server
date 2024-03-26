import { Router } from 'express'

import { clearPosts, createPost, deletePost, likePost, dislikePost, editPost, getPost } from '../controllers/postController.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

router.post('/create', createPost)
router.delete('/delete', deletePost)
router.post('/like', likePost)
router.post('/dislike', dislikePost)
router.post('/edit', editPost)
router.get('/get', getPost)
router.delete('/clear', clearPosts)

export default router