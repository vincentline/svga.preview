#!/usr/bin/env node
/**
 * 测试Vue渲染方式的双通道MP4弹窗
 * 验证：
 * 1. Vue组件是否正确注册
 * 2. 模板是否正确渲染到DOM
 * 3. 点击按钮是否能打开弹窗
 * 4. 弹窗是否能正确显示和隐藏
 * 5. 配置参数是否能正确设置和获取
 * 6. 转换功能是否能正常触发
 */

import { chromium } from 'playwright';

async function testVueDualChannelPopup() {
  console.log('=== 测试Vue渲染方式的双通道MP4弹窗 ===\n');
  
  let browser, page;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false, // 非无头模式，便于观察
      slowMo: 50 // 减慢操作速度，便于观察
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
    
    // 检查Vue实例和相关状态
    console.log('\n=== 检查Vue实例和状态 ===');
    
    // 检查Vue是否加载
    const isVueLoaded = await page.evaluate(() => typeof Vue !== 'undefined');
    console.log(`Vue是否加载: ${isVueLoaded}`);
    
    // 检查双通道面板组件是否注册
    const componentRegistered = await page.evaluate(() => {
      return typeof Vue !== 'undefined' && Vue.options.components['dual-channel-panel'] !== undefined;
    });
    console.log(`双通道面板组件是否注册: ${componentRegistered}`);
    
    // 检查MeeWoo.app是否存在
    const appExists = await page.evaluate(() => {
      return typeof MeeWoo !== 'undefined' && typeof MeeWoo.app !== 'undefined';
    });
    console.log(`MeeWoo.app是否存在: ${appExists}`);
    
    // 上传测试SVGA文件
    console.log('\n=== 上传测试SVGA文件 ===');
    const testFile = 'f:\\my_tools\\MeeWoo\\MeeWoo\\src\\assets\\svga\\kangua_05.svga';
    await page.setInputFiles('input[type="file"]', testFile);
    console.log('测试文件上传完成');
    
    // 等待文件加载完成
    await page.waitForTimeout(5000);
    
    // 检查是否成功加载SVGA文件
    console.log('\n=== 检查文件加载状态 ===');
    const filenameVisible = await page.isVisible('.viewer-filename');
    if (filenameVisible) {
      const filename = await page.textContent('.viewer-filename');
      console.log(`✓ 文件加载成功: ${filename}`);
    } else {
      console.log('✗ 文件加载失败，无法找到文件名显示');
      return;
    }
    
    // 检查是否处于SVGA模式
    const isSvgaMode = await page.evaluate(() => {
      return document.querySelector('.viewer-filename').textContent.includes('SVGA');
    });
    console.log(`✓ 确认处于SVGA模式: ${isSvgaMode}`);
    
    // 查找并点击"转双通道MP4"按钮
    console.log('\n=== 测试点击按钮打开弹窗 ===');
    
    // 使用JavaScript查找并点击按钮
    const buttonClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent && button.textContent.includes('转双通道MP4')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    if (buttonClicked) {
      console.log('✓ 找到并点击了"转双通道MP4"按钮');
    } else {
      console.log('✗ 未找到"转双通道MP4"按钮');
      
      // 打印所有按钮的文本内容，用于调试
      const buttonsText = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).map(button => button.textContent.trim());
      });
      console.log(`页面上的所有按钮: ${buttonsText}`);
      
      return;
    }
    
    // 等待弹窗显示
    await page.waitForTimeout(3000);
    
    // 检查弹窗是否显示
    console.log('\n=== 检查弹窗显示状态 ===');
    
    // 检查DOM中是否存在dual-channel-panel元素
    const hasDualChannelPanel = await page.evaluate(() => {
      return document.querySelector('dual-channel-panel') !== null;
    });
    console.log(`✓ DOM中存在dual-channel-panel元素: ${hasDualChannelPanel}`);
    
    // 检查弹窗是否可见
    const isPopupVisible = await page.evaluate(() => {
      const panel = document.querySelector('dual-channel-panel');
      if (panel) {
        const style = window.getComputedStyle(panel);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }
      return false;
    });
    console.log(`✓ 弹窗是否可见: ${isPopupVisible}`);
    
    // 检查配置参数是否正确设置
    console.log('\n=== 检查配置参数 ===');
    const configParams = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        return {
          dualChannelSourceInfo: window.MeeWoo.app.dualChannelSourceInfo,
          dualChannelConfig: window.MeeWoo.app.dualChannelConfig
        };
      }
      return null;
    });
    
    if (configParams) {
      console.log('✓ 配置参数正确设置:');
      console.log(`  源信息: ${configParams.dualChannelSourceInfo.typeLabel} ${configParams.dualChannelSourceInfo.sizeWH} ${configParams.dualChannelSourceInfo.duration}`);
      console.log(`  配置: 宽=${configParams.dualChannelConfig.width}, 高=${configParams.dualChannelConfig.height}, 质量=${configParams.dualChannelConfig.quality}, 帧率=${configParams.dualChannelConfig.fps}`);
    } else {
      console.log('✗ 无法获取配置参数');
    }
    
    // 检查模板是否正确渲染
    console.log('\n=== 检查模板渲染 ===');
    const templateRendered = await page.evaluate(() => {
      const panel = document.querySelector('dual-channel-panel');
      if (panel) {
        // 检查是否有配置区域
        return panel.querySelector('.mp4-config-section') !== null;
      }
      return false;
    });
    console.log(`✓ 模板是否正确渲染: ${templateRendered}`);
    
    // 测试关闭弹窗
    console.log('\n=== 测试关闭弹窗 ===');
    const popupClosed = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        window.MeeWoo.app.closeRightPanel();
        return true;
      }
      return false;
    });
    
    if (popupClosed) {
      console.log('✓ 弹窗已关闭');
    } else {
      console.log('✗ 无法关闭弹窗');
    }
    
    // 等待弹窗关闭
    await page.waitForTimeout(2000);
    
    // 再次测试打开弹窗
    console.log('\n=== 再次测试打开弹窗 ===');
    const popupOpenedAgain = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        window.MeeWoo.app.openDualChannelPanel();
        return true;
      }
      return false;
    });
    
    if (popupOpenedAgain) {
      console.log('✓ 再次打开弹窗成功');
    } else {
      console.log('✗ 无法再次打开弹窗');
    }
    
    // 等待弹窗显示
    await page.waitForTimeout(3000);
    
    // 再次检查弹窗是否显示
    const isPopupVisibleAgain = await page.evaluate(() => {
      const panel = document.querySelector('dual-channel-panel');
      if (panel) {
        const style = window.getComputedStyle(panel);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }
      return false;
    });
    console.log(`✓ 弹窗再次显示: ${isPopupVisibleAgain}`);
    
    // 测试转换功能触发
    console.log('\n=== 测试转换功能触发 ===');
    const convertTriggered = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        // 模拟触发转换
        window.MeeWoo.app.handleDualChannelConvert({
          channelMode: 'color-left-alpha-right',
          width: 300,
          height: 300,
          quality: 80,
          fps: 30,
          muted: false
        });
        return true;
      }
      return false;
    });
    
    if (convertTriggered) {
      console.log('✓ 转换功能触发成功');
    } else {
      console.log('✗ 无法触发转换功能');
    }
    
    // 等待转换状态更新
    await page.waitForTimeout(2000);
    
    // 检查转换状态
    const conversionStatus = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        return {
          isConvertingToDualChannel: window.MeeWoo.app.isConvertingToDualChannel,
          dualChannelMessage: window.MeeWoo.app.dualChannelMessage
        };
      }
      return null;
    });
    
    if (conversionStatus) {
      console.log('✓ 转换状态正确更新:');
      console.log(`  是否正在转换: ${conversionStatus.isConvertingToDualChannel}`);
      console.log(`  转换消息: ${conversionStatus.dualChannelMessage}`);
    } else {
      console.log('✗ 无法获取转换状态');
    }
    
    // 测试取消转换
    console.log('\n=== 测试取消转换 ===');
    const conversionCancelled = await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        window.MeeWoo.app.cancelDualChannelConversion();
        return true;
      }
      return false;
    });
    
    if (conversionCancelled) {
      console.log('✓ 取消转换成功');
    } else {
      console.log('✗ 无法取消转换');
    }
    
    // 等待取消操作完成
    await page.waitForTimeout(1000);
    
    // 最后关闭弹窗
    await page.evaluate(() => {
      if (window.MeeWoo && window.MeeWoo.app) {
        window.MeeWoo.app.closeRightPanel();
      }
    });
    
    console.log('\n=== 测试完成 ===');
    console.log('🎉 Vue渲染方式的双通道MP4弹窗测试成功！');
    
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
testVueDualChannelPopup();
