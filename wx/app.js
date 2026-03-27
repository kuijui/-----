App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api'
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.checkLoginStatus();
    }
  },

  async checkLoginStatus() {
    try {
      const res = await this.request({
        url: '/auth/userinfo',
        method: 'GET'
      });
      
      if (res.code === 200) {
        this.globalData.userInfo = res.data;
      } else {
        this.clearLoginStatus();
      }
    } catch (error) {
      console.error('检查登录状态失败', error);
      this.clearLoginStatus();
    }
  },

  clearLoginStatus() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
  },

  async login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            try {
              const loginRes = await this.request({
                url: '/auth/login',
                method: 'POST',
                data: { code: res.code }
              });

              if (loginRes.code === 200) {
                this.globalData.token = loginRes.data.token;
                this.globalData.userInfo = loginRes.data.userInfo;
                wx.setStorageSync('token', loginRes.data.token);
                resolve(loginRes.data);
              } else {
                reject(new Error(loginRes.message));
              }
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('获取code失败'));
          }
        },
        fail: reject
      });
    });
  },

  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, header = {} } = options;

      const requestHeader = {
        'Content-Type': 'application/json',
        ...header
      };

      if (this.globalData.token) {
        requestHeader['Authorization'] = `Bearer ${this.globalData.token}`;
      }

      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header: requestHeader,
        success: (res) => {
          if (res.statusCode === 401) {
            this.clearLoginStatus();
            wx.showToast({
              title: '请先登录',
              icon: 'none'
            });
            reject(new Error('未登录'));
          } else if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (error) => {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  }
});
