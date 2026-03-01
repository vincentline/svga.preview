---
name: konva
version: 1.0.0
description: Comprehensive guide for Konva.js development and debugging, including core concepts, architecture, best practices, performance optimization, common issues and solutions. Use exclusively when developers are debugging Konva.js code or working with Konva.js for 2D canvas graphics, animations, and interactive applications. Do not use for non-Konva.js development tasks.
---

# Konva.js Development Guide

## Overview

Konva.js is a powerful 2D canvas library that simplifies the creation of interactive graphics applications. It provides an object-oriented API for working with canvas elements, making it easier to create complex animations, handle events, and manage graphics layers.

### Key Features
- Object-oriented API for canvas manipulation
- Layer-based rendering system
- Event handling for shapes (mouse, touch, pointer)
- Animation support (tweens, physics, custom animations)
- Transformations (scale, rotate, translate)
- Filters and effects
- Serialization/deserialization
- Mobile device support

## Core Concepts

### 1. Stage
The root container that manages one or more layers.

### 2. Layer
Contains shapes and handles rendering. Layers are rendered independently for better performance.

### 3. Shape
Basic building blocks (Rect, Circle, Line, Text, etc.).

### 4. Group
Container for multiple shapes, allowing them to be manipulated as a single unit.

### 5. Transformer
Interactive tool for manipulating shapes (resize, rotate, etc.).

## Installation

### CDN
```html
<script src="https://cdn.jsdelivr.net/npm/konva@latest/konva.min.js"></script>
```

### NPM
```bash
npm install konva
```

### Yarn
```bash
yarn add konva
```

## Basic Usage

### Creating a Stage and Layer

```javascript
// Create stage
const stage = new Konva.Stage({
  container: 'container',  // ID of DOM element
  width: window.innerWidth,
  height: window.innerHeight
});

// Create layer
const layer = new Konva.Layer();
stage.add(layer);
```

### Adding Shapes

```javascript
// Create rectangle
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 2,
  draggable: true
});

// Add to layer
layer.add(rect);

// Draw layer
layer.draw();
```

### Event Handling

```javascript
// Mouse events
rect.on('mouseover', function() {
  this.fill('yellow');
  layer.draw();
});

rect.on('mouseout', function() {
  this.fill('green');
  layer.draw();
});

// Click events
rect.on('click', function() {
  console.log('Rectangle clicked!');
});
```

### Animations

#### Tween Animation
```javascript
new Konva.Tween({
  node: rect,
  x: 150,
  y: 150,
  rotation: 360,
  duration: 1,
  easing: Konva.Easings.EaseInOut
}).play();
```

#### Custom Animation
```javascript
const anim = new Konva.Animation(function(frame) {
  const time = frame.time / 1000;
  rect.rotation(time * 30);
}, layer);

anim.start();
```

## Advanced Features

### Layer Management

```javascript
// Create multiple layers
const backgroundLayer = new Konva.Layer();
const foregroundLayer = new Konva.Layer();

stage.add(backgroundLayer);
stage.add(foregroundLayer);

// Add shapes to appropriate layers
const background = new Konva.Rect({
  x: 0,
  y: 0,
  width: stage.width(),
  height: stage.height(),
  fill: '#f0f0f0'
});

backgroundLayer.add(background);
backgroundLayer.draw();
```

### Grouping Shapes

```javascript
const group = new Konva.Group({
  x: 100,
  y: 100,
  draggable: true
});

// Add shapes to group
const circle = new Konva.Circle({
  x: 0,
  y: 0,
  radius: 30,
  fill: 'red'
});

const text = new Konva.Text({
  x: -25,
  y: -10,
  text: 'Hello',
  fontSize: 16,
  fill: 'white'
});

group.add(circle);
group.add(text);
layer.add(group);
layer.draw();
```

### Transformers

```javascript
const transformer = new Konva.Transformer();
layer.add(transformer);

// Attach to shape
rect.on('click', function() {
  transformer.nodes([this]);
  layer.draw();
});
```

### Filters

```javascript
// Apply blur filter
rect.filters([Konva.Filters.Blur]);
rect.blurRadius(10);
layer.draw();

// Apply multiple filters
rect.filters([
  Konva.Filters.Blur,
  Konva.Filters.Grayscale
]);
rect.blurRadius(5);
layer.draw();
```

## Performance Optimization

### 1. Layer Management
- Use multiple layers strategically
- Only redraw layers that have changed
- Group static content on separate layers

### 2. Caching
- Cache complex shapes or groups
- Update cache only when needed

```javascript
// Enable caching
complexShape.cache();

// Update cache when shape changes
complexShape.setAttrs({ fill: 'blue' });
complexShape.clearCache();
complexShape.cache();
layer.draw();
```

### 3. Batch Operations
- Use `batchDraw()` for multiple changes
- Avoid frequent `draw()` calls

```javascript
// Batch multiple changes
Konva.batchDraw(() => {
  for (let i = 0; i < 100; i++) {
    const circle = new Konva.Circle({
      x: Math.random() * stage.width(),
      y: Math.random() * stage.height(),
      radius: 10,
      fill: 'red'
    });
    layer.add(circle);
  }
});
```

### 4. Shape Complexity
- Use simpler shapes when possible
- Reduce number of points in paths
- Avoid excessive use of filters

### 5. Event Optimization
- Use event delegation
- Remove event listeners when not needed
- Avoid heavy computations in event handlers

## Common Issues and Solutions

### 1. Performance Issues with Many Shapes
**Solution:** Use layers strategically, enable caching, and consider using virtualization for very large datasets.

### 2. Event Handling Problems
**Solution:** Ensure proper event propagation, use `preventDefault()` when needed, and test on different devices.

