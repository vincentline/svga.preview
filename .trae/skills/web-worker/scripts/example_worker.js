/**
 * Example Worker Implementation
 * 
 * Demonstrates basic Worker functionality
 * 
 * Usage:
 * const worker = new Worker('example_worker.js');
 * worker.postMessage({ type: 'sort', data: [3, 1, 4, 1, 5, 9, 2, 6] });
 * worker.onmessage = function(e) {
 *   console.log('Result:', e.data.result);
 *   console.log('Time:', e.data.time);
 * };
 */

// Listen for messages from the main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    const startTime = performance.now();
    let result;
    
    // Handle different task types
    switch (type) {
      case 'sort':
        result = sortArray(data);
        break;
      case 'fibonacci':
        result = calculateFibonacci(data);
        break;
      case 'prime':
        result = countPrimeNumbers(data);
        break;
      case 'calculate':
        result = performCalculation(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    const endTime = performance.now();
    
    // Send the result back to the main thread
    self.postMessage({
      success: true,
      result,
      time: endTime - startTime,
      type
    });
  } catch (error) {
    // Send error message back to the main thread
    self.postMessage({
      success: false,
      error: error.message,
      type
    });
  }
};

/**
 * Sort an array
 * @param {Array} array - Array to sort
 * @returns {Array} - Sorted array
 */
function sortArray(array) {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  return array.sort((a, b) => a - b);
}

/**
 * Calculate Fibonacci number
 * @param {number} n - Fibonacci index
 * @returns {number} - Fibonacci result
 */
function calculateFibonacci(n) {
  if (typeof n !== 'number' || n < 0) {
    throw new Error('Input must be a non-negative number');
  }
  
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

/**
 * Count prime numbers up to a given limit
 * @param {number} limit - Upper limit
 * @returns {number} - Number of primes found
 */
function countPrimeNumbers(limit) {
  if (typeof limit !== 'number' || limit < 2) {
    throw new Error('Input must be a number greater than or equal to 2');
  }
  
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    if (isPrime(i)) {
      count++;
    }
  }
  return count;
}

/**
 * Check if a number is prime
 * @param {number} num - Number to check
 * @returns {boolean} - True if prime, false otherwise
 */
function isPrime(num) {
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      return false;
    }
  }
  return num > 1;
}

/**
 * Perform arithmetic calculation
 * @param {Object} calculation - Calculation object with operands and operator
 * @returns {number} - Calculation result
 */
function performCalculation(calculation) {
  const { a, b, operator } = calculation;
  
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Operands must be numbers');
  }
  
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) {
        throw new Error('Division by zero');
      }
      return a / b;
    case '%':
      return a % b;
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Example of using other APIs in Worker
 * Workers can use many APIs except DOM-related ones
 */
function demonstrateAPIs() {
  // Example: Using fetch API
  // fetch('https://api.example.com/data')
  //   .then(response => response.json())
  //   .then(data => {
  //     self.postMessage({ success: true, data });
  //   })
  //   .catch(error => {
  //     self.postMessage({ success: false, error: error.message });
  //   });
  
  // Example: Using setTimeout
  // setTimeout(() => {
  //   self.postMessage({ success: true, message: 'Timeout completed' });
  // }, 1000);
  
  // Example: Using console
  console.log('Worker initialized');
}

// Initialize the worker
console.log('Example worker initialized');
console.log('Supported APIs:', {
  'fetch': typeof fetch === 'function',
  'XMLHttpRequest': typeof XMLHttpRequest === 'function',
  'performance': typeof performance === 'object',
  'console': typeof console === 'object',
  'navigator': typeof navigator === 'object',
  'location': typeof location === 'object',
  'importScripts': typeof importScripts === 'function'
});