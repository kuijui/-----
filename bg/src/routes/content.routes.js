const express = require('express');
const contentController = require('../controllers/content.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { strictLimiter } = require('../middlewares/ratelimit.middleware');

const router = express.Router();

router.post('/generate', authMiddleware, strictLimiter, contentController.generate);

router.get('/history', authMiddleware, contentController.getHistory);

router.get('/:id', authMiddleware, contentController.getById);

router.post('/:id/collect', authMiddleware, contentController.collect);

router.delete('/:id/collect', authMiddleware, contentController.uncollect);

router.get('/collections/list', authMiddleware, contentController.getCollections);

module.exports = router;
