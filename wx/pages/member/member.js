const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    plans: [
      {
        id: 'monthly',
        name: '月度会员',
        price: '9.9',
        unit: '月',
        origin: '29.9',
        dailyLimit: 30,
        hot: false
      },
      {
        id: 'yearly',
        name: '年度会员',
        price: '68',
        unit: '年',
        origin: '119',
        dailyLimit: 100,
        hot: true
      }
    ],
    benefits: [
      '每日生成次数大幅提升',
      '解锁全部6种文案风格',
      '历史记录无限保存',
      '优先使用最新AI模型',
      '专属客服服务'
    ],
    selectedPlan: 'yearly',
    currentPrice: '68',
    paying: false,
    currentPlan: '',
    expireDate: ''
  },

  onLoad() {
    this.loadMemberStatus();
  },

  selectPlan(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.plans.find(p => p.id === id);
    this.setData({ selectedPlan: id, currentPrice: plan.price });
  },

  async loadMemberStatus() {
    if (!app.globalData.token) return;
    try {
      const res = await app.request({ url: '/auth/userinfo', method: 'GET' });
      if (res.code === 200 && res.data.memberInfo) {
        const m = res.data.memberInfo;
        this.setData({
          currentPlan: m.member_type === 'monthly' ? '月度会员' : '年度会员',
          expireDate: m.expire_at ? new Date(m.expire_at).toLocaleDateString('zh-CN') : '永久'
        });
      }
    } catch (e) {
      console.error('加载会员状态失败', e);
    }
  },

  async onPurchase() {
    if (!app.globalData.token) {
      try {
        util.showLoading('登录中...');
        await app.login();
        util.hideLoading();
      } catch (e) {
        util.showToast('请先登录');
        return;
      }
    }

    const { selectedPlan, plans } = this.data;
    const plan = plans.find(p => p.id === selectedPlan);

    wx.showModal({
      title: '确认购买',
      content: `${plan.name} ¥${plan.price}，每日可生成${plan.dailyLimit}次`,
      success: async (res) => {
        if (!res.confirm) return;

        this.setData({ paying: true });
        try {
          const orderRes = await app.request({
            url: '/member/purchase',
            method: 'POST',
            data: { planId: selectedPlan }
          });

          if (orderRes.code === 200) {
            wx.requestPayment({
              ...orderRes.data,
              success: () => {
                wx.showToast({ title: '开通成功！', icon: 'success' });
                setTimeout(() => wx.navigateBack(), 1500);
              },
              fail: (err) => {
                if (err.errMsg !== 'requestPayment:fail cancel') {
                  util.showToast('支付失败，请重试');
                }
              }
            });
          } else {
            util.showToast(orderRes.message || '创建订单失败');
          }
        } catch (e) {
          util.showToast('网络错误，请重试');
        } finally {
          this.setData({ paying: false });
        }
      }
    });
  }
});
