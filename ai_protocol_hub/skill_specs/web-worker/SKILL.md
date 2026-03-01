---
name: web-worker
description: Comprehensive guide for Web Worker technology, including core concepts, implementation steps, debugging methods, troubleshooting techniques, and optimization strategies. Use when developers need to implement Web Worker in their projects, solve performance bottlenecks, or understand Web Worker best practices.
---

# Web Worker

## Overview

This skill provides a comprehensive guide to Web Worker technology, enabling developers to create responsive web applications by offloading computationally intensive tasks to background threads. It covers everything from basic concepts to advanced applications, with practical examples and best practices.

## Core Concepts

### 1.1 Web Worker Basic Concepts
- **Definition**: Web Worker is a technology introduced in HTML5 that allows running JavaScript code in background threads separate from the main thread
- **Purpose**: Avoid blocking the main thread, maintain page responsiveness, and utilize multi-core CPU resources
- **Types**: Dedicated Worker, Shared Worker, Service Worker

### 1.2 Running Mechanism
- **Thread Model**: Runs in an independent thread with its own execution context
- **Communication Mechanism**: Communicates with the main thread through message passing, no shared memory
- **Lifecycle**: Controlled by the creator or self-terminated

### 1.3 Limitations and Constraints
- **Same-origin Restriction**: Worker scripts must be from the same origin as the main thread script
- **DOM Restriction**: Cannot directly manipulate the DOM
- **Global Objects**: Cannot access window, document, etc.
- **File Restriction**: Cannot read local files, can only load network scripts

## Implementation Steps

### 2.1 Creating a Worker
- **Basic Syntax**: `const worker = new Worker('worker.js');`
- **Inline Worker**: Create using Blob and URL.createObjectURL
- **Module Worker**: Use `{ type: 'module' }` option

### 2.2 Message Passing
- **Main Thread Sending Message**: `worker.postMessage(data);`
- **Main Thread Receiving Message**: `worker.onmessage = function(e) { ... };`
- **Worker Receiving Message**: `self.onmessage = function(e) { ... };`
- **Worker Sending Message**: `self.postMessage(data);`
- **Data Transfer**: Structured clone algorithm, Transferable Objects

### 2.3 Error Handling
- **Main Thread Listening for Errors**: `worker.onerror = function(e) { ... };`
- **Worker Internal Error Handling**: Use try-catch
- **Error Passing**: Pass error information to the main thread through message passing

### 2.4 Terminating a Worker
- **Main Thread Termination**: `worker.terminate();`
- **Worker Self-Termination**: `self.close();`
- **Resource Cleanup**: Ensure proper termination to release resources

## Debugging Methods

### 3.1 Browser Developer Tools
- **Chrome DevTools**: View and debug Workers in the "Sources" panel under "Threads"
- **Firefox DevTools**: View and debug in the "Debugger" panel under "Worker"
- **Safari DevTools**: Select "Show Web Inspector" in the "Develop" menu, then view in the "Sources" panel

### 3.2 Logging
- **Using console**: Workers can use console.log, console.error, etc.
- **Message Passing**: Pass debug information to the main thread via postMessage
- **External Logging**: Use third-party logging libraries or services

### 3.3 Breakpoint Debugging
- **Setting Breakpoints**: Set breakpoints directly in Worker scripts
- **Conditional Breakpoints**: Trigger breakpoints based on specific conditions
- **Exception Breakpoints**: Trigger breakpoints when exceptions are thrown

## Troubleshooting Techniques

### 4.1 Common Error Types
- **Script Loading Errors**: Path errors, same-origin policy restrictions
- **Message Passing Errors**: Incorrect data format, circular references
- **Execution Errors**: Syntax errors, runtime errors
- **Resource Errors**: Out of memory, Worker数量限制

### 4.2 Troubleshooting Steps
1. **Check Console**: Look for error messages in the browser console
2. **Verify Paths**: Ensure Worker script paths are correct and same-origin
3. **Test Message Passing**: Simplify message format and test incrementally
4. **Isolate Issues**: Test Worker code separately
5. **Use Debugging Tools**: Utilize browser developer tools for debugging

### 4.3 Common Issues and Solutions
- **Worker Not Executing**: Check script path, same-origin policy, browser compatibility
- **Messages Not Passing**: Check postMessage calls, event listener setup
- **Performance Issues**: Check data transfer volume, Worker creation frequency
- **Memory Leaks**: Ensure proper termination of Worker instances

### 4.4 Vite Development Server Worker Loading Issues (Important)

**Problem**: Worker works in production build but gets blocked in `npm run dev` (Vite development mode)

**Symptom**: 
- Worker script requests show `ERR_BLOCKED_BY_RESPONSE` in Network panel
- GIF/image encoding stuck at a certain percentage
- `server.headers` configuration in vite.config.js doesn't take effect

**Root Cause**: Vite's development server applies special processing to JS files (module transformation, HMR, etc.), which may override or ignore custom headers configuration.

