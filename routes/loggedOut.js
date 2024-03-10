import { Router } from 'express'

import { getPosts, getPost } from '../controllers/loggedOutController.js'

const router = Router()

router.get('/getPosts', getPosts)
router.get('/getPost', getPost)

export default router