import { Router } from 'express'

import { getProfilePosts, getProfile, followUser, editProfile } from '../controllers/profileController.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

router.post('/edit', editProfile)
router.get('/get', getProfile)
router.post('/follow', followUser)
router.get('/posts', getProfilePosts)

export default router