### 3. Animation Jitter
**Solution:** Use `requestAnimationFrame` indirectly through Konva's animation system, avoid heavy computations during animations.

### 4. Mobile Device Compatibility
**Solution:** Test on actual devices, use touch events appropriately, and ensure proper scaling.

### 5. Serialization Issues
**Solution:** Test serialization/deserialization with your specific shapes and properties, handle custom properties manually.

### 6. Z-index Management
**Solution:** Use `moveToTop()`, `moveToBottom()`, `moveUp()`, `moveDown()` methods to manage stacking order.

### 7. 实际开发经验
更多实际开发中遇到的问题和解决方案，请参阅 **[experience.md](references/experience.md)**，包括：
- Transformer 被其他元素遮挡
- 显示区域与导出区域分离
- 使用 offset 实现中心锚点
- Vue 响应式与 Konva 的配合
- 动态 Canvas 尺寸
- 位置数据的相对坐标设计

## Best Practices

### 1. Project Structure
- Organize code by functionality
- Separate concerns (UI, logic, data)
- Use modules or components

### 2. Code Organization
- Use meaningful variable names
- Document complex logic
- Follow consistent coding style

### 3. Testing
- Test on multiple browsers and devices
- Test performance with different dataset sizes
- Test edge cases (very large/small shapes, rapid interactions)

### 4. Debugging
- Use browser dev tools
- Monitor canvas performance
- Check for memory leaks

### 5. Security
- Validate user input
- Sanitize data before rendering
- Be cautious with external image sources

## Environment Setup

### Development Environment
1. Install Konva via npm/yarn or CDN
2. Set up a local development server
3. Configure build tools if using a framework

### Framework Integration

#### Vue.js
```javascript
// In component
import Konva from 'konva';

export default {
  mounted() {
    this.initKonva();
  },
  methods: {
    initKonva() {
      const stage = new Konva.Stage({
        container: this.$refs.container,
        width: 500,
        height: 500
      });
      // ... rest of code
    }
  }
};
```

#### React
```javascript
import React, { useRef, useEffect } from 'react';
import Konva from 'konva';

const KonvaComponent = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 500,
      height: 500
    });
    // ... rest of code
  }, []);

  return <div ref={containerRef} />;
};
```

#### Angular
```typescript
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Konva from 'konva';

@Component({
  selector: 'app-konva',
  template: '<div #container></div>'
})
export class KonvaComponent implements OnInit {
  @ViewChild('container') container: ElementRef;

  ngOnInit() {
    const stage = new Konva.Stage({
      container: this.container.nativeElement,
      width: 500,
      height: 500
    });
    // ... rest of code
  }
}
```

## Plugins and Extensions

### Official Plugins
- Konva.Transformer - Interactive shape manipulation
- Konva.Animation - Animation system
- Konva.Tween - Property animations

### Community Plugins
- konva-react - React bindings
- vue-konva - Vue bindings
- konva-angular - Angular bindings
- konva-snap - Snap to grid functionality
- konva-context-menu - Context menu support

## Example Projects

### 1. Interactive Drawing App
```javascript
// Simple drawing app
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

const layer = new Konva.Layer();
stage.add(layer);

let isDrawing = false;
let lastPoint = { x: 0, y: 0 };

stage.on('mousedown touchstart', function(e) {
  isDrawing = true;
  const pos = stage.getPointerPosition();
  lastPoint = pos;
});

stage.on('mousemove touchmove', function(e) {
  if (!isDrawing) return;
  
  const pos = stage.getPointerPosition();
  
  // Create line
  const line = new Konva.Line({
    points: [lastPoint.x, lastPoint.y, pos.x, pos.y],
    stroke: 'black',
    strokeWidth: 2,
    tension: 0.5
  });
  
  layer.add(line);
  layer.draw();
  lastPoint = pos;
});

stage.on('mouseup touchend mouseleave', function() {
  isDrawing = false;
});
```

### 2. Image Editor
```javascript
// Simple image editor
const stage = new Konva.Stage({
  container: 'container',
  width: 800,
  height: 600
});

const layer = new Konva.Layer();
stage.add(layer);

// Load image
const imageObj = new Image();
imageObj.onload = function() {
  const image = new Konva.Image({
    x: 50,
    y: 50,
    image: imageObj,
    width: 400,
    height: 300,
    draggable: true
  });
  
  layer.add(image);
  layer.draw();
  
  // Add transformer
  const transformer = new Konva.Transformer();
  layer.add(transformer);
  transformer.nodes([image]);
  layer.draw();
};
imageObj.src = 'image.jpg';
```

## Resources

### Official Documentation
- [Konva.js Documentation](https://konvajs.org/docs/)
- [Konva.js GitHub Repository](https://github.com/konvajs/konva)
- **Detailed API Reference**: See [official_docs.md](references/official_docs.md) for comprehensive API documentation and examples

### Tutorials and Examples
- [Konva.js Tutorials](https://konvajs.org/docs/tutorials/)
- [Konva.js Examples](https://konvajs.org/docs/sandbox/)

### Community
- [Stack Overflow (konvajs tag)](https://stackoverflow.com/questions/tagged/konvajs)
- [Konva.js Discord](https://discord.gg/FCFYBgNd)

### Books and Courses
- [Konva.js: Interactive Canvas Graphics](https://www.amazon.com/)
- [Canvas Graphics with Konva.js](https://www.udemy.com/)

## Conclusion

Konva.js is a powerful library that simplifies canvas-based graphics development. By understanding its core concepts, following best practices, and optimizing performance, you can create impressive interactive applications with ease. Remember to test thoroughly and stay updated with the latest features and improvements.