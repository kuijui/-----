const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false
  },

  onShow() {
    this.loadCollections(true);
  },

  onPullDownRefresh() {
    this.loadCollections(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadCollections(false);
    }
  },

  async loadCollections(reset = false) {
    if (this.data.loading) return;
    if (!app.globalData.token) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: `/content/collections?page=${page}&pageSize=${this.data.pageSize}`,
        method: 'GET'
      });

      if (res.code === 200) {
        const { list, total } = res.data;
        const formattedList = list.map(item => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 3) : [],
          collected_at: this.formatDate(item.collected_at)
        }));

        const merged = reset ? formattedList : [...this.data.list, ...formattedList];
        this.setData({
          list: merged,
          page: page + 1,
          total,
          noMore: merged.length >= total
        });
      }
    } catch (e) {
      console.error('加载收藏失败', e);
    } finally {
      this.setData({ loading: false });
    }
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/result/result?id=${id}` });
  },

  async uncollect(e) {
    const id = e.currentTarget.dataset.id;
    const confirm = await util.showModal('取消收藏', '确定要取消收藏吗？');
    if (!confirm) return;

    try {
      const res = await app.request({
        url: `/content/${id}/uncollect`,
        method: 'POST'
      });
      if (res.code === 200) {
        this.setData({
          list: this.data.list.filter(item => item.id !== id),
          total: this.data.total - 1
        });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      }
    } catch (e) {
      util.showToast('操作失败，请重试');
    }
  },

  goIndex() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
