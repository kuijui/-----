require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

app.use('/api', routes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

const server = app.listen(PORT, () => {
  logger.info(`服务器启动成功，端口：${PORT}`);
  logger.info(`环境：${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，准备关闭服务器');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
