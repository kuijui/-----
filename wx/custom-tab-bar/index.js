Component({
  data: {
    selected: 'pages/index/index',
    tabs: [
      { path: 'pages/index/index', icon: '✨', label: '生成' },
      { path: 'pages/user/user', icon: '👤', label: '我的' }
    ]
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: `/${path}` });
    }
  }
});
