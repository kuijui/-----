const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { generalLimiter } = require('../middlewares/ratelimit.middleware');

const router = express.Router();

router.post('/login', generalLimiter, authController.login);

router.get('/userinfo', authMiddleware, authController.getUserInfo);

router.put('/userinfo', authMiddleware, authController.updateUserInfo);

module.exports = router;
