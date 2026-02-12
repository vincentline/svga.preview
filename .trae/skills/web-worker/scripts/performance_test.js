/**
 * Web Worker Performance Test
 * 
 * Tests the performance of Web Worker vs main thread for computationally intensive tasks
 * 
 * Usage:
 * const tester = new WorkerPerformanceTest();
 * tester.runTests().then(results => {
 *   console.log('Performance test results:', results);
 * });
 */

class WorkerPerformanceTest {
  /**
   * Create a WorkerPerformanceTest
   */
  constructor() {
    this.workerScript = `
      self.onmessage = function(e) {
        const { taskId, testType, data } = e.data;
        
        try {
          const startTime = performance.now();
          let result;
          
          switch (testType) {
            case 'sort':
              result = data.sort((a, b) => a - b);
              break;
            case 'fibonacci':
              result = fibonacci(data);
              break;
            case 'prime':
              result = countPrimes(data);
              break;
            default:
              result = 'Unknown test type';
          }
          
          const endTime = performance.now();
          
          self.postMessage({
            taskId,
            result,
            time: endTime - startTime
          });
        } catch (error) {
          self.postMessage({
            taskId,
            error: error.message,
            time: 0
          });
        }
      };
      
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      
      function countPrimes(limit) {
        let count = 0;
        for (let i = 2; i <= limit; i++) {
          if (isPrime(i)) count++;
        }
        return count;
      }
      
      function isPrime(num) {
        for (let i = 2; i <= Math.sqrt(num); i++) {
          if (num % i === 0) return false;
        }
        return num > 1;
      }
    `;
    
    // Create blob URL for worker script
    this.workerBlob = new Blob([this.workerScript], { type: 'application/javascript' });
    this.workerUrl = URL.createObjectURL(this.workerBlob);
  }
  
  /**
   * Run all performance tests
   * @returns {Promise<Object>} - Test results
   */
  async runTests() {
    const results = {
      worker: {},
      mainThread: {}
    };
    
    // Test data
    const testData = {
      sort: Array.from({ length: 100000 }, () => Math.random() * 100000),
      fibonacci: 35,
      prime: 100000
    };
    
    // Run worker tests
    console.log('Running worker tests...');
    for (const [testType, data] of Object.entries(testData)) {
      results.worker[testType] = await this.runWorkerTest(testType, data);
    }
    
    // Run main thread tests
    console.log('Running main thread tests...');
    for (const [testType, data] of Object.entries(testData)) {
      results.mainThread[testType] = await this.runMainThreadTest(testType, data);
    }
    
    // Calculate speedup
    results.speedup = {};
    for (const testType of Object.keys(testData)) {
      results.speedup[testType] = results.mainThread[testType].time / results.worker[testType].time;
    }
    
    // Cleanup
    URL.revokeObjectURL(this.workerUrl);
    
    return results;
  }
  
  /**
   * Run a test in a worker
   * @param {string} testType - Type of test to run
   * @param {*} data - Test data
   * @returns {Promise<Object>} - Test result
   */
  runWorkerTest(testType, data) {
    return new Promise((resolve) => {
      const worker = new Worker(this.workerUrl);
      const taskId = Date.now();
      
      worker.onmessage = (e) => {
        const { time, result, error } = e.data;
        worker.terminate();
        
        resolve({
          time,
          result,
          error
        });
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        worker.terminate();
        
        resolve({
          time: 0,
          result: null,
          error: error.message
        });
      };
      
      worker.postMessage({ taskId, testType, data });
    });
  }
  
  /**
   * Run a test in the main thread
   * @param {string} testType - Type of test to run
   * @param {*} data - Test data
   * @returns {Promise<Object>} - Test result
   */
  runMainThreadTest(testType, data) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let result;
      let error = null;
      
      try {
        switch (testType) {
          case 'sort':
            // Create a copy to avoid modifying original data
            const dataCopy = [...data];
            result = dataCopy.sort((a, b) => a - b);
            break;
          case 'fibonacci':
            result = this.fibonacci(data);
            break;
          case 'prime':
            result = this.countPrimes(data);
            break;
          default:
            result = 'Unknown test type';
        }
      } catch (err) {
        error = err.message;
      }
      
      const endTime = performance.now();
      
      resolve({
        time: endTime - startTime,
        result,
        error
      });
    });
  }
  
  /**
   * Fibonacci function for main thread test
   * @param {number} n - Fibonacci number to calculate
   * @returns {number} - Fibonacci result
   */
  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
  
  /**
   * Count primes function for main thread test
   * @param {number} limit - Upper limit to count primes up to
   * @returns {number} - Number of primes found
   */
  countPrimes(limit) {
    let count = 0;
    for (let i = 2; i <= limit; i++) {
      if (this.isPrime(i)) count++;
    }
    return count;
  }
  
  /**
   * Check if a number is prime
   * @param {number} num - Number to check
   * @returns {boolean} - True if prime, false otherwise
   */
  isPrime(num) {
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return num > 1;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkerPerformanceTest;
} else if (typeof window !== 'undefined') {
  window.WorkerPerformanceTest = WorkerPerformanceTest;
}