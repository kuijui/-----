const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    topic: '',
    description: '',
    selectedStyle: '种草推荐',
    selectedLength: 'medium',
    styles: ['种草推荐', '干货分享', '好物测评', '生活日常', '情感共鸣', '搞笑幽默'],
    lengths: [
      { value: 'short', label: '短文案', desc: '50-100字' },
      { value: 'medium', label: '中文案', desc: '100-200字' },
      { value: 'long', label: '长文案', desc: '200-400字' }
    ],
    hotTopics: ['春季穿搭', '护肤好物', '美食探店', '读书笔记', '旅行攻略'],
    remainingCount: 0,
    dailyLimit: 3,
    generating: false
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 'pages/index/index' });
    }
    if (app.globalData.userInfo) {
      this.updateUserInfo();
    }
  },

  async checkLogin() {
    if (!app.globalData.token) {
      try {
        util.showLoading('登录中...');
        await app.login();
        this.updateUserInfo();
      } catch (error) {
        util.showToast('登录失败，请重试');
      } finally {
        util.hideLoading();
      }
    } else {
      this.updateUserInfo();
    }
  },

  updateUserInfo() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        remainingCount: userInfo.remainingCount || 0,
        dailyLimit: userInfo.dailyLimit || 3
      });
    }
  },

  onTopicInput(e) {
    this.setData({
      topic: e.detail.value
    });
  },

  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  onStyleSelect(e) {
    this.setData({
      selectedStyle: e.currentTarget.dataset.style
    });
  },

  onLengthSelect(e) {
    this.setData({
      selectedLength: e.currentTarget.dataset.length
    });
  },

  onHotTopicTap(e) {
    this.setData({
      topic: e.currentTarget.dataset.topic
    });
  },

  async onGenerate() {
    const { topic, description, selectedStyle, selectedLength, remainingCount } = this.data;

    if (!topic.trim()) {
      util.showToast('请输入主题或关键词');
      return;
    }

    if (remainingCount <= 0) {
      const confirm = await util.showModal('提示', '今日生成次数已用完，是否开通会员？');
      if (confirm) {
        wx.navigateTo({
          url: '/pages/member/member'
        });
      }
      return;
    }

    this.setData({ generating: true });
    util.showLoading('AI正在创作中...');

    try {
      const res = await app.request({
        url: '/content/generate',
        method: 'POST',
        data: {
          topic: topic.trim(),
          description: description.trim(),
          style: selectedStyle,
          length: selectedLength
        }
      });

      if (res.code === 200) {
        util.hideLoading();
        
        this.setData({
          remainingCount: res.data.remainingCount
        });

        if (app.globalData.userInfo) {
          app.globalData.userInfo.remainingCount = res.data.remainingCount;
        }

        wx.navigateTo({
          url: `/pages/result/result?id=${res.data.id}`
        });
      } else {
        util.showToast(res.message || '生成失败');
      }
    } catch (error) {
      console.error('生成失败', error);
      util.showToast(error.message || '生成失败，请重试');
    } finally {
      this.setData({ generating: false });
      util.hideLoading();
    }
  },

  goToMember() {
    wx.navigateTo({
      url: '/pages/member/member'
    });
  }
});
