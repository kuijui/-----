const express = require('express');
const authRoutes = require('./auth.routes');
const contentRoutes = require('./content.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/content', contentRoutes);

module.exports = router;
