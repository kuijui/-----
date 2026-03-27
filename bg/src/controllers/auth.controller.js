const wechatService = require('../services/wechat.service');
const userService = require('../services/user.service');
const JwtUtil = require('../utils/jwt');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  async login(req, res) {
    try {
      const { code } = req.body;

      if (!code) {
        return ApiResponse.badRequest(res, 'code不能为空');
      }

      const wxData = await wechatService.code2Session(code);

      let user = await userService.findByOpenid(wxData.openid);

      if (!user) {
        const userId = await userService.create({
          openid: wxData.openid,
          unionid: wxData.unionid
        });
        user = await userService.findById(userId);
        logger.info('新用户注册', { userId, openid: wxData.openid });
      } else {
        await userService.updateLastLogin(user.id);
      }

      const token = JwtUtil.generateToken({
        userId: user.id,
        openid: user.openid
      });

      const member = await userService.getMemberInfo(user.id);
      const remainingCount = await userService.getRemainingCount(user.id);

      return ApiResponse.success(res, {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          memberType: member ? member.member_type : 'free',
          dailyLimit: member ? member.daily_limit : user.daily_free_count,
          remainingCount,
          totalGenerated: user.total_generated,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      logger.error('登录失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async getUserInfo(req, res) {
    try {
      const { userId } = req.user;

      const user = await userService.findById(userId);
      if (!user) {
        return ApiResponse.notFound(res, '用户不存在');
      }

      const member = await userService.getMemberInfo(userId);
      const remainingCount = await userService.getRemainingCount(userId);

      return ApiResponse.success(res, {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        memberType: member ? member.member_type : 'free',
        dailyLimit: member ? member.daily_limit : user.daily_free_count,
        remainingCount,
        totalGenerated: user.total_generated,
        memberExpireAt: member ? member.expire_at : null
      });
    } catch (error) {
      logger.error('获取用户信息失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async updateUserInfo(req, res) {
    try {
      const { userId } = req.user;
      const { nickname, avatar, phone } = req.body;

      await userService.update(userId, { nickname, avatar, phone });

      return ApiResponse.success(res, null, '更新成功');
    } catch (error) {
      logger.error('更新用户信息失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }
}

module.exports = new AuthController();
