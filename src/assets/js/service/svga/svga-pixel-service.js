(function(global) {
  'use strict';

  window.MeeWoo = window.MeeWoo || {};
  window.MeeWoo.Services = window.MeeWoo.Services || {};

  class SvgaPixelService {
    constructor() {
      this.worker = null;
      this.isInitialized = false;
      this.workerPath = 'assets/js/service/svga/svga-pixel-worker.js';
      this.taskId = 0;
      this.pendingTasks = new Map();
    }

    async init() {
      if (this.isInitialized) return;

      try {
        this.worker = new Worker(this.workerPath);
        
        this.worker.onmessage = (e) => {
          const message = e.data;
          const task = this.pendingTasks.get(message.id);
          
          if (task) {
            this.pendingTasks.delete(message.id);
            
            if (message.type === 'error') {
              task.reject(new Error(message.error));
            } else if (message.type === 'progress' && task.onProgress) {
              task.onProgress(message.progress / 100);
            } else if (message.type === 'result') {
              task.resolve(message.result);
            }
          }
        };
        
        this.worker.onerror = (error) => {
          console.error('SvgaPixelService Worker error:', error);
          for (const [id, task] of this.pendingTasks) {
            task.reject(new Error('Worker error: ' + error.message));
          }
          this.pendingTasks.clear();
        };

        this.isInitialized = true;
        console.log('SvgaPixelService initialized successfully');
      } catch (error) {
        console.error('Failed to initialize SvgaPixelService:', error);
        throw error;
      }
    }

    async processFrame(frameData, alphaPosition, width, height, scaledWidth, scaledHeight, options = {}) {
      await this.init();

      return new Promise((resolve, reject) => {
        const taskId = ++this.taskId;
        
        this.pendingTasks.set(taskId, {
          resolve,
          reject,
          onProgress: options.onProgress
        });

        this.worker.postMessage({
          id: taskId,
          type: 'processFrame',
          data: {
            frameData: frameData,
            alphaPosition: alphaPosition,
            width: width,
            height: height,
            scaledWidth: scaledWidth,
            scaledHeight: scaledHeight
          }
        }, frameData && frameData.buffer ? [frameData.buffer] : []);
      });
    }

    async processFrames(frames, alphaPosition, width, height, scaledWidth, scaledHeight, options = {}) {
      await this.init();

      return new Promise((resolve, reject) => {
        const taskId = ++this.taskId;
        
        this.pendingTasks.set(taskId, {
          resolve,
          reject,
          onProgress: options.onProgress
        });

        const transferables = [];
        if (frames && Array.isArray(frames)) {
          frames.forEach(frame => {
            if (frame && frame.buffer) {
              transferables.push(frame.buffer);
            }
          });
        }

        this.worker.postMessage({
          id: taskId,
          type: 'processFrames',
          data: {
            frames: frames,
            alphaPosition: alphaPosition,
            width: width,
            height: height,
            scaledWidth: scaledWidth,
            scaledHeight: scaledHeight
          }
        }, transferables);
      });
    }

    async clearMemory() {
      await this.init();

      return new Promise((resolve, reject) => {
        const taskId = ++this.taskId;
        
        this.pendingTasks.set(taskId, { resolve, reject });

        this.worker.postMessage({
          id: taskId,
          type: 'clearMemory',
          data: {}
        });
      });
    }

    getStatus() {
      return {
        initialized: this.isInitialized,
        pendingTasks: this.pendingTasks.size
      };
    }

    destroy() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      this.pendingTasks.clear();
      this.isInitialized = false;
    }
  }

  const svgaPixelService = new SvgaPixelService();
  window.MeeWoo.Services.SvgaPixelService = svgaPixelService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SvgaPixelService;
  } else {
    global.SvgaPixelService = SvgaPixelService;
  }

})(typeof window !== 'undefined' ? window : this);
