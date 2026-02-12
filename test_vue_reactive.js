#!/usr/bin/env node
/**
 * 测试Vue响应式系统和模板渲染
 */

import { chromium } from 'playwright';

async function testVueReactive() {
  console.log('=== 测试Vue响应式系统和模板渲染 ===\n');
  
  let browser, page;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false,
      slowMo: 50
    });
    
    // 创建新页面
    page = await browser.newPage();
    
    // 导航到开发服务器
    await page.goto('http://localhost:4000/');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    console.log('页面加载完成');
    
    // 等待3秒，确保所有资源都已加载
    await page.waitForTimeout(3000);
    
    // 检查Vue实例
    console.log('\n=== 检查Vue实例 ===');
    const vueInstance = await page.evaluate(() => {
      return window.MeeWoo.app;
    });
    console.log(`✓ MeeWoo.app是否存在: ${vueInstance !== null}`);
    
    // 检查Vue组件注册
    const componentRegistered = await page.evaluate(() => {
      return typeof Vue !== 'undefined' && Vue.options.components['dual-channel-panel'] !== undefined;
    });
    console.log(`✓ 双通道面板组件是否注册: ${componentRegistered}`);
    
    // 检查模板是否存在
    const templateExists = await page.evaluate(() => {
      return document.querySelector('#tpl-dual-channel-panel') !== null;
    });
    console.log(`✓ 模板是否存在: ${templateExists}`);
    
    // 检查activeRightPanel的初始值
    const initialActiveRightPanel = await page.evaluate(() => {
      return window.MeeWoo.app.activeRightPanel;
    });
    console.log(`✓ activeRightPanel初始值: ${initialActiveRightPanel}`);
    
    // 测试设置activeRightPanel为dual-channel
    console.log('\n=== 测试设置activeRightPanel ===');
    await page.evaluate(() => {
      window.MeeWoo.app.activeRightPanel = 'dual-channel';
    });
    
    // 等待1秒，让Vue更新DOM
    await page.waitForTimeout(1000);
    
    // 检查activeRightPanel的值是否已更新
    const updatedActiveRightPanel = await page.evaluate(() => {
      return window.MeeWoo.app.activeRightPanel;
    });
    console.log(`✓ activeRightPanel更新后的值: ${updatedActiveRightPanel}`);
    
    // 检查DOM中是否存在dual-channel-panel元素
    const hasDualChannelPanel = await page.evaluate(() => {
      return document.querySelector('dual-channel-panel') !== null;
    });
    console.log(`✓ DOM中是否存在dual-channel-panel元素: ${hasDualChannelPanel}`);
    
    // 检查dual-channel-panel元素的内容
    if (hasDualChannelPanel) {
      const panelContent = await page.evaluate(() => {
        const panel = document.querySelector('dual-channel-panel');
        return panel.innerHTML;
      });
      console.log(`✓ dual-channel-panel元素的内容长度: ${panelContent.length}`);
    }
    
    // 检查Vue的$forceUpdate方法
    console.log('\n=== 测试Vue强制更新 ===');
    await page.evaluate(() => {
      if (window.MeeWoo.app.$forceUpdate) {
        window.MeeWoo.app.$forceUpdate();
        console.log('调用$forceUpdate成功');
      }
    });
    
    // 等待1秒，让Vue更新DOM
    await page.waitForTimeout(1000);
    
    // 再次检查DOM中是否存在dual-channel-panel元素
    const hasDualChannelPanelAfterUpdate = await page.evaluate(() => {
      return document.querySelector('dual-channel-panel') !== null;
    });
    console.log(`✓ 强制更新后DOM中是否存在dual-channel-panel元素: ${hasDualChannelPanelAfterUpdate}`);
    
    // 测试Vue.nextTick
    console.log('\n=== 测试Vue.nextTick ===');
    await page.evaluate(() => {
      return new Promise((resolve) => {
        Vue.nextTick(() => {
          console.log('Vue.nextTick执行成功');
          resolve();
        });
      });
    });
    
    // 等待1秒，让Vue更新DOM
    await page.waitForTimeout(1000);
    
    // 再次检查DOM中是否存在dual-channel-panel元素
    const hasDualChannelPanelAfterNextTick = await page.evaluate(() => {
      return document.querySelector('dual-channel-panel') !== null;
    });
    console.log(`✓ nextTick后DOM中是否存在dual-channel-panel元素: ${hasDualChannelPanelAfterNextTick}`);
    
    // 测试完整的openDualChannelPanel方法
    console.log('\n=== 测试完整的openDualChannelPanel方法 ===');
    await page.evaluate(() => {
      // 设置必要的配置
      window.MeeWoo.app.dualChannelSourceInfo = {
        name: 'test.svga',
        sizeWH: '300x300',
        duration: '3.0s',
        fileSize: '100KB',
        fps: 30,
        typeLabel: 'SVGA'
      };
      
      window.MeeWoo.app.dualChannelConfig = {
        channelMode: 'color-left-alpha-right',
        width: 300,
        height: 300,
        quality: 80,
        fps: 30,
        muted: false
      };
      
      // 调用openDualChannelPanel方法
      window.MeeWoo.app.openDualChannelPanel();
    });
    
    // 等待3秒，让方法执行完成
    await page.waitForTimeout(3000);
    
    // 检查最终结果
    console.log('\n=== 检查最终结果 ===');
    
    // 检查activeRightPanel的值
    const finalActiveRightPanel = await page.evaluate(() => {
      return window.MeeWoo.app.activeRightPanel;
    });
    console.log(`✓ 最终activeRightPanel值: ${finalActiveRightPanel}`);
    
    // 检查DOM中是否存在dual-channel-panel元素
    const finalHasDualChannelPanel = await page.evaluate(() => {
      return document.querySelector('dual-channel-panel') !== null;
    });
    console.log(`✓ 最终DOM中是否存在dual-channel-panel元素: ${finalHasDualChannelPanel}`);
    
    // 检查弹窗是否可见
    if (finalHasDualChannelPanel) {
      const isVisible = await page.evaluate(() => {
        const panel = document.querySelector('dual-channel-panel');
        if (panel) {
          const style = window.getComputedStyle(panel);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }
        return false;
      });
      console.log(`✓ 弹窗是否可见: ${isVisible}`);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 关闭浏览器
    if (browser) {
      await browser.close();
    }
  }
}

// 执行测试
testVueReactive();
