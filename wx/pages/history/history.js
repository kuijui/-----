const app = getApp();

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false,
    currentFilter: '',
    filters: [
      { label: '全部', value: '' },
      { label: '种草推荐', value: '种草推荐' },
      { label: '干货分享', value: '干货分享' },
      { label: '好物测评', value: '好物测评' },
      { label: '生活日常', value: '生活日常' },
      { label: '情感共鸣', value: '情感共鸣' },
      { label: '搞笑幽默', value: '搞笑幽默' }
    ]
  },

  onLoad() {
    this.loadHistory(true);
  },

  onPullDownRefresh() {
    this.loadHistory(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadHistory(false);
    }
  },

  async loadHistory(reset = false) {
    if (this.data.loading) return;
    if (!app.globalData.token) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });

    try {
      const params = new URLSearchParams({
        page,
        pageSize: this.data.pageSize
      });
      if (this.data.currentFilter) {
        params.append('style', this.data.currentFilter);
      }

      const res = await app.request({
        url: `/content/history?${params.toString()}`,
        method: 'GET'
      });

      if (res.code === 200) {
        const { list, total } = res.data;
        const formattedList = list.map(item => ({
          ...item,
          created_at: this.formatDate(item.created_at)
        }));

        this.setData({
          list: reset ? formattedList : [...this.data.list, ...formattedList],
          page: page + 1,
          total,
          noMore: (reset ? formattedList : [...this.data.list, ...formattedList]).length >= total
        });
      }
    } catch (e) {
      console.error('加载历史失败', e);
    } finally {
      this.setData({ loading: false });
    }
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  },

  onFilterChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ currentFilter: value, noMore: false });
    this.loadHistory(true);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/result/result?id=${id}` });
  },

  goIndex() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
