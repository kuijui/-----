const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    stats: {},
    isMember: false,
    expireDate: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 'pages/user/user' });
    }
    this.loadUserInfo();
  },

  async loadUserInfo() {
    if (!app.globalData.token) {
      try {
        await app.login();
      } catch (e) {
        return;
      }
    }

    try {
      const res = await app.request({ url: '/auth/userinfo', method: 'GET' });
      if (res.code === 200) {
        const { userInfo, memberInfo, stats } = res.data;
        app.globalData.userInfo = userInfo;

        this.setData({
          userInfo,
          stats: stats || {},
          isMember: !!memberInfo,
          expireDate: memberInfo ? this.formatExpire(memberInfo.expire_at) : ''
        });
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
    }
  },

  formatExpire(expireAt) {
    if (!expireAt) return '永久';
    return new Date(expireAt).toLocaleDateString('zh-CN');
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goCollection() {
    wx.navigateTo({ url: '/pages/collection/collection' });
  },

  goMember() {
    wx.navigateTo({ url: '/pages/member/member' });
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '请通过微信搜索公众号【AI文案助手】联系客服',
      showCancel: false,
      confirmText: '好的'
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'AI小红书文案生成器 v1.0\n专为小红书博主打造的AI文案神器',
      showCancel: false,
      confirmText: '好的'
    });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus();
          this.setData({ userInfo: {}, stats: {}, isMember: false });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  }
});
