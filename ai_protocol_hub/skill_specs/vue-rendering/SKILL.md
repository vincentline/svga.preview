---
name: vue-rendering
description: Comprehensive guide for Vue.js rendering technology, including core principles, best practices, optimization strategies, and troubleshooting. Use when working with Vue.js rendering issues, performance optimization, compatibility problems, or code refactoring that affects rendering. Covers both Vue 2.x and 3.x versions, server-side rendering, and cross-platform rendering solutions.
---

# Vue Rendering Technology Guide

## Overview

This skill provides comprehensive guidance on Vue.js rendering technology, including core principles, best practices, optimization strategies, and troubleshooting techniques. It transforms Claude into a specialized Vue rendering expert capable of addressing complex rendering issues and providing performance optimization recommendations.

## Core Principles

### Rendering Fundamentals

- **Virtual DOM**: Vue uses a virtual DOM to minimize direct DOM manipulations and improve rendering performance
- **Reactivity System**: Vue's reactive system automatically tracks dependencies and triggers updates when data changes
- **Template Compilation**: Vue compiles templates into efficient render functions for optimal performance
- **Component-Based Architecture**: Vue's component system enables reusable and maintainable code

### Performance Optimization

- **Minimize Re-renders**: Use computed properties, memoization, and proper key usage
- **Efficient State Management**: Choose the appropriate state management solution based on application size
- **Code Splitting**: Implement lazy loading and dynamic imports for better initial load performance
- **Bundle Optimization**: Use tree shaking and proper build configurations

## Workflow Decision Tree

### 1. Identify Rendering Issue Type

- **Performance Issues**: Slow rendering, frequent re-renders, or animation jank
- **Compatibility Issues**: Conflicts with other libraries or browsers
- **Rendering Bugs**: Incorrect UI rendering, data not updating
- **Architecture Questions**: Best practices for component structure

### 2. Select Appropriate Solution Path

- **Performance Path**: Analyze component rendering, optimize state management, implement caching
- **Compatibility Path**: Identify conflicting libraries, implement isolation strategies
- **Bug Fix Path**: Debug reactivity issues, fix template errors, resolve lifecycle problems
- **Architecture Path**: Recommend component structure, state management approach, code organization

## Rendering Optimization Strategies

### Component Level Optimization

- **Use Functional Components**: For stateless, purely presentational components
- **Implement Keep-Alive**: Cache component instances to avoid unnecessary re-mounting
- **Optimize Props Passing**: Avoid passing large objects or arrays as props
- **Use v-once and v-memo**: For static or rarely changing content

### State Management Optimization

- **Choose the Right Solution**: Use Vue's built-in reactivity for small apps, Pinia for larger applications
- **Avoid Deeply Nested State**: Flatten state structure where possible
- **Use Computed Properties**: For derived state to avoid recalculations
- **Implement Proper Mutation Patterns**: Follow immutable patterns when updating state

### Build and Bundle Optimization

- **Tree Shaking**: Remove unused code from the final bundle
- **Code Splitting**: Split code into smaller chunks for faster initial load
- **Lazy Loading**: Load components and routes on demand
- **Optimize Assets**: Compress images, minify CSS/JS

## Common Rendering Issues and Solutions

### Data Update But View Not Refreshing

**Symptoms**: Data changes in console but UI doesn't update

**Root Causes**:
- Object property added directly without Vue.set()
- Array modified with non-reactive methods
- Deeply nested object changes not detected

**Solutions**:
- Use this.$set() or Vue.set() for object properties
- Use Vue's reactive array methods (push, pop, splice, etc.)
- Consider using Vue 3's reactive() or ref() for better reactivity

### Component Rendering Order Issues

**Symptoms**: Child components render before receiving data from parent

**Root Causes**:
- Asynchronous data loading timing issues
- Incorrect lifecycle hook usage
- Missing conditional rendering

**Solutions**:
- Use v-if to conditionally render components
- Implement proper loading states
- Use async/await with lifecycle hooks

### Memory Leaks Causing Rendering Problems

**Symptoms**: App becomes slower over time, especially with frequent component mounts/unmounts

**Root Causes**:
- Uncleaned event listeners
- Uncancelled timers
- Circular references

**Solutions**:
- Clean up event listeners in beforeUnmount
- Clear timers and intervals
- Avoid circular references in component data

## Server-Side Rendering

### Benefits

- Improved SEO
- Faster initial page load
- Better performance on low-end devices

### Implementation Options

- **Nuxt.js**: Vue's official SSR framework
- **Vite SSR**: Built-in SSR capabilities in Vite
- **Custom SSR**: Manual implementation with Node.js

### Considerations

- Higher server load
- More complex development setup
- Limited browser APIs on server

## Cross-Platform Rendering

### Options

- **Vue Native**: For mobile app development
- **Weex**: For multi-platform (iOS, Android, Web) development
- **Electron**: For desktop application development
- **HarmonyOS**: For Huawei ecosystem development

### Best Practices

- Use platform-agnostic code where possible
- Implement platform-specific optimizations
- Test thoroughly on all target platforms

## Resources

This skill includes reference materials for deeper understanding:

### references/
- **rendering-principles.md**: Detailed explanation of Vue's rendering mechanism
- **performance-optimization.md**: Comprehensive guide to Vue performance optimization
- **troubleshooting.md**: Detailed troubleshooting guide for common rendering issues

### assets/
- **code-examples/**: Practical code examples for common rendering scenarios

## Conclusion

Vue's rendering system is a powerful and flexible foundation for building modern web applications. By understanding its core principles, following best practices, and implementing appropriate optimization strategies, developers can create high-performance, responsive Vue applications that deliver exceptional user experiences.

For specific rendering issues or optimization needs, refer to the detailed reference materials provided with this skill.
