const axios = require('axios');
const logger = require('../utils/logger');

class WechatService {
  constructor() {
    this.appid = process.env.WECHAT_APPID;
    this.secret = process.env.WECHAT_SECRET;
  }

  async code2Session(code) {
    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: this.appid,
          secret: this.secret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      if (response.data.errcode) {
        throw new Error(response.data.errmsg || '微信登录失败');
      }

      return {
        openid: response.data.openid,
        sessionKey: response.data.session_key,
        unionid: response.data.unionid
      };
    } catch (error) {
      logger.error('微信code2Session失败', error);
      throw new Error('微信登录失败，请重试');
    }
  }
}

module.exports = new WechatService();
