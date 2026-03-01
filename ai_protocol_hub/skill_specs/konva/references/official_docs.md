# Konva.js Official Documentation

## Official Resources

### Main Website
- [Konva.js Official Website](https://konvajs.org/)
- [Konva.js GitHub Repository](https://github.com/konvajs/konva)

### Documentation
- [Konva.js API Documentation](https://konvajs.org/docs/index.html)
- [Konva.js Tutorials](https://konvajs.org/docs/tutorials/)
- [Konva.js Examples](https://konvajs.org/docs/sandbox/)

### Chinese Documentation
- [Konva 中文文档](https://konva.zhcndoc.com/)
- [Konva 中文 API 文档](http://konvajs-doc.bluehymn.com/docs/)

## Core API Reference

### Stage
```javascript
const stage = new Konva.Stage({
  container: 'container',
  width: 800,
  height: 600
});
```

### Layer
```javascript
const layer = new Konva.Layer();
stage.add(layer);
```

### Shapes
- **Rect**: Rectangle shape
- **Circle**: Circle shape  
- **Ellipse**: Ellipse shape
- **Line**: Line shape
- **Polyline**: Polyline shape
- **Polygon**: Polygon shape
- **Star**: Star shape
- **Label**: Label with text and background
- **Text**: Text shape
- **Image**: Image shape
- **Path**: Path shape
- **Sprite**: Sprite animation

### Group
```javascript
const group = new Konva.Group({
  x: 100,
  y: 100,
  draggable: true
});
```

### Transformer
```javascript
const transformer = new Konva.Transformer();
layer.add(transformer);
transformer.nodes([shape]);
```

### Animation
```javascript
// Tween animation
new Konva.Tween({
  node: shape,
  x: 100,
  y: 100,
  duration: 1
}).play();

// Custom animation
const anim = new Konva.Animation(function(frame) {
  shape.rotation(frame.time / 100);
}, layer);
anim.start();
```

### Events
```javascript
shape.on('click tap', function() {
  console.log('Shape clicked');
});

stage.on('mousemove touchmove', function() {
  const pos = stage.getPointerPosition();
  console.log('Mouse position:', pos);
});
```

### Filters
```javascript
// Apply filters
shape.filters([
  Konva.Filters.Blur,
  Konva.Filters.Brighten
]);

// Set filter properties
shape.blurRadius(10);
shape.brightness(0.5);
```

### Serialization
```javascript
// Serialize stage
const json = stage.toJSON();

// Deserialize stage
Konva.Node.create(json, 'container');
```

### Utility Methods
```javascript
// Get pointer position
const pos = stage.getPointerPosition();

// Convert between coordinates
const stagePos = stage.getRelativePointerPosition();
const layerPos = layer.getRelativePointerPosition();

// Batch operations
Konva.batchDraw(() => {
  // Multiple changes here
});

// Debounce
Konva.Debounce.execute('key', function() {
  // Debounced function
}, 100);
```

## Framework Integrations

### React
- [react-konva](https://github.com/konvajs/react-konva)

### Vue
- [vue-konva](https://github.com/konvajs/vue-konva)

### Angular
- [angular-konva](https://github.com/konvajs/angular-konva)

### Svelte
- [svelte-konva](https://github.com/konvajs/svelte-konva)

## Plugins

### Official Plugins
- [Konva.Transformer](https://konvajs.org/docs/transformer/)
- [Konva.Animation](https://konvajs.org/docs/animations/)
- [Konva.Tween](https://konvajs.org/docs/tweens/)

### Community Plugins
- [konva-snap](https://github.com/lavrton/konva-snap)
- [konva-context-menu](https://github.com/lavrton/konva-context-menu)
- [konva-zoom-text](https://github.com/lavrton/konva-zoom-text)
- [konva-image-filters](https://github.com/konvajs/konva-image-filters)

## Examples

### Basic Shape
```javascript
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 2,
  cornerRadius: 10,
  draggable: true
});
layer.add(rect);
layer.draw();
```

### Animation
```javascript
const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 50,
  fill: 'blue'
});
layer.add(circle);

new Konva.Tween({
  node: circle,
  scaleX: 1.5,
  scaleY: 1.5,
  opacity: 0.5,
  duration: 1,
  easing: Konva.Easings.EaseInOut,
  yoyo: true,
  repeat: -1
}).play();
```

### Event Handling
```javascript
const triangle = new Konva.RegularPolygon({
  x: 200,
  y: 200,
  sides: 3,
  radius: 50,
  fill: 'green',
  draggable: true
});

layer.add(triangle);

// Mouse events
triangle.on('mouseover', function() {
  this.fill('yellow');
  layer.draw();
});

triangle.on('mouseout', function() {
  this.fill('green');
  layer.draw();
});

// Click event
triangle.on('click', function() {
  console.log('Triangle clicked!');
});
```

## Best Practices from Official Docs

1. **Use multiple layers** for better performance
2. **Cache complex shapes** to improve rendering speed
3. **Use batch operations** for multiple changes
4. **Optimize event handlers** to avoid performance issues
5. **Test on multiple devices** for compatibility
6. **Use appropriate shape types** for different use cases
7. **Clean up resources** to avoid memory leaks

## Troubleshooting

### Common Issues
- **Performance**: Use layers and caching
- **Events**: Check event propagation and device compatibility
- **Animations**: Use appropriate easing and duration
- **Mobile**: Test touch events and scaling
- **Serialization**: Test with custom properties

### Debugging Tips
- Use browser developer tools
- Monitor canvas performance
- Check for memory leaks
- Test with different browser versions

## Updates and Migration

### Version History
- **v8.x**: Latest stable version
- **v7.x**: Previous major version
- **v6.x**: Older version

### Migration Guide
- Check [GitHub releases](https://github.com/konvajs/konva/releases) for breaking changes
- Update dependencies carefully
- Test thoroughly after migration

## Community

### Support
- [Stack Overflow (konvajs tag)](https://stackoverflow.com/questions/tagged/konvajs)
- [GitHub Issues](https://github.com/konvajs/konva/issues)
- [Discord Community](https://discord.gg/FCFYBgNd)

### Contributing
- [Contributing Guide](https://github.com/konvajs/konva/blob/master/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/konvajs/konva/blob/master/CODE_OF_CONDUCT.md)
- [Development Setup](https://github.com/konvajs/konva/blob/master/DEVELOPMENT.md)