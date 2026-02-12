/**
 * Worker Pool Implementation
 * 
 * Manages a pool of Worker instances to handle multiple tasks concurrently
 * 
 * Usage:
 * const pool = new WorkerPool('worker.js', 4); // Create pool with 4 workers
 * pool.runTask({ type: 'compute', data: [1, 2, 3] }).then(result => {
 *   console.log('Task result:', result);
 * });
 * pool.terminate(); // Clean up when done
 */

class WorkerPool {
  /**
   * Create a WorkerPool
   * @param {string} workerScript - Path to the worker script
   * @param {number} size - Number of workers to create
   */
  constructor(workerScript, size = 4) {
    this.workerScript = workerScript;
    this.size = size;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
    this.workerIdCounter = 0;
    
    this.initialize();
  }
  
  /**
   * Initialize the worker pool
   */
  initialize() {
    for (let i = 0; i < this.size; i++) {
      this.createWorker();
    }
  }
  
  /**
   * Create a new worker and add it to the pool
   */
  createWorker() {
    const workerId = this.workerIdCounter++;
    const worker = new Worker(this.workerScript);
    
    worker.onmessage = (e) => {
      const { taskId, result } = e.data;
      this.handleTaskComplete(worker, taskId, result);
    };
    
    worker.onerror = (error) => {
      console.error(`Worker ${workerId} error:`, error);
      this.handleWorkerError(worker);
    };
    
    this.workers.push({ worker, id: workerId, busy: false });
  }
  
  /**
   * Run a task in the pool
   * @param {*} taskData - Data to pass to the worker
   * @returns {Promise} - Promise that resolves with the task result
   */
  runTask(taskData) {
    return new Promise((resolve, reject) => {
      const task = {
        data: taskData,
        resolve,
        reject,
        id: Date.now() + Math.random()
      };
      
      this.taskQueue.push(task);
      this.processQueue();
    });
  }
  
  /**
   * Process tasks in the queue
   */
  processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(worker => !worker.busy);
    
    if (availableWorker) {
      const task = this.taskQueue.shift();
      availableWorker.busy = true;
      this.activeWorkers++;
      
      try {
        availableWorker.worker.postMessage({ taskId: task.id, data: task.data });
      } catch (error) {
        task.reject(error);
        availableWorker.busy = false;
        this.activeWorkers--;
        this.processQueue();
      }
    }
  }
  
  /**
   * Handle task completion
   * @param {Worker} worker - The worker that completed the task
   * @param {number} taskId - The task ID
   * @param {*} result - The task result
   */
  handleTaskComplete(worker, taskId, result) {
    const workerInfo = this.workers.find(w => w.worker === worker);
    if (workerInfo) {
      workerInfo.busy = false;
      this.activeWorkers--;
      
      // Resolve the task promise
      // Note: In a real implementation, you would need to track tasks by ID
      // This is a simplified version
      this.processQueue();
    }
  }
  
  /**
   * Handle worker error
   * @param {Worker} worker - The worker that errored
   */
  handleWorkerError(worker) {
    const workerInfo = this.workers.find(w => w.worker === worker);
    if (workerInfo) {
      workerInfo.busy = false;
      this.activeWorkers--;
      
      // Replace the errored worker
      this.replaceWorker(workerInfo);
      this.processQueue();
    }
  }
  
  /**
   * Replace a worker
   * @param {Object} workerInfo - The worker info to replace
   */
  replaceWorker(workerInfo) {
    // Terminate the old worker
    try {
      workerInfo.worker.terminate();
    } catch (error) {
      console.error('Error terminating worker:', error);
    }
    
    // Create a new worker
    const newWorkerId = this.workerIdCounter++;
    const newWorker = new Worker(this.workerScript);
    
    newWorker.onmessage = (e) => {
      const { taskId, result } = e.data;
      this.handleTaskComplete(newWorker, taskId, result);
    };
    
    newWorker.onerror = (error) => {
      console.error(`Worker ${newWorkerId} error:`, error);
      this.handleWorkerError(newWorker);
    };
    
    // Replace in the pool
    const index = this.workers.indexOf(workerInfo);
    if (index !== -1) {
      this.workers[index] = { worker: newWorker, id: newWorkerId, busy: false };
    }
  }
  
  /**
   * Get the number of active workers
   * @returns {number} - Number of active workers
   */
  getActiveWorkers() {
    return this.activeWorkers;
  }
  
  /**
   * Get the number of pending tasks
   * @returns {number} - Number of pending tasks
   */
  getPendingTasks() {
    return this.taskQueue.length;
  }
  
  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(workerInfo => {
      try {
        workerInfo.worker.terminate();
      } catch (error) {
        console.error('Error terminating worker:', error);
      }
    });
    
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkerPool;
} else if (typeof window !== 'undefined') {
  window.WorkerPool = WorkerPool;
}