**Solution**: Use Vite middleware plugin to add CORS headers for Worker scripts:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    // ... other plugins
    // Add CORP headers for Worker scripts (fix COEP policy blocking)
    {
      name: 'worker-cors-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.worker.js')) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          }
          next();
        });
      }
    }
  ]
});
```

**Diagnosis Steps**:
1. Check Network panel for `ERR_BLOCKED_BY_RESPONSE` errors on Worker script requests
2. Compare behavior between development (`npm run dev`) and production build
3. Verify Worker script response headers include `Cross-Origin-Resource-Policy`

## Optimization Strategies

### 5.1 Data Transfer Optimization
- **Using Transferable Objects**: For large ArrayBuffer, use ownership transfer instead of copying
- **Batched Transfer**: Transfer large datasets in batches
- **Data Compression**: Compress data before transfer
- **Message Format Optimization**: Use concise message formats, reduce redundant information

### 5.2 Worker Management Optimization
- **Worker Pool**: Maintain a pool of Worker instances, allocate tasks on demand
- **Task Queue**: Reasonably queue tasks to avoid overload
- **Reuse Workers**: Avoid frequent creation and destruction of Workers
- **Lazy Loading**: Create Workers only when needed

### 5.3 Performance Monitoring
- **Measuring Execution Time**: Use performance.now() to measure task execution time
- **Monitoring Memory Usage**: Use Performance API to monitor memory usage
- **Analyzing Bottlenecks**: Use browser performance analysis tools to identify bottlenecks
- **Optimizing Algorithms**: Improve algorithms in Workers to increase execution efficiency

### 5.4 Best Practices
- **Reasonable Usage Scenarios**: Only use Workers for computationally intensive tasks
- **Error Handling**: Implement comprehensive error handling mechanisms
- **Resource Management**: Release resources that are no longer needed in a timely manner
- **Code Organization**: Modularize Worker code for easier maintenance

## Framework and Tool Integration

### 6.1 Build Tool Integration
- **Webpack**: Use worker-loader
- **Vite**: Native support for Web Worker
- **Rollup**: Use @rollup/plugin-worker

### 6.2 Frontend Framework Integration
- **React**: Use custom useWorker hook
- **Vue**: Choose different approaches based on version and build tool
- **Angular**: Use Web Worker CLI

### 6.3 Third-Party Libraries and Tools
- **comlink**: Simplify Worker communication
- **workerize**: Convert modules to Workers
- **greenlet**: Convert synchronous functions to asynchronous Worker functions

## Advanced Applications

### 7.1 Using SharedWorker
- **Creating SharedWorker**: `const sharedWorker = new SharedWorker('shared-worker.js');`
- **Port Communication**: Use MessagePort for communication
- **Connection Management**: Handle connection and disconnection of multiple scripts

### 7.2 Combining Service Worker with Web Worker
- **Offline Caching**: Use Service Worker to cache static resources
- **Background Sync**: Combine Service Worker to implement background data synchronization
- **Push Notifications**: Use Service Worker to handle push notifications

### 7.3 Multi-threaded Parallel Computing
- **Task Splitting**: Split large tasks into multiple subtasks
- **Parallel Execution**: Use multiple Workers to execute subtasks simultaneously
- **Result Merging**: Merge subtask results into the final result

## Browser Compatibility

### 8.1 Support Status
- **Modern Browsers**: Chrome, Firefox, Safari, Edge all support
- **Mobile Browsers**: iOS Safari 5.1+, Android Browser 4.4+ support
- **IE**: No support at all

### 8.2 Compatibility Handling
- **Feature Detection**: Use `typeof Worker !== 'undefined'` detection
- **Fallback方案**: Use main thread execution in browsers that don't support Workers
- **Polyfill**: Use third-party libraries to provide similar functionality

## Practical Application Scenarios

### 9.1 Suitable Scenarios
- **Computationally Intensive Tasks**: Large data sorting, filtering, analysis
- **Encryption/Decryption Operations**: Such as AES encryption of large files
- **Physics Engine Calculations**: Collision detection in games
- **Image Processing**: Image filters, Canvas drawing
- **Data Preprocessing**: Formatting and transformation of API response data

### 9.2 Unsuitable Scenarios
- **DOM Operations**: Workers cannot directly manipulate the DOM
- **Frequent Short Tasks**: The overhead of creating Workers may be greater than task execution time
- **Tasks Dependent on Main Thread Context**: Tasks that need to access window objects or global variables

## Resources

### 10.1 Official Documentation
- **MDN Web Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- **W3C Specification**: https://www.w3.org/TR/workers/

### 10.2 Learning Resources
- **Google Developers**: https://developers.google.com/web/updates/2018/08/offscreen-canvas
- **Web.dev**: https://web.dev/workers/

### 10.3 Tools and Libraries
- **Workerize**: https://github.com/developit/workerize
- **Comlink**: https://github.com/GoogleChromeLabs/comlink
- **Greenlet**: https://github.com/developit/greenlet

### 10.4 Performance Testing
- **JSBench**: https://jsbench.me/
- **WebPageTest**: https://www.webpagetest.org/

## References

For more detailed information, please refer to the following files in the references directory:
- **technical_research.md**: Comprehensive technical research on Web Worker
- **skill_checklist.md**: Detailed Web Worker skill checklist
- **api_reference.md**: Web Worker API reference

## Scripts

The scripts directory contains useful Web Worker-related scripts:
- **worker_pool.js**: Implementation of Worker pool for managing multiple Worker instances
- **performance_test.js**: Script for testing Web Worker performance
- **example_worker.js**: Example Worker implementation

## Assets

The assets directory contains example files and templates for Web Worker implementation.

---

This skill provides a systematic technical guide for Web Worker development, helping developers effectively utilize Web Worker technology in practical projects, solve performance bottlenecks, and improve application quality.
