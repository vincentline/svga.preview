// 最小化测试版本
function initApp() {
    console.log('[MINIMAL] initApp 开始');

    var vueInstance = new Vue({
        el: '#app',
        data: function () {
            console.log('[MINIMAL] data 函数执行');
            return {
                message: 'Hello from minimal Vue',
                currentModule: 'svga',
                viewerScale: 1,
                viewerOffsetX: 0,
                viewerOffsetY: 0,
                dragging: false,
                isEmpty: true
            };
        },
        mounted: function () {
            console.log('[MINIMAL] mounted 执行成功！');
            alert('Vue 实例挂载成功！');
        }
    });

    console.log('[MINIMAL] initApp 完成');
}
