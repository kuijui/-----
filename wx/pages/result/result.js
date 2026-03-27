const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    contentId: null,
    content: null,
    selectedTitleIndex: 0,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ contentId: options.id });
      this.loadContent();
    }
  },

  async loadContent() {
    try {
      const res = await app.request({
        url: `/content/${this.data.contentId}`,
        method: 'GET'
      });

      if (res.code === 200) {
        this.setData({
          content: res.data,
          loading: false
        });
      } else {
        util.showToast('加载失败');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载内容失败', error);
      util.showToast('加载失败');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onTitleSelect(e) {
    this.setData({
      selectedTitleIndex: e.currentTarget.dataset.index
    });
  },

  async onCopy() {
    const { content, selectedTitleIndex } = this.data;
    
    const selectedTitle = content.titles[selectedTitleIndex];
    const tags = content.tags.join(' ');
    
    const fullText = `${selectedTitle}\n\n${content.content}\n\n${tags}`;
    
    try {
      await util.copyText(fullText);
    } catch (error) {
      util.showToast('复制失败');
    }
  },

  async onCollect() {
    const { contentId, content } = this.data;
    
    try {
      if (content.is_collected) {
        await app.request({
          url: `/content/${contentId}/collect`,
          method: 'DELETE'
        });
        
        this.setData({
          'content.is_collected': 0
        });
        
        util.showToast('已取消收藏');
      } else {
        await app.request({
          url: `/content/${contentId}/collect`,
          method: 'POST'
        });
        
        this.setData({
          'content.is_collected': 1
        });
        
        util.showToast('收藏成功', 'success');
      }
    } catch (error) {
      util.showToast('操作失败');
    }
  },

  onRegenerate() {
    wx.navigateBack();
  }
});
