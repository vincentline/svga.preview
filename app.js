// 启动应用：先加载Vue和SVGA播放器，再创建Vue实例
function initApp() {
  new Vue({
        el: '#app',
        data: function () {
          return {
            currentModule: 'svga', // 'svga' | 'yyeva' | 'lottie'
            dropHover: false,

            // 视图操作（缩放 + 平移）
            viewerScale: 1,
            viewerOffsetX: 0,
            viewerOffsetY: 0,
            dragging: false,
            dragStartX: 0,
            dragStartY: 0,
            dragStartOffsetX: 0,
            dragStartOffsetY: 0,

            // 主题模式
            isDarkMode: false,

            // Help 内容
            helpContent: '',

            // 底色
            bgColorKey: 'pattern', // 'black' | 'white' | 'pattern' | 'green' | 'red' | 'yellow' | 'blue'

            // 播放状态
            isPlaying: false,
            progress: 0, // 0-100
            currentFrame: 0,
            totalFrames: 0,

            // SVGA 状态
            svga: {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: '',
                fps: null,
                sizeWH: '',
                duration: '',
                memoryText: ''
              }
            },

            // YYEVA 状态
            yyeva: {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: '',
                fps: null,
                sizeWH: '',
                duration: ''
              },
              alphaPosition: 'right', // 'left' | 'right' - alpha通道在左边还是右边
              originalWidth: 0,  // 视频原始宽度
              originalHeight: 0, // 视频原始高度
              displayWidth: 0,   // 显示宽度（原始宽度/2）
              displayHeight: 0   // 显示高度
            },
            
            // YYEVA 播放器实例
            yyevaVideo: null,
            yyevaCanvas: null,
            yyevaCtx: null,
            yyevaAnimationId: null,
            yyevaObjectUrl: null,

            // Lottie 状态（阶段1占位）
            lottie: {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: ''
              }
            },

            // 播放器实例
            svgaPlayer: null,
            svgaParser: null,
            svgaObjectUrl: null,
            
            // 空状态SVGA播放器
            emptyStateSvgaPlayer: null,
            emptyStateSvgaParser: null,

            // 素材替换
            showMaterialPanel: false,
            materialList: [],
            materialSearchQuery: '',
            originalVideoItem: null,
            replacedImages: {},
            
            // 音频数据（从原始SVGA文件提取）
            svgaAudioData: null, // { audioKey: Uint8Array }
            svgaMovieData: null, // protobuf解析后的MovieEntity

            // GIF 导出状态
            isExportingGIF: false,
            gifExportProgress: 0,

            // MP4 转换配置
            showMP4Panel: false,
            showChannelModeDropdown: false,
            mp4Config: {
              channelMode: 'color-left-alpha-right', // 'color-left-alpha-right' | 'alpha-left-color-right'
              width: 0,
              height: 0,
              quality: 80, // 0-100
              fps: 30, // 1-120
              muted: false
            },
            isConvertingMP4: false,
            mp4ConvertProgress: 0,
            mp4ConvertStage: '', // 'loading' | 'extracting' | 'composing' | 'encoding' | 'done'
            mp4ConvertMessage: '',
            mp4ConvertCancelled: false,
            ffmpeg: null,
            ffmpegLoaded: false,
            ffmpegLoading: false,
            
            // 库加载管理
            libraryLoader: {
              queue: [], // 加载队列
              loading: false, // 是否正在加载
              currentLib: null, // 当前加载的库 { name, url, progress }
              loadedLibs: {} // 已加载的库 { libName: true }
            }
          };
        },
        methods: {
          /* 库加载管理器 */
          
          // 获取库配置
          getLibraryConfig: function() {
            return {
              'vue': {
                name: 'Vue.js',
                url: 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js',
                checkFn: function() { return typeof Vue !== 'undefined'; },
                priority: 0, // 核心库，已预加载
                preload: true
              },
              'svgaplayer': {
                name: 'SVGA播放器',
                url: 'https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js',
                checkFn: function() { return typeof SVGA !== 'undefined'; },
                priority: 1, // 核心库，已预加载
                preload: true
              },
              'lottie': {
                name: 'Lottie播放器',
                url: 'https://cdn.jsdelivr.net/npm/lottie-web@5.7.6/build/player/lottie.min.js',
                checkFn: function() { return typeof lottie !== 'undefined'; },
                priority: 5
              },
              'howler': {
                name: 'Howler音频',
                url: 'https://cdn.jsdelivr.net/npm/howler@2.0.15/dist/howler.core.min.js',
                checkFn: function() { return typeof Howl !== 'undefined'; },
                priority: 5
              },
              'marked': {
                name: '帮助文档',
                url: 'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js',
                checkFn: function() { return typeof marked !== 'undefined'; },
                priority: 10
              },
              'gif': {
                name: 'GIF导出',
                url: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js',
                checkFn: function() { return typeof GIF !== 'undefined'; },
                priority: 20
              },
              'protobuf': {
                name: 'Protobuf',
                url: 'https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js',
                checkFn: function() { return typeof protobuf !== 'undefined'; },
                priority: 20
              },
              'pako': {
                name: 'Pako',
                url: 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
                checkFn: function() { return typeof pako !== 'undefined'; },
                priority: 20
              },
              'svgaweb': {
                name: 'SVGA-Web',
                url: 'https://cdn.jsdelivr.net/npm/svga-web@1.0.3/dist/svga-web.min.js',
                checkFn: function() { return typeof SVGAWeb !== 'undefined'; },
                priority: 20
              },
              'ffmpeg': {
                name: 'FFmpeg',
                url: 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
                checkFn: function() { return typeof FFmpeg !== 'undefined'; },
                priority: 30
              }
            };
          },
          
          // 加载单个库
          loadSingleLibrary: function(libKey, highPriority) {
            var _this = this;
            var config = this.getLibraryConfig()[libKey];
            
            if (!config) {
              return Promise.reject(new Error('未知的库: ' + libKey));
            }
            
            // 如果已加载，直接返回
            if (this.libraryLoader.loadedLibs[libKey] || (config.checkFn && config.checkFn())) {
              this.libraryLoader.loadedLibs[libKey] = true;
              return Promise.resolve();
            }
            
            return new Promise(function(resolve, reject) {
              _this.libraryLoader.currentLib = {
                name: config.name,
                url: config.url,
                progress: 0
              };
              
              var script = document.createElement('script');
              script.src = config.url;
              
              script.onload = function() {
                _this.libraryLoader.currentLib.progress = 50;
                
                // 等待全局变量可用
                var maxWait = 30;
                var check = function() {
                  if (!config.checkFn || config.checkFn()) {
                    _this.libraryLoader.currentLib.progress = 100;
                    setTimeout(function() {
                      _this.libraryLoader.currentLib = null;
                      _this.libraryLoader.loadedLibs[libKey] = true;
                      resolve();
                    }, 300); // 显示100%后稍等
                  } else if (maxWait-- > 0) {
                    var progress = 50 + (30 - maxWait) * 1.5;
                    _this.libraryLoader.currentLib.progress = Math.min(99, Math.round(progress));
                    setTimeout(check, 100);
                  } else {
                    _this.libraryLoader.currentLib = null;
                    reject(new Error('库加载超时: ' + libKey));
                  }
                };
                check();
              };
              
              script.onerror = function() {
                _this.libraryLoader.currentLib = null;
                reject(new Error('加载失败: ' + config.url));
              };
              
              document.head.appendChild(script);
            });
          },
          
          // 加载库（统一入口）
          loadLibrary: function(libKeys, highPriority) {
            var _this = this;
            if (typeof libKeys === 'string') {
              libKeys = [libKeys];
            }
            
            return new Promise(function(resolve, reject) {
              var loadTask = {
                libs: libKeys,
                priority: highPriority ? 0 : 10,
                resolve: resolve,
                reject: reject
              };
              
              // 高优先级插队到队列最前面
              if (highPriority) {
                _this.libraryLoader.queue.unshift(loadTask);
              } else {
                _this.libraryLoader.queue.push(loadTask);
              }
              
              _this.processLibraryQueue();
            });
          },
          
          // 处理加载队列
          processLibraryQueue: function() {
            var _this = this;
            
            // 如果正在加载，不重复处理
            if (this.libraryLoader.loading || this.libraryLoader.queue.length === 0) {
              return;
            }
            
            this.libraryLoader.loading = true;
            
            // 按优先级排序
            this.libraryLoader.queue.sort(function(a, b) {
              return a.priority - b.priority;
            });
            
            var task = this.libraryLoader.queue.shift();
            
            // 顺序加载所有库
            var loadChain = Promise.resolve();
            
            task.libs.forEach(function(libKey) {
              loadChain = loadChain.then(function() {
                return _this.loadSingleLibrary(libKey, task.priority === 0);
              });
            });
            
            loadChain
              .then(function() {
                task.resolve();
                _this.libraryLoader.loading = false;
                _this.processLibraryQueue(); // 继续处理队列
              })
              .catch(function(error) {
                console.error('库加载失败:', error);
                task.reject(error);
                _this.libraryLoader.loading = false;
                _this.processLibraryQueue(); // 继续处理队列
              });
          },
          
          // 预加载非关键库
          preloadLibraries: function() {
            var _this = this;
            // Lottie 和 Howler 是次要功能，优先级较高
            this.loadLibrary(['lottie', 'howler'], false)
              .then(function() {
                console.log('Lottie 和 Howler 加载完成');
              })
              .catch(function(error) {
                console.warn('部分库加载失败:', error);
              });
          },
          
          /* 动态加载库文件 */
          
          loadScript: function(url, checkFn) {
            return new Promise(function(resolve, reject) {
              // 如果已加载，直接返回
              if (checkFn && checkFn()) {
                resolve();
                return;
              }
              var script = document.createElement('script');
              script.src = url;
              script.onload = function() {
                // 等待全局变量可用
                var maxWait = 30;
                var check = function() {
                  if (!checkFn || checkFn()) {
                    resolve();
                  } else if (maxWait-- > 0) {
                    setTimeout(check, 100);
                  } else {
                    reject(new Error('库加载超时'));
                  }
                };
                check();
              };
              script.onerror = function() {
                reject(new Error('加载失败: ' + url));
              };
              document.head.appendChild(script);
            });
          },
          
          // 加载Marked.js
          loadMarked: function() {
            return this.loadScript(
              'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js',
              function() { return typeof marked !== 'undefined'; }
            );
          },
          
          // 加载GIF.js
          loadGifJs: function() {
            return this.loadScript(
              'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js',
              function() { return typeof GIF !== 'undefined'; }
            );
          },
          
          // 加载Protobuf + Pako
          loadProtobufAndPako: function() {
            var _this = this;
            return Promise.all([
              this.loadScript(
                'https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js',
                function() { return typeof protobuf !== 'undefined'; }
              ),
              this.loadScript(
                'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
                function() { return typeof pako !== 'undefined'; }
              )
            ]);
          },
          
          // 加载SVGA-Web（用于帧提取）
          loadSvgaWeb: function() {
            return this.loadScript(
              'https://cdn.jsdelivr.net/npm/svga-web@2.4.2/svga-web.min.js',
              function() { return typeof SVGA !== 'undefined' && SVGA.Downloader; }
            );
          },

          /* 拖拽上传 */

          onDragOver: function () {
            this.dropHover = true;
          },
          onDragLeave: function () {
            this.dropHover = false;
          },
          onDrop: function (event) {
            this.dropHover = false;
            var files = event.dataTransfer && event.dataTransfer.files;
            if (!files || !files.length) return;
            this.handleFile(files[0]);
          },

          triggerFileUpload: function () {
            this.$refs.fileInput.click();
          },

          onFileSelect: function (event) {
            var files = event.target.files;
            if (!files || !files.length) return;
            this.handleFile(files[0]);
            // 清空input，允许重复选择同一文件
            event.target.value = '';
          },

          handleFile: function (file) {
            var name = (file.name || '').toLowerCase();

            if (name.endsWith('.svga')) {
              this.loadSvga(file);
            } else if (name.endsWith('.json')) {
              this.loadLottiePlaceholder(file);
            } else if (name.endsWith('.mp4')) {
              this.loadYyevaPlaceholder(file);
            } else {
              alert('不支持的文件类型，只支持 .svga / .json / .mp4');
            }
          },

          /* 模块切换 */
          switchModule: function (key) {
            this.currentModule = key;
          },

          triggerReuploadSVGA: function () {
            // 触发隐藏的文件输入框
            if (this.$refs.reuploadSvgaInput) {
              this.$refs.reuploadSvgaInput.click();
            }
          },
          
          handleReuploadSVGA: function (event) {
            var file = event.target.files[0];
            if (!file) return;
            
            // 检查文件格式
            if (!file.name.toLowerCase().endsWith('.svga')) {
              alert('请选择 .svga 文件');
              event.target.value = ''; // 清空输入
              return;
            }
            
            // 重用现有的加载逻辑
            this.loadSvga(file);
            
            // 清空输入，允许重复选择同一文件
            event.target.value = '';
          },
          
          // 触发更换预览文件（支持SVGA和MP4）
          triggerChangePreviewFile: function () {
            if (this.$refs.changePreviewFileInput) {
              this.$refs.changePreviewFileInput.click();
            }
          },
          
          // 处理更换预览文件
          handleChangePreviewFile: function (event) {
            var file = event.target.files[0];
            if (!file) return;
            
            var name = file.name.toLowerCase();
            if (name.endsWith('.svga')) {
              this.loadSvga(file);
            } else if (name.endsWith('.mp4')) {
              this.loadYyevaPlaceholder(file);
            } else {
              alert('不支持的文件格式，请选择 .svga 或 .mp4 文件');
            }
            
            // 清空输入，允许重复选择同一文件
            event.target.value = '';
          },

          /* 清空画布 */
          clearAll: function () {
            if (this.svgaPlayer) {
              try {
                this.svgaPlayer.stopAnimation();
                this.svgaPlayer.clear();
              } catch (e) {}
              this.svgaPlayer = null;
            }
            if (this.svgaObjectUrl) {
              URL.revokeObjectURL(this.svgaObjectUrl);
              this.svgaObjectUrl = null;
            }
            
            // 清理 YYEVA 资源
            this.cleanupYyeva();
            
            // 清空画布容器，恢复到空状态
            var container = this.$refs.svgaContainer;
            if (container) {
              container.innerHTML = '';
            }

            this.svga = {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: '',
                fps: null,
                sizeWH: '',
                duration: '',
                memoryText: ''
              }
            };
            this.lottie = {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: ''
              }
            };

            this.isPlaying = false;
            this.progress = 0;
            this.currentFrame = 0;
            this.totalFrames = 0;
            this.bgColorKey = 'pattern';
            
            // 关闭侧边栏
            this.showMaterialPanel = false;
            this.showMP4Panel = false;
            
            // 重置模块状态
            this.currentModule = 'svga';
            
            // 重新初始化空状态的随机SVGA动画
            var _this = this;
            this.$nextTick(function() {
              _this.initEmptyStateSvgaPlayer();
            });
          },

          /* SVGA 加载与播放 */

          loadHelpContent: function () {
            var _this = this;
            // 先加载Marked库（低优先级，后台加载），再加载帮助文档
            this.loadLibrary('marked', false).then(function() {
              return fetch('./help.md');
            }).then(function(response) {
              return response.text();
            }).then(function(markdown) {
              _this.helpContent = marked.parse(markdown);
            }).catch(function(error) {
              console.error('加载帮助文档失败:', error);
              _this.helpContent = '<p>无法加载帮助文档</p>';
            });
          },

          initSvgaPlayer: function () {
            var container = this.$refs.svgaContainer;
            if (!container) return;
            this.svgaPlayer = new SVGA.Player(container);
            this.svgaParser = new SVGA.Parser();
          },
          
          initEmptyStateSvgaPlayer: function () {
            var _this = this;
            var container = this.$refs.emptyStateSvgaContainer;
            if (!container) {
              // 如果容器还没有渲染，等待DOM更新后重试
              this.$nextTick(function() {
                _this.initEmptyStateSvgaPlayer();
              });
              return;
            }
            
            // 创建空状态SVGA播放器
            this.emptyStateSvgaPlayer = new SVGA.Player(container);
            this.emptyStateSvgaParser = new SVGA.Parser();
            
            // 动态读取SVGA文件列表
            fetch('assets/svga/file-list.json')
              .then(function(response) {
                if (!response.ok) {
                  throw new Error('无法加载文件列表');
                }
                return response.json();
              })
              .then(function(fileList) {
                if (!fileList || fileList.length === 0) {
                  console.warn('没有配置空状态SVGA文件');
                  return;
                }
                
                // 随机选择一个文件
                var randomIndex = Math.floor(Math.random() * fileList.length);
                var fileName = fileList[randomIndex];
                var svgaUrl = 'assets/svga/' + fileName;
                
                // 加载并播放SVGA
                _this.emptyStateSvgaParser.load(svgaUrl, function(videoItem) {
                  _this.emptyStateSvgaPlayer.setVideoItem(videoItem);
                  _this.emptyStateSvgaPlayer.startAnimation();
                }, function(error) {
                  console.error('加载空状态SVGA失败:', error);
                });
              })
              .catch(function(error) {
                console.error('读取SVGA文件列表失败:', error);
              });
          },

          loadSvga: function (file) {
            var _this = this;
            this.currentModule = 'svga';

            // 重置视图状态（垂直位置会在加载完成后动态计算）
            this.viewerScale = 1;
            this.viewerOffsetX = 0;
            this.viewerOffsetY = 0;

            this.svga.hasFile = true;
            this.svga.file = file;
            this.svga.fileInfo.name = file.name;
            this.svga.fileInfo.size = file.size;
            this.svga.fileInfo.sizeText = this.formatBytes(file.size);

            this.progress = 0;
            this.currentFrame = 0;
            this.totalFrames = 0;
            this.isPlaying = false;

            var reader = new FileReader();
            reader.onload = function (e) {
              var arrayBuffer = e.target.result;
              
              // 同步解析SVGA二进制数据以提取音频
              _this.parseSvgaAudioData(arrayBuffer);
              
              var blob = new Blob([arrayBuffer], {
                type: 'application/octet-stream'
              });
              if (_this.svgaObjectUrl) {
                URL.revokeObjectURL(_this.svgaObjectUrl);
              }
              _this.svgaObjectUrl = URL.createObjectURL(blob);

              _this.svgaParser.load(
                _this.svgaObjectUrl,
                function (videoItem) {
                  _this.onSvgaLoaded(videoItem);
                },
                function () {
                  alert('SVGA 解析失败');
                }
              );
            };
            reader.readAsArrayBuffer(file);
          },

          onSvgaLoaded: function (videoItem) {
            if (!this.svgaPlayer) {
              this.initSvgaPlayer();
            }
            if (!this.svgaPlayer) return;

            var _this = this;
            
            // 保存原始 videoItem 以便后续素材替换
            this.originalVideoItem = videoItem;
            
            // 提取素材列表
            this.extractMaterialList(videoItem);

            try {
              if (videoItem.videoSize) {
                var w = videoItem.videoSize.width || 0;
                var h = videoItem.videoSize.height || 0;
                _this.svga.fileInfo.sizeWH = w + ' × ' + h;
              }
              _this.svga.fileInfo.fps = videoItem.FPS || videoItem.fps || null;
              var frames =
                videoItem.frames ||
                videoItem.framesCount ||
                videoItem.framesLength ||
                0;
              _this.totalFrames = frames;

              if (_this.svga.fileInfo.fps && frames) {
                var dur = (frames / _this.svga.fileInfo.fps).toFixed(1);
                _this.svga.fileInfo.duration = dur + 's';
              }

              // 计算内存占用：基于实际的图片素材（images），而不是sprites数量
              // SVGA 是矢量动画，使用 sprite 图片，不是每帧都有完整位图
              // 需要计算图片解码后的位图内存（RGBA格式，每像素4字节）
              // 注意：一个图片可能被多个sprite使用，所以要基于唯一的imageKey计算
              if (videoItem.images) {
                var imageKeys = Object.keys(videoItem.images);
                var imageCount = imageKeys.length;
                
                if (imageCount > 0 && videoItem.sprites && videoItem.sprites.length > 0) {
                  var totalBytes = 0;
                  var imageLayoutMap = {}; // imageKey -> layout尺寸
                  var failedKeys = []; // 无法获取尺寸的imageKey
                  
                  // 第一步：遍历所有sprites，为每个唯一的imageKey找到其layout尺寸
                  videoItem.sprites.forEach(function(sprite) {
                    if (sprite && sprite.imageKey) {
                      var imgKey = sprite.imageKey;
                      
                      // 如果这个imageKey还没有尺寸信息，尝试获取
                      if (!imageLayoutMap[imgKey]) {
                        var imgWidth = 0;
                        var imgHeight = 0;
                        
                        // 从第一帧的layout获取
                        if (sprite.frames && sprite.frames.length > 0) {
                          var firstFrame = sprite.frames[0];
                          if (firstFrame.layout) {
                            imgWidth = firstFrame.layout.width || 0;
                            imgHeight = firstFrame.layout.height || 0;
                          }
                        }
                        
                        // 如果没有layout，尝试从frameRect获取
                        if ((imgWidth === 0 || imgHeight === 0) && sprite.frameRect) {
                          imgWidth = sprite.frameRect.width || 0;
                          imgHeight = sprite.frameRect.height || 0;
                        }
                        
                        if (imgWidth > 0 && imgHeight > 0) {
                          imageLayoutMap[imgKey] = { width: imgWidth, height: imgHeight };
                        }
                      }
                    }
                  });
                  
                  // 第二步：为每个imageKey计算内存
                  // 对于没有找到sprite的图片，使用图片本身的数据来创建Image获取尺寸
                  var processedCount = 0;
                  var needLoadCount = 0;
                  
                  imageKeys.forEach(function(imgKey) {
                    if (imageLayoutMap[imgKey]) {
                      var layout = imageLayoutMap[imgKey];
                      var bytes = layout.width * layout.height * 4;
                      totalBytes += bytes;
                      processedCount++;
                    } else {
                      // 尝试从图片数据本身获取尺寸
                      var imgData = videoItem.images[imgKey];
                      if (imgData && typeof imgData === 'string') {
                        needLoadCount++;
                        var img = new Image();
                        img.onload = (function(key) {
                          return function() {
                            var bytes = this.width * this.height * 4;
                            totalBytes += bytes;
                            processedCount++;
                            
                            // 所有图片处理完成后更新显示
                            if (processedCount === imageCount) {
                              var mb = totalBytes / 1048576;
                              _this.svga.fileInfo.memoryText = mb.toFixed(2) + 'M';
                            }
                          };
                        })(imgKey);
                        img.onerror = (function(key) {
                          return function() {
                            processedCount++;
                            if (processedCount === imageCount) {
                              var mb = totalBytes / 1048576;
                              _this.svga.fileInfo.memoryText = mb.toFixed(2) + 'M';
                            }
                          };
                        })(imgKey);
                        // 添加data:image前缀（如果需要）
                        img.src = imgData.startsWith('data:') ? imgData : ('data:image/png;base64,' + imgData);
                      } else {
                        failedKeys.push(imgKey);
                      }
                    }
                  });
                  
                  // 如果所有图片都同步处理完成，立即更新显示
                  if (processedCount === imageCount && totalBytes > 0) {
                    var mb = totalBytes / 1048576;
                    _this.svga.fileInfo.memoryText = mb.toFixed(2) + 'M';
                  } else if (needLoadCount > 0) {
                    _this.svga.fileInfo.memoryText = '计算中...';
                  } else if (totalBytes === 0) {
                    _this.svga.fileInfo.memoryText = '-';
                  }
                } else {
                  _this.svga.fileInfo.memoryText = '-';
                }
              } else if (w && h && frames) {
                // 降级方案：如果没有 images 信息，使用帧数估算（但这通常会高估）
                var bytes = w * h * 4 * frames;
                var mb = bytes / 1048576;
                _this.svga.fileInfo.memoryText = mb.toFixed(2) + 'M (估算)';
              }
            } catch (e) {}

            this.svgaPlayer.setVideoItem(videoItem);
            this.svgaPlayer.setContentMode('AspectFit');
            this.svgaPlayer.clearDynamicObjects();

            this.svgaPlayer.onFrame(function (frame) {
              _this.currentFrame = frame;
              if (_this.totalFrames > 0) {
                var p = (frame / (_this.totalFrames - 1)) * 100;
                _this.progress = Math.max(0, Math.min(100, Math.round(p)));
              }
            });

            this.svgaPlayer.onFinished(function () {
              _this.isPlaying = false;
            });

            // 延迟300ms再播放，等待底部浮层宽度过渡动画完成
            var _this2 = this;
            setTimeout(function() {
              _this2.svgaPlayer.startAnimation();
              _this2.isPlaying = true;
            }, 300);

            this.applyCanvasBackground();
            
            // 动态计算居中位置
            var _this2 = this;
            this.$nextTick(function() {
              _this2.centerViewer();
            });
          },

          togglePlay: function () {
            // YYEVA 模式
            if (this.currentModule === 'yyeva' && this.yyeva.hasFile && this.yyevaVideo) {
              if (this.isPlaying) {
                this.yyevaVideo.pause();
                if (this.yyevaAnimationId) {
                  cancelAnimationFrame(this.yyevaAnimationId);
                  this.yyevaAnimationId = null;
                }
                this.isPlaying = false;
              } else {
                var _this = this;
                this.yyevaVideo.play().then(function() {
                  _this.isPlaying = true;
                  _this.startYyevaRenderLoop();
                });
              }
              return;
            }
            
            // SVGA 模式
            if (!this.svgaPlayer || !this.svga.hasFile) return;
            if (this.isPlaying) {
              try {
                this.svgaPlayer.pauseAnimation();
              } catch (e) {}
              this.isPlaying = false;
            } else {
              try {
                var currentPercentage = this.progress / 100;
                this.svgaPlayer.stepToPercentage(currentPercentage, true);
              } catch (e) {}
              this.isPlaying = true;
            }
          },

          onProgressBarClick: function (event) {
            var rect = event.currentTarget.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var p = x / rect.width;
            p = Math.max(0, Math.min(1, p));
            this.progress = Math.round(p * 100);
            
            // YYEVA 模式
            if (this.currentModule === 'yyeva' && this.yyeva.hasFile && this.yyevaVideo) {
              var duration = this.yyevaVideo.duration || 1;
              this.yyevaVideo.currentTime = p * duration;
              this.currentFrame = Math.round(p * this.totalFrames);
              return;
            }
            
            // SVGA 模式
            if (!this.svgaPlayer || !this.svga.hasFile) return;
            
            // 计算并立即更新当前帧数
            if (this.totalFrames > 0) {
              this.currentFrame = Math.round(p * (this.totalFrames - 1));
            }
            
            try {
              this.svgaPlayer.stepToPercentage(p, this.isPlaying);
            } catch (e) {}
          },

          /* Lottie / YYEVA 阶段1占位逻辑 */

          loadLottiePlaceholder: function (file) {
            // 重置视图状态
            this.viewerScale = 1;
            this.viewerOffsetX = 0;
            this.centerViewer();

            this.lottie.hasFile = true;
            this.lottie.file = file;
            this.lottie.fileInfo.name = file.name;
            this.lottie.fileInfo.size = file.size;
            this.lottie.fileInfo.sizeText = this.formatBytes(file.size);
            this.currentModule = 'lottie';
            alert('Lottie 模块将在后续阶段实现播放逻辑');
          },

          loadYyevaPlaceholder: function (file) {
            var _this = this;
            
            // 释放之前的资源
            this.cleanupYyeva();
            
            // 重置视图状态
            this.viewerScale = 1;
            this.viewerOffsetX = 0;
            this.viewerOffsetY = 0;

            this.yyeva.hasFile = true;
            this.yyeva.file = file;
            this.yyeva.fileInfo.name = file.name;
            this.yyeva.fileInfo.size = file.size;
            this.yyeva.fileInfo.sizeText = this.formatBytes(file.size);
            this.currentModule = 'yyeva';
            
            // 创建objectUrl
            this.yyevaObjectUrl = URL.createObjectURL(file);
            
            // 创建视频元素
            var video = document.createElement('video');
            video.src = this.yyevaObjectUrl;
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            this.yyevaVideo = video;
            
            // 加载视频元数据
            video.onloadedmetadata = function() {
              var videoWidth = video.videoWidth;
              var videoHeight = video.videoHeight;
              
              _this.yyeva.originalWidth = videoWidth;
              _this.yyeva.originalHeight = videoHeight;
              
              // 自动识别 alpha 位置：左右并排的视频宽度是高度的约两倍
              if (videoWidth > videoHeight * 1.5) {
                // 左右并排布局
                _this.yyeva.displayWidth = Math.floor(videoWidth / 2);
                _this.yyeva.displayHeight = videoHeight;
                // 检测 alpha 在左还是在右（通过分析第一帧）
                _this.detectAlphaPosition(video);
              } else {
                // 上下并排或普通视频（暂不支持）
                alert('不支持的视频格式，请上传左右并排布局的YYEVA-MP4文件');
                _this.cleanupYyeva();
                return;
              }
              
              // 设置显示信息
              _this.yyeva.fileInfo.sizeWH = _this.yyeva.displayWidth + 'x' + _this.yyeva.displayHeight;
              
              // 计算帧率和时长
              var duration = video.duration;
              _this.yyeva.fileInfo.duration = duration.toFixed(2) + 's';
              // 假设30fps（MP4没有直接获取帧率的方法）
              _this.yyeva.fileInfo.fps = '30 FPS';
              _this.totalFrames = Math.round(duration * 30);
              
              // 初始化Canvas
              _this.initYyevaCanvas();
              
              // 延迟300ms再播放，等待底部浮层宽度过渡动画完成
              setTimeout(function() {
                video.play().then(function() {
                  _this.isPlaying = true;
                  _this.startYyevaRenderLoop();
                }).catch(function(err) {
                  console.error('YYEVA播放失败:', err);
                });
              }, 300);
            };
            
            video.onerror = function() {
              alert('视频加载失败，请检查文件格式');
              _this.cleanupYyeva();
            };
            
            video.load();
          },
          
          // 检测 alpha 通道位置
          detectAlphaPosition: function(video) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var halfWidth = Math.floor(video.videoWidth / 2);
            var height = video.videoHeight;
            
            canvas.width = video.videoWidth;
            canvas.height = height;
            ctx.drawImage(video, 0, 0);
            
            // 取左侧中心区域的像素
            var leftData = ctx.getImageData(halfWidth / 4, height / 4, 10, 10);
            // 取右侧中心区域的像素
            var rightData = ctx.getImageData(halfWidth + halfWidth / 4, height / 4, 10, 10);
            
            // 计算色彩方差（灰度图的RGB将非常接近）
            var leftVariance = this.calculateColorVariance(leftData.data);
            var rightVariance = this.calculateColorVariance(rightData.data);
            
            // 方差小的一侧更可能是灰度图（Alpha通道）
            if (leftVariance < rightVariance) {
              this.yyeva.alphaPosition = 'left';
            } else {
              this.yyeva.alphaPosition = 'right';
            }
          },
          
          // 计算色彩方差
          calculateColorVariance: function(data) {
            var variance = 0;
            for (var i = 0; i < data.length; i += 4) {
              var r = data[i];
              var g = data[i + 1];
              var b = data[i + 2];
              // 计算RGB差异
              var diff = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
              variance += diff;
            }
            return variance;
          },
          
          // 初始化 YYEVA Canvas
          initYyevaCanvas: function() {
            var container = this.$refs.svgaContainer;
            if (!container) return;
            
            // 清空容器
            container.innerHTML = '';
            
            // 创建Canvas
            var canvas = document.createElement('canvas');
            canvas.width = this.yyeva.displayWidth;
            canvas.height = this.yyeva.displayHeight;
            canvas.style.width = this.yyeva.displayWidth + 'px';
            canvas.style.height = this.yyeva.displayHeight + 'px';
            container.appendChild(canvas);
            
            this.yyevaCanvas = canvas;
            this.yyevaCtx = canvas.getContext('2d');
          },
          
          // YYEVA 渲染循环
          startYyevaRenderLoop: function() {
            var _this = this;
            
            function render() {
              if (!_this.yyevaVideo || !_this.yyevaCanvas || !_this.yyevaCtx) {
                return;
              }
              
              _this.renderYyevaFrame();
              _this.updateYyevaProgress();
              
              _this.yyevaAnimationId = requestAnimationFrame(render);
            }
            
            render();
          },
          
          // 渲染 YYEVA 帧
          renderYyevaFrame: function() {
            var video = this.yyevaVideo;
            var canvas = this.yyevaCanvas;
            var ctx = this.yyevaCtx;
            
            if (!video || !canvas || !ctx) return;
            
            var halfWidth = Math.floor(video.videoWidth / 2);
            var height = video.videoHeight;
            
            // 确定彩色和Alpha的位置
            var colorX = this.yyeva.alphaPosition === 'right' ? 0 : halfWidth;
            var alphaX = this.yyeva.alphaPosition === 'right' ? halfWidth : 0;
            
            // 创建临时Canvas用于提取数据
            var tempCanvas = document.createElement('canvas');
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = height;
            var tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(video, 0, 0);
            
            // 提取彩色和Alpha数据
            var colorData = tempCtx.getImageData(colorX, 0, halfWidth, height);
            var alphaData = tempCtx.getImageData(alphaX, 0, halfWidth, height);
            
            // 合成透明通道
            for (var i = 0; i < colorData.data.length; i += 4) {
              // 使用Alpha通道的R值作为透明度
              colorData.data[i + 3] = alphaData.data[i];
            }
            
            // 绘制到显示Canvas
            ctx.putImageData(colorData, 0, 0);
          },
          
          // 更新 YYEVA 进度
          updateYyevaProgress: function() {
            if (!this.yyevaVideo) return;
            
            var video = this.yyevaVideo;
            var currentTime = video.currentTime;
            var duration = video.duration || 1;
            
            this.progress = (currentTime / duration) * 100;
            this.currentFrame = Math.round(currentTime * 30); // 假设30fps
          },
          
          // 清理 YYEVA 资源
          cleanupYyeva: function() {
            if (this.yyevaAnimationId) {
              cancelAnimationFrame(this.yyevaAnimationId);
              this.yyevaAnimationId = null;
            }
            
            if (this.yyevaVideo) {
              // 先移除事件监听，避免设置src=''时触发onerror
              this.yyevaVideo.onerror = null;
              this.yyevaVideo.onloadedmetadata = null;
              this.yyevaVideo.pause();
              this.yyevaVideo.src = '';
              this.yyevaVideo = null;
            }
            
            if (this.yyevaObjectUrl) {
              URL.revokeObjectURL(this.yyevaObjectUrl);
              this.yyevaObjectUrl = null;
            }
            
            this.yyevaCanvas = null;
            this.yyevaCtx = null;
            
            this.yyeva = {
              hasFile: false,
              file: null,
              fileInfo: {
                name: '',
                size: 0,
                sizeText: '',
                fps: null,
                sizeWH: '',
                duration: ''
              },
              alphaPosition: 'right',
              originalWidth: 0,
              originalHeight: 0,
              displayWidth: 0,
              displayHeight: 0
            };
          },

          /* 主题切换 */

          toggleTheme: function () {
            this.isDarkMode = !this.isDarkMode;
            if (this.isDarkMode) {
              document.body.classList.add('dark-mode');
              localStorage.setItem('theme', 'dark');
            } else {
              document.body.classList.remove('dark-mode');
              localStorage.setItem('theme', 'light');
            }
          },

          /* 缩放 + 平移 */

          onWheel: function (event) {
            // 支持鼠标滚轮直接缩放，或 Ctrl+滚轮缩放
            event.preventDefault();
            var delta = event.deltaY || event.wheelDelta;
            var step = delta > 0 ? -0.1 : 0.1;
            var next = this.viewerScale + step;
            if (next < 0.2) next = 0.2;
            if (next > 5) next = 5;
            this.viewerScale = next;
          },

          onMouseDown: function (event) {
            // 支持鼠标左键(0)和中键(1)拖动画布
            if (event.button !== 0 && event.button !== 1) return;
            event.preventDefault();
            this.dragging = true;
            this.dragStartX = event.clientX;
            this.dragStartY = event.clientY;
            this.dragStartOffsetX = this.viewerOffsetX;
            this.dragStartOffsetY = this.viewerOffsetY;
          },

          onMouseMove: function (event) {
            if (!this.dragging) return;
            var dx = event.clientX - this.dragStartX;
            var dy = event.clientY - this.dragStartY;
            this.viewerOffsetX = this.dragStartOffsetX + dx;
            this.viewerOffsetY = this.dragStartOffsetY + dy;
          },

          onMouseUp: function () {
            this.dragging = false;
          },

          resetScale: function () {
            this.viewerScale = 1;
            this.viewerOffsetX = 0;
            this.centerViewer();
          },
          
          // 动态计算播放器垂直居中位置，避免被底部浮层遮挡
          centerViewer: function () {
            var viewerArea = document.querySelector('.viewer-area');
            var footerBar = document.querySelector('.footer-bar');
            
            if (!viewerArea || !footerBar) {
              // DOM未准备好时使用默认值
              this.viewerOffsetY = -100;
              return;
            }
            
            var footerHeight = footerBar.offsetHeight || 160; // 底部浮层高度
            
            // 将播放器向上偏移，使其在有效可视区域内居中
            // 偏移量 = 底部浮层高度 / 2
            this.viewerOffsetY = -footerHeight / 2;
          },
          
          zoomIn: function () {
            // 放大，每次增加 10%，围绕播放器中心点缩放
            this.viewerScale = Math.min(this.viewerScale + 0.1, 5);
          },
          
          zoomOut: function () {
            // 缩小，每次减少 10%，围绕播放器中心点缩放
            this.viewerScale = Math.max(this.viewerScale - 0.1, 0.1);
          },

          applyCanvasBackground: function () {
            var container = this.$refs.svgaContainer;
            if (!container) return;
            var canvas = container.querySelector('canvas');
            if (canvas) {
              if (this.bgColorKey === 'pattern') {
                // pattern模式：完全清除canvas背景，显示画布颜色
                canvas.style.backgroundColor = '';
                canvas.style.backgroundImage = '';
                canvas.style.backgroundRepeat = '';
                canvas.style.backgroundSize = '';
              } else {
                canvas.style.backgroundColor = this.currentBgColor;
                canvas.style.backgroundImage = 'none';
              }
            }
          },

          /* 素材替换功能 */

          openMaterialPanel: function () {
            if (!this.svga.hasFile || !this.originalVideoItem) return;
            // 关闭MP4弹窗（互斥显示）
            this.showMP4Panel = false;
            // 切换侧边栏显示状态：如果已打开则关闭，否则打开
            this.showMaterialPanel = !this.showMaterialPanel;
          },

          closeMaterialPanel: function () {
            this.showMaterialPanel = false;
          },
          
          copyMaterialName: function (name) {
            var _this = this;
            // 使用 Clipboard API 复制文本
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(name).catch(function(err) {
                console.error('复制失败:', err);
              });
            } else {
              // 降级方案：使用 textarea
              var textarea = document.createElement('textarea');
              textarea.value = name;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.select();
              try {
                document.execCommand('copy');
              } catch (err) {
                console.error('复制失败:', err);
              }
              document.body.removeChild(textarea);
            }
          },
          
          /* 解析SVGA二进制数据以提取音频 */
          parseSvgaAudioData: async function (arrayBuffer) {
            var _this = this;
            
            // 动态加载 protobuf 和 pako
            try {
              await this.loadLibrary(['protobuf', 'pako'], true)
            } catch (err) {
              // 加载失败时静默跳过音频提取
              return;
            }
            
            try {
              var uint8Array = new Uint8Array(arrayBuffer);
              var inflatedData = pako.inflate(uint8Array);
              
              protobuf.load('svga.proto', function(err, root) {
                if (err) return;
                
                try {
                  var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');
                  var movieData = MovieEntity.decode(inflatedData);
                  _this.svgaMovieData = movieData;
                  
                  // 提取音频数据
                  if (movieData.audios && movieData.audios.length > 0 && movieData.images) {
                    var audioData = {};
                    movieData.audios.forEach(function(audio) {
                      var audioKey = audio.audioKey;
                      
                      // 尝试多种可能的key格式
                      var possibleKeys = [
                        audioKey,
                        audioKey + '.mp3',
                        audioKey + '.wav',
                        'audio_' + audioKey,
                        audioKey.replace(/\.[^.]+$/, '')
                      ];
                      
                      possibleKeys.forEach(function(key) {
                        if (movieData.images[key]) {
                          audioData[audioKey] = movieData.images[key];
                        }
                      });
                    });
                    
                    if (Object.keys(audioData).length > 0) {
                      _this.svgaAudioData = audioData;
                    }
                  }
                } catch (decodeErr) {
                  console.error('SVGA解析失败:', decodeErr);
                }
              });
            } catch (err) {
              console.error('音频提取失败:', err);
            }
          },

          extractMaterialList: function (videoItem) {
            var _this = this;
            this.materialList = [];
            this.replacedImages = {};
            
            if (!videoItem || !videoItem.images) return;
            
            var imageKeys = Object.keys(videoItem.images);
            imageKeys.forEach(function (imageKey) {
              var imgData = videoItem.images[imageKey];
              var previewUrl = '';
              
              // 处理图片数据，生成预览 URL
              if (imgData && typeof imgData === 'string') {
                previewUrl = imgData.startsWith('data:') ? imgData : ('data:image/png;base64,' + imgData);
              }
              
              // 获取图片尺寸（异步）
              var img = new Image();
              var materialItem = {
                imageKey: imageKey,
                previewUrl: previewUrl,
                sizeText: '计算中...',
                fileSizeText: '计算中...',
                isReplaced: false,
                originalData: imgData,
                fileSize: 0
              };
              
              _this.materialList.push(materialItem);
              
              img.onload = function () {
                var bytes = this.width * this.height * 4;
                materialItem.fileSize = bytes;
                materialItem.fileSizeText = _this.formatBytes(bytes);
                materialItem.sizeText = this.width + 'px*' + this.height + 'px';
                // 保存原始宽高，用于后续图片替换时的缩放
                materialItem.originalWidth = this.width;
                materialItem.originalHeight = this.height;
              };
              
              img.onerror = function () {
                materialItem.sizeText = '-';
                materialItem.fileSizeText = '-';
              };
              
              if (previewUrl) {
                img.src = previewUrl;
              }
            });
          },

          /* 图片缩放处理：最短边缩放并居中裁剪 */
          scaleImageToFill: function(sourceImg, targetWidth, targetHeight) {
            var canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            var ctx = canvas.getContext('2d');
            
            var sourceWidth = sourceImg.width;
            var sourceHeight = sourceImg.height;
            
            // 计算缩放比例（最短边缩放）
            var scaleX = targetWidth / sourceWidth;
            var scaleY = targetHeight / sourceHeight;
            var scale = Math.max(scaleX, scaleY);
            
            // 缩放后的尺寸
            var scaledWidth = sourceWidth * scale;
            var scaledHeight = sourceHeight * scale;
            
            // 居中偏移
            var offsetX = (targetWidth - scaledWidth) / 2;
            var offsetY = (targetHeight - scaledHeight) / 2;
            
            // 清空画布（透明背景）
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            
            // 绘制缩放后的图片
            ctx.drawImage(sourceImg, offsetX, offsetY, scaledWidth, scaledHeight);
            
            return canvas;
          },
          
          /* 获取原始图片的目标尺寸 */
          getOriginalImageSize: function(imageKey) {
            if (!this.originalVideoItem || !this.originalVideoItem.images) {
              return null;
            }
            
            // 从原始videoItem中获取图片数据
            var imageData = this.originalVideoItem.images[imageKey];
            if (!imageData) return null;
            
            // 返回图片尺寸（已经缓存在materialList中）
            var material = this.materialList.find(function(m) { 
              return m.imageKey === imageKey; 
            });
            
            if (material && material.originalWidth && material.originalHeight) {
              return {
                width: material.originalWidth,
                height: material.originalHeight
              };
            }
            
            return null;
          },

          replaceMaterial: function (index) {
            var _this = this;
            var material = this.materialList[index];
            if (!material) return;
            
            // 创建文件选择器
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png,image/jpeg,image/jpg';
            
            input.onchange = function (e) {
              var file = e.target.files[0];
              if (!file) return;
              
              // 读取文件为 base64
              var reader = new FileReader();
              reader.onload = function (evt) {
                var uploadedDataUrl = evt.target.result;
                
                // 加载上传的图片
                var uploadedImg = new Image();
                uploadedImg.onload = function () {
                  var resizedDataUrl;
                  
                  // 获取原始图片的目标尺寸
                  if (material.originalWidth && material.originalHeight) {
                    // 应用“最短边缩放并居中填充”策略
                    var scaledCanvas = _this.scaleImageToFill(
                      uploadedImg, 
                      material.originalWidth, 
                      material.originalHeight
                    );
                    resizedDataUrl = scaledCanvas.toDataURL('image/png');
                  } else {
                    // 如果没有原始尺寸信息，直接使用上传的图片
                    resizedDataUrl = uploadedDataUrl;
                  }
                  
                  // 更新预览
                  material.previewUrl = resizedDataUrl;
                  material.isReplaced = true;
                  
                  // 保存替换的图片 - 使用新对象触发响应式更新
                  var newReplacedImages = Object.assign({}, _this.replacedImages);
                  newReplacedImages[material.imageKey] = resizedDataUrl;
                  _this.replacedImages = newReplacedImages;
                  
                  // 更新文件大小信息（使用缩放后图片的尺寸）
                  var finalWidth = material.originalWidth || uploadedImg.width;
                  var finalHeight = material.originalHeight || uploadedImg.height;
                  var bytes = finalWidth * finalHeight * 4;
                  material.fileSize = bytes;
                  material.fileSizeText = _this.formatBytes(bytes);
                  material.sizeText = finalWidth + 'px*' + finalHeight + 'px';
                  
                  // 延迟后应用到 SVGA
                  setTimeout(function() {
                    _this.applyReplacedMaterials();
                  }, 300);
                };
                uploadedImg.onerror = function() {
                  console.error('上传的图片加载失败');
                  alert('图片加载失败，请确保图片格式正确');
                };
                uploadedImg.src = uploadedDataUrl;
              };
              
              reader.readAsDataURL(file);
            };
            
            input.click();
          },

          restoreMaterial: function (index) {
            var material = this.materialList[index];
            if (!material || !material.isReplaced) return;
            
            // 恢复原始图片
            var originalData = material.originalData;
            material.previewUrl = originalData.startsWith('data:') ? originalData : ('data:image/png;base64,' + originalData);
            material.isReplaced = false;
            
            // 移除替换记录 - 使用新对象触发响应式更新
            var newReplacedImages = Object.assign({}, this.replacedImages);
            delete newReplacedImages[material.imageKey];
            this.replacedImages = newReplacedImages;
            
            // 重新渲染 SVGA
            this.applyReplacedMaterials();
            
            // 重新计算尺寸
            var _this = this;
            var img = new Image();
            img.onload = function () {
              var bytes = this.width * this.height * 4;
              material.fileSize = bytes;
              material.fileSizeText = _this.formatBytes(bytes);
              material.sizeText = this.width + 'px*' + this.height + 'px';
            };
            img.src = material.previewUrl;
          },

          applyReplacedMaterials: function () {
            if (!this.svgaPlayer || !this.originalVideoItem) return;
            
            var _this = this;
            
            // 清除之前的动态替换
            this.svgaPlayer.clearDynamicObjects();
            
            // 预加载所有图片，然后一起应用
            var imageKeys = Object.keys(this.replacedImages);
            var loadedImages = {};
            var loadedCount = 0;
            var totalCount = imageKeys.length;
            
            if (totalCount === 0) {
              // 没有替换的图片，直接重启播放
              if (_this.isPlaying) {
                _this.svgaPlayer.startAnimation();
              } else {
                _this.svgaPlayer.stepToFrame(_this.currentFrame);
              }
              return;
            }
            
            // 加载所有图片
            imageKeys.forEach(function(imageKey) {
              var imageUrl = _this.replacedImages[imageKey];
              var img = new Image();
              
              img.onload = function() {
                loadedImages[imageKey] = img;
                loadedCount++;
                
                // 所有图片都加载完成
                if (loadedCount === totalCount) {
                  // 应用所有替换的图片
                  Object.keys(loadedImages).forEach(function(key) {
                    _this.svgaPlayer.setImage(loadedImages[key], key);
                  });
                  
                  // 重启播放
                  if (_this.isPlaying) {
                    _this.svgaPlayer.startAnimation();
                  } else {
                    _this.svgaPlayer.stepToFrame(_this.currentFrame);
                  }
                }
              };
              
              img.onerror = function() {
                console.error('图片加载失败:', imageKey);
                loadedCount++;
                
                // 即使有错误也继续
                if (loadedCount === totalCount) {
                  Object.keys(loadedImages).forEach(function(key) {
                    _this.svgaPlayer.setImage(loadedImages[key], key);
                  });
                  
                  if (_this.isPlaying) {
                    _this.svgaPlayer.startAnimation();
                  } else {
                    _this.svgaPlayer.stepToFrame(_this.currentFrame);
                  }
                }
              };
              
              img.src = imageUrl;
            });
          },

          previewMaterials: function () {
            // 预览功能：当前已通过 applyReplacedMaterials 实时预览
            // 关闭弹窗即可看到效果
            this.closeMaterialPanel();
          },

          exportNewSVGA: async function () {
            var _this = this;
            
            if (!this.svga.hasFile || !this.originalVideoItem || !this.svga.file) {
              alert('请先加载 SVGA 文件');
              return;
            }
            
            if (Object.keys(this.replacedImages).length === 0) {
              alert('请先替换至少一个素材');
              return;
            }

            var processing = confirm('即将导出替换后的 SVGA 文件。继续吗？');
            if (!processing) return;

            // 动态加载 protobuf 和 pako
            try {
              await this.loadLibrary(['protobuf', 'pako'], true)
            } catch (err) {
              alert('库加载失败，请检查网络');
              return;
            }

            try {
              // 读取原始 SVGA 文件
              var reader = new FileReader();
              reader.onload = function(e) {
                try {
                  var arrayBuffer = e.target.result;
                  var uint8Array = new Uint8Array(arrayBuffer);
                  
                  // 解压缩
                  var inflatedData = pako.inflate(uint8Array);
                  
                  // 使用 protobuf.js 动态加载 proto 并解码
                  protobuf.load('svga.proto', function(err, root) {
                    if (err) {
                      alert('加载 proto 定义失败: ' + err.message);
                      return;
                    }
                    
                    try {
                      // 获取 MovieEntity 类型
                      var MovieEntity = root.lookupType('com.opensource.svga.MovieEntity');
                      
                      // 解码（直接操作 protobuf 消息对象）
                      var movieData = MovieEntity.decode(inflatedData);
                      
                      // 替换图片数据
                      var replacedCount = 0;
                      var imagesToProcess = [];
                      
                      // 收集需要替换的图片
                      for (var imageKey in _this.replacedImages) {
                        if (_this.replacedImages.hasOwnProperty(imageKey)) {
                          // 检查 images 字典中是否存在该 key
                          if (movieData.images && movieData.images[imageKey]) {
                            imagesToProcess.push({
                              imageKey: imageKey,
                              base64Data: _this.replacedImages[imageKey]
                            });
                          }
                        }
                      }
                      
                      if (imagesToProcess.length === 0) {
                        alert('未找到需要替换的图片');
                        return;
                      }
                      
                      // 处理所有图片（已经在replaceMaterial中缩放过，直接使用）
                      imagesToProcess.forEach(function(item) {
                        var base64Data = item.base64Data;
                        // 移除 data:image/xxx;base64, 前缀
                        var base64String = base64Data.split(',')[1] || base64Data;
                        // 转换为 Uint8Array
                        var binaryString = atob(base64String);
                        var bytes = new Uint8Array(binaryString.length);
                        for (var i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        // 直接替换 protobuf 消息中的 bytes 字段
                        movieData.images[item.imageKey] = bytes;
                        replacedCount++;
                      });
                      
                      // 直接编码 protobuf 消息
                      var buffer = MovieEntity.encode(movieData).finish();
                      
                      // 压缩
                      var deflatedData = pako.deflate(buffer);
                      
                      // 创建 Blob 并下载
                      var blob = new Blob([deflatedData], { type: 'application/octet-stream' });
                      var url = URL.createObjectURL(blob);
                      var a = document.createElement('a');
                      a.href = url;
                      var originalName = _this.svga.fileInfo.name.replace(/\.svga$/i, '');
                      a.download = originalName + '_modified.svga';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      
                      setTimeout(function() {
                        URL.revokeObjectURL(url);
                      }, 100);
                      
                      alert('导出成功！已替换 ' + replacedCount + ' 个素材。');
                      
                    } catch (decodeErr) {
                      console.error('编解码失败:', decodeErr);
                      alert('编解码失败: ' + decodeErr.message);
                    }
                  });
                  
                } catch (err) {
                  console.error('处理 SVGA 失败:', err);
                  alert('处理失败: ' + err.message);
                }
              };
              reader.readAsArrayBuffer(_this.svga.file);
              
            } catch (err) {
              console.error('导出 SVGA 失败:', err);
              alert('导出失败: ' + err.message);
            }
          },

          /* GIF 导出功能 */

          exportGIF: async function () {
            var _this = this;
            
            if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
              alert('请先加载 SVGA 文件');
              return;
            }
            
            // 添加确认弹窗
            if (!confirm('确认要导出GIF吗？')) {
              return;
            }

            // 动态加载 GIF.js
            try {
              await this.loadLibrary('gif', true)
            } catch (err) {
              alert('GIF导出库加载失败，请检查网络');
              return;
            }

            this.isExportingGIF = true;
            this.gifExportProgress = 0;

            // 获取 canvas 元素
            var container = this.$refs.svgaContainer;
            if (!container) {
              this.isExportingGIF = false;
              alert('无法获取画布元素');
              return;
            }
            var canvas = container.querySelector('canvas');
            if (!canvas) {
              this.isExportingGIF = false;
              alert('无法获取 canvas 元素');
              return;
            }

            // 获取 SVGA 信息
            var videoItem = this.originalVideoItem;
            var totalFrames = this.totalFrames;
            var fps = this.svga.fileInfo.fps || 20;
            var frameDelay = Math.round(1000 / fps); // 每帧延迟（毫秒）

            // 创建 GIF 编码器
            var gif = new GIF({
              workers: 2,  // 启用 2 个 worker 线程
              quality: 10,
              width: canvas.width,
              height: canvas.height,
              workerScript: 'gif.worker.js'  // 使用本地 worker 文件
            });

            // 监听进度
            gif.on('progress', function(p) {
              // 捕获阶段 0-50%，编码阶段 50-100%
              _this.gifExportProgress = 50 + Math.floor(p * 50);
            });

            // 完成时触发
            gif.on('finished', function(blob) {
              _this.isExportingGIF = false;
              _this.gifExportProgress = 0;

              // 下载 GIF
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = (_this.svga.fileInfo.name.replace(/\.svga$/i, '') || 'animation') + '.gif';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              setTimeout(function() {
                URL.revokeObjectURL(url);
              }, 100);

              alert('GIF 导出成功！大小: ' + (_this.formatBytes(blob.size)));
            });

            // 错误处理
            gif.on('abort', function() {
              _this.isExportingGIF = false;
              _this.gifExportProgress = 0;
              alert('GIF 导出已取消');
            });

            // 获取当前播放器状态
            var wasPlaying = this.isPlaying;
            if (wasPlaying) {
              this.svgaPlayer.pauseAnimation();
            }

            // 逐帧渲染并添加到 GIF
            var currentFrameIndex = 0;
            
            var captureFrame = function() {
              if (currentFrameIndex >= totalFrames) {
                // 所有帧都添加完毕，开始渲染 GIF
                console.log('开始编码 GIF...');
                _this.gifExportProgress = 50;
                
                setTimeout(function() {
                  try {
                    gif.render();
                  } catch (err) {
                    console.error('GIF 编码失败:', err);
                    _this.isExportingGIF = false;
                    _this.gifExportProgress = 0;
                    alert('GIF 编码失败: ' + err.message);
                    
                    // 恢复播放状态
                    if (wasPlaying) {
                      _this.svgaPlayer.startAnimation();
                    }
                  }
                }, 100);
                
                return;
              }

              // 跳转到指定帧
              _this.svgaPlayer.stepToFrame(currentFrameIndex, false);
              
              // 等待渲染完成，然后捕获帧
              setTimeout(function() {
                try {
                  // 创建临时 canvas 用于合成背景色
                  var tempCanvas = document.createElement('canvas');
                  tempCanvas.width = canvas.width;
                  tempCanvas.height = canvas.height;
                  var tempCtx = tempCanvas.getContext('2d', { alpha: true });
                  
                  // 启用高质量抗锯齿
                  tempCtx.imageSmoothingEnabled = true;
                  tempCtx.imageSmoothingQuality = 'high';
                  
                  // 填充背景色
                  var bgColor = '#ffffff'; // 默认白色
                  if (_this.bgColorKey && _this.bgColorKey !== 'pattern') {
                    // 使用当前背景色（白色、绿色、红色等）
                    var computedBgColor = _this.currentBgColor;
                    if (computedBgColor !== 'transparent' && computedBgColor !== '#000000') {
                      bgColor = computedBgColor;
                    }
                  }
                  tempCtx.fillStyle = bgColor;
                  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                  
                  // 将 SVGA 画布绘制到临时 canvas 上
                  tempCtx.drawImage(canvas, 0, 0);
                  
                  // 使用合成后的 canvas 添加到 GIF
                  gif.addFrame(tempCanvas, {copy: true, delay: frameDelay});
                  currentFrameIndex++;
                  
                  // 更新进度（捕获阶段占 0-50%）
                  _this.gifExportProgress = Math.floor((currentFrameIndex / totalFrames) * 50);
                  
                  // 继续下一帧
                  captureFrame();
                } catch (err) {
                  console.error('捕获帧失败:', err);
                  _this.isExportingGIF = false;
                  _this.gifExportProgress = 0;
                  alert('捕获帧失败: ' + err.message);
                  
                  // 恢复播放状态
                  if (wasPlaying) {
                    _this.svgaPlayer.startAnimation();
                  }
                }
              }, 50); // 给每帧 50ms 渲染时间
            };

            // 开始捕获
            console.log('开始捕获帧，总帧数:', totalFrames);
            captureFrame();
          },

          // YYEVA GIF 导出
          exportYyevaGIF: async function() {
            var _this = this;
            
            if (!this.yyevaVideo || !this.yyeva.hasFile || !this.yyevaCanvas) {
              alert('请先加载 YYEVA-MP4 文件');
              return;
            }
            
            // 添加确认弹窗
            if (!confirm('确认要导出GIF吗？')) {
              return;
            }

            // 动态加载 GIF.js
            try {
              await this.loadLibrary('gif', true)
            } catch (err) {
              alert('GIF导出库加载失败，请检查网络');
              return;
            }

            this.isExportingGIF = true;
            this.gifExportProgress = 0;

            var canvas = this.yyevaCanvas;
            var video = this.yyevaVideo;
            
            // 获取视频信息
            var duration = video.duration;
            var fps = 30; // 假设30fps
            var totalFrames = Math.round(duration * fps);
            var frameDelay = Math.round(1000 / fps);

            // 创建 GIF 编码器
            var gif = new GIF({
              workers: 2,
              quality: 10,
              width: canvas.width,
              height: canvas.height,
              workerScript: 'gif.worker.js'
            });

            // 监听进度
            gif.on('progress', function(p) {
              _this.gifExportProgress = 50 + Math.floor(p * 50);
            });

            // 完成时触发
            gif.on('finished', function(blob) {
              _this.isExportingGIF = false;
              _this.gifExportProgress = 0;

              // 下载 GIF
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = (_this.yyeva.fileInfo.name.replace(/\.mp4$/i, '') || 'yyeva') + '.gif';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              setTimeout(function() {
                URL.revokeObjectURL(url);
              }, 100);

              alert('GIF 导出成功！大小: ' + (_this.formatBytes(blob.size)));
            });

            // 错误处理
            gif.on('abort', function() {
              _this.isExportingGIF = false;
              _this.gifExportProgress = 0;
              alert('GIF 导出已取消');
            });

            // 暂停当前播放和渲染循环
            var wasPlaying = this.isPlaying;
            if (this.yyevaAnimationId) {
              cancelAnimationFrame(this.yyevaAnimationId);
              this.yyevaAnimationId = null;
            }
            video.pause();
            this.isPlaying = false;

            // 逐帧捕获
            var currentFrameIndex = 0;
            var frameTime = 1 / fps;
            
            var captureFrame = function() {
              if (currentFrameIndex >= totalFrames) {
                // 所有帧都添加完毕，开始渲染 GIF
                console.log('开始编码 YYEVA GIF...');
                _this.gifExportProgress = 50;
                
                setTimeout(function() {
                  try {
                    gif.render();
                  } catch (err) {
                    console.error('GIF 编码失败:', err);
                    _this.isExportingGIF = false;
                    _this.gifExportProgress = 0;
                    alert('GIF 编码失败: ' + err.message);
                    
                    // 恢复播放状态
                    if (wasPlaying) {
                      video.play();
                      _this.isPlaying = true;
                      _this.startYyevaRenderLoop();
                    }
                  }
                }, 100);
                
                return;
              }

              // 跳转到指定时间
              video.currentTime = currentFrameIndex * frameTime;
            };
            
            // 监听seeked事件来捕获帧
            var onSeeked = function() {
              try {
                // 渲染当前帧
                _this.renderYyevaFrame();
                
                // 创建临时 canvas 用于合成背景色
                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                var tempCtx = tempCanvas.getContext('2d', { alpha: true });
                
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                
                // 填充背景色
                var bgColor = '#ffffff';
                if (_this.bgColorKey && _this.bgColorKey !== 'pattern') {
                  var computedBgColor = _this.currentBgColor;
                  if (computedBgColor !== 'transparent' && computedBgColor !== '#000000') {
                    bgColor = computedBgColor;
                  }
                }
                tempCtx.fillStyle = bgColor;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // 将 YYEVA 画布绘制到临时 canvas 上
                tempCtx.drawImage(canvas, 0, 0);
                
                // 添加到 GIF
                gif.addFrame(tempCanvas, {copy: true, delay: frameDelay});
                currentFrameIndex++;
                
                // 更新进度
                _this.gifExportProgress = Math.floor((currentFrameIndex / totalFrames) * 50);
                
                // 继续下一帧
                captureFrame();
              } catch (err) {
                console.error('捕获帧失败:', err);
                _this.isExportingGIF = false;
                _this.gifExportProgress = 0;
                video.removeEventListener('seeked', onSeeked);
                alert('捕获帧失败: ' + err.message);
                
                if (wasPlaying) {
                  video.play();
                  _this.isPlaying = true;
                  _this.startYyevaRenderLoop();
                }
              }
            };
            
            video.addEventListener('seeked', onSeeked);
            
            // GIF完成或失败后移除事件监听
            gif.on('finished', function() {
              video.removeEventListener('seeked', onSeeked);
              if (wasPlaying) {
                video.play();
                _this.isPlaying = true;
                _this.startYyevaRenderLoop();
              }
            });
            
            // 开始捕获
            console.log('开始捕获 YYEVA 帧，总帧数:', totalFrames);
            captureFrame();
          },

          /* 工具方法 */

          formatBytes: function (bytes) {
            if (!bytes && bytes !== 0) return '';
            var kb = bytes / 1024;
            if (kb < 1024) return kb.toFixed(0) + 'kb';
            var mb = kb / 1024;
            return mb.toFixed(2) + 'M';
          },

          /* MP4 转换功能 */
          openMP4Panel: function () {
            if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
              alert('请先加载 SVGA 文件');
              return;
            }

            // 关闭素材图弹窗（互斥显示）
            this.showMaterialPanel = false;
            
            // 切换侧边栏显示状态：如果已打开则关闭，否则打开
            if (this.showMP4Panel) {
              this.showMP4Panel = false;
              return;
            }

            // 初始化配置
            var videoItem = this.originalVideoItem;
            this.mp4Config.width = videoItem.videoSize.width;
            this.mp4Config.height = videoItem.videoSize.height;
            
            // 默认使用SVGA原始帧率
            var originalFps = videoItem.FPS || videoItem.fps || 30;
            this.mp4Config.fps = originalFps;
            
            // 读取localStorage中保存的配置（包括帧率和压缩质量）
            try {
              var savedFps = localStorage.getItem('mp4_fps');
              if (savedFps !== null) {
                this.mp4Config.fps = parseInt(savedFps);
              }
              
              var savedQuality = localStorage.getItem('mp4_quality');
              if (savedQuality !== null) {
                this.mp4Config.quality = parseInt(savedQuality);
              }
            } catch (e) {}

            this.showMP4Panel = true;
            
            // 预加载FFmpeg库（高优先级插队）
            if (!this.libraryLoader.loadedLibs['ffmpeg']) {
              var _this = this;
              this.loadLibrary('ffmpeg', true)
                .then(function() {
                  console.log('FFmpeg脚本加载完成，待初始化');
                })
                .catch(function(error) {
                  console.warn('FFmpeg脚本加载失败:', error);
                });
            }
          },

          closeMP4Panel: function () {
            if (this.isConvertingMP4) {
              if (!confirm('正在转换中，确定要取消吗？')) {
                return;
              }
              this.isConvertingMP4 = false;
              this.mp4ConvertProgress = 0;
            }
            this.showMP4Panel = false;
          },

          toggleChannelModeDropdown: function () {
            // 切换下拉菜单显示状态
            this.showChannelModeDropdown = !this.showChannelModeDropdown;
          },

          selectChannelMode: function (mode) {
            // 选择遮罩位置
            this.mp4Config.channelMode = mode;
            this.showChannelModeDropdown = false;
          },

          toggleChannelMode: function () {
            // 切换遮罩位置（旧方法，保留以免其他地方引用）
            if (this.mp4Config.channelMode === 'color-left-alpha-right') {
              this.mp4Config.channelMode = 'alpha-left-color-right';
            } else {
              this.mp4Config.channelMode = 'color-left-alpha-right';
            }
          },

          previewMP4Effect: function () {
            // TODO: 实现预览效果功能
            alert('预览效果功能待实现');
          },

          onMP4WidthChange: function () {
            // 保持比例，修改高度
            var videoItem = this.originalVideoItem;
            if (!videoItem) return;
            
            var originalWidth = videoItem.videoSize.width;
            var originalHeight = videoItem.videoSize.height;
            var ratio = originalHeight / originalWidth;
            
            var newWidth = Math.max(0, Math.min(3000, parseInt(this.mp4Config.width) || 0));
            var newHeight = Math.floor(newWidth * ratio);
            
            this.mp4Config.width = newWidth;
            this.mp4Config.height = newHeight;
          },

          onMP4HeightChange: function () {
            // 保持比例，修改宽度
            var videoItem = this.originalVideoItem;
            if (!videoItem) return;
            
            var originalWidth = videoItem.videoSize.width;
            var originalHeight = videoItem.videoSize.height;
            var ratio = originalWidth / originalHeight;
            
            var newHeight = Math.max(0, Math.min(3000, parseInt(this.mp4Config.height) || 0));
            var newWidth = Math.floor(newHeight * ratio);
            
            this.mp4Config.width = newWidth;
            this.mp4Config.height = newHeight;
          },

          startMP4Conversion: async function () {
            var _this = this;

            // 前置检查
            if (!this.svgaPlayer || !this.svga.hasFile || !this.originalVideoItem) {
              alert('请先加载 SVGA 文件');
              return;
            }
            
            // 检查SVGA是否包含音频
            var videoItem = this.originalVideoItem;
            var hasAudio = videoItem.audios && videoItem.audios.length > 0;
            
            // 如果有音频且未选择静音，提示用户
            if (hasAudio && !this.mp4Config.muted) {
              var audioExtracted = this.svgaAudioData && Object.keys(this.svgaAudioData).length > 0;
              var confirmMsg = '';
              
              if (audioExtracted) {
                // 成功提取到音频
                var audioKeys = Object.keys(this.svgaAudioData);
                var audioSize = this.svgaAudioData[audioKeys[0]].length;
                var audioSizeKB = (audioSize / 1024).toFixed(1);
                confirmMsg = '✅ 检测到SVGA包含音频\n\n音频文件：' + audioKeys[0] + '\n文件大小：' + audioSizeKB + 'KB\n\n将尝试将音频合成到MP4文件中。\n\n是否继续？';
              } else {
                // 检测到音频但未能提取
                confirmMsg = '⚠️ 检测到SVGA包含音频，但未能提取音频数据\n\n可能原因：\n1. 音频文件格式不支持\n2. SVGA文件结构异常\n\n请查看控制台调试信息并反馈给开发者。\n\n建议：\n1. 勾选“静音”后再转换\n2. 或直接继续（生成的MP4将没有声音）\n\n是否继续？';
              }
              
              if (!confirm(confirmMsg)) {
                return;
              }
            }

            // 参数验证
            var width = this.mp4Config.width;
            var height = this.mp4Config.height;
            var quality = this.mp4Config.quality;
            var fps = this.mp4Config.fps;

            // 验证宽度
            if (width < 1 || width > 9999) {
              alert('宽度超出范围！\n\n合法范围：1-9999 像素\n当前值：' + width);
              return;
            }

            // 验证高度
            if (height < 1 || height > 9999) {
              alert('高度超出范围！\n\n合法范围：1-9999 像素\n当前值：' + height);
              return;
            }

            // 验证压缩质量
            if (quality < 1 || quality > 100) {
              alert('压缩质量超出范围！\n\n合法范围：1-100\n当前值：' + quality);
              return;
            }

            // 验证帧率
            if (fps < 1 || fps > 120) {
              alert('帧率超出范围！\n\n合法范围：1-120 fps\n当前值：' + fps);
              return;
            }

            // 保存配置到localStorage
            try {
              localStorage.setItem('mp4_quality', this.mp4Config.quality);
              localStorage.setItem('mp4_fps', this.mp4Config.fps);
            } catch (e) {}

            this.isConvertingMP4 = true;
            this.mp4ConvertProgress = 0;
            this.mp4ConvertCancelled = false;
            this.mp4ConvertStage = 'loading';
            this.mp4ConvertMessage = '正在加载转换器...';

            try {
              // 1. 加载 ffmpeg.wasm
              await this.loadFFmpeg();
              if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

              // 2. 提取序列帧
              this.mp4ConvertStage = 'extracting';
              this.mp4ConvertMessage = '正在提取序列帧...';
              var frames = await this.extractFrames();
              if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

              // 3. 合成双通道
              this.mp4ConvertStage = 'composing';
              this.mp4ConvertMessage = '正在合成双通道...';
              var dualFrames = await this.composeDualChannelFrames(frames);
              if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

              // 4. 编码为 MP4
              this.mp4ConvertStage = 'encoding';
              this.mp4ConvertMessage = '正在编码为MP4...';
              var mp4Blob = await this.encodeToMP4(dualFrames);
              if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

              // 5. 下载文件
              this.mp4ConvertStage = 'done';
              this.mp4ConvertMessage = '转换完成！';
              this.mp4ConvertProgress = 100;
              this.downloadMP4(mp4Blob);
              
              // 提示音频状态
              setTimeout(function() {
                var hasAudioData = _this.svgaAudioData && Object.keys(_this.svgaAudioData).length > 0;
                var msg = '';
                
                if (muted) {
                  // 用户选择静音
                  msg = '✅ 转换完成！\n\n已按您的要求生成静音MP4文件。';
                } else if (!hasAudioData) {
                  // 无音频数据
                  msg = '✅ 转换完成！\n\nSVGA文件不包含音频，已生成静音MP4文件。';
                } else if (audioWritten) {
                  // 成功合成音频
                  msg = '✅ 转换完成！\n\n已成功将SVGA中的音频合成到MP4文件中。\n\n请播放检查音频效果，如有问题请反馈。';
                } else if (audioError) {
                  // 音频处理失败
                  msg = '⚠️ 转换完成，但音频处理失败\n\n错误原因：' + audioError + '\n\n已生成不带声音的MP4文件。';
                } else {
                  // 其他情况
                  msg = '✅ 转换完成！';
                }
                
                if (msg) {
                  alert(msg);
                }
              }, 500);
              
            } catch (error) {
              if (error.message !== '用户取消转换') {
                console.error('MP4转换失败:', error);
                alert('转换失败：' + error.message);
              } else {
                console.log('用户已取消MP4转换');
              }
            } finally {
              this.isConvertingMP4 = false;
              this.mp4ConvertProgress = 0;
              this.mp4ConvertStage = '';
              this.mp4ConvertMessage = '';
            }
          },

          // 加载 ffmpeg.wasm (0.11版本)
          loadFFmpeg: async function () {
            if (this.ffmpegLoaded) return;
            if (this.ffmpegLoading) {
              // 等待加载完成
              while (this.ffmpegLoading) {
                await new Promise(function(r) { setTimeout(r, 100); });
              }
              return;
            }

            this.ffmpegLoading = true;

            try {
              // 动态加载 FFmpeg 库（如果尚未加载）
              if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
                this.mp4ConvertMessage = '正在加载FFmpeg库...';
                
                await new Promise(function(resolve, reject) {
                  var script = document.createElement('script');
                  script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
                  script.onload = resolve;
                  script.onerror = function() {
                    reject(new Error('FFmpeg库加载失败，请检查网络'));
                  };
                  document.head.appendChild(script);
                });
                
                // 等待FFmpeg对象可用
                var maxWait = 50; // 最多等待5秒
                while ((typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') && maxWait > 0) {
                  await new Promise(function(r) { setTimeout(r, 100); });
                  maxWait--;
                }
                
                if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
                  throw new Error('FFmpeg库加载超时');
                }
              }

              // 创建ffmpeg实例（配置使用CDN加载核心文件）
              // 使用jsdelivr CDN，支持CORS
              this.ffmpeg = FFmpeg.createFFmpeg({
                log: true,
                corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                progress: function(p) {
                  // 静默处理进度
                }
              });

              // 加载 ffmpeg core
              this.mp4ConvertMessage = '正在加载编码器（约25MB，首次加载较慢）...';
              await this.ffmpeg.load();

              this.ffmpegLoaded = true;
            } catch (error) {
              console.error('FFmpeg 加载失败:', error);
              throw new Error('加载转换器失败：' + error.message);
            } finally {
              this.ffmpegLoading = false;
            }
          },

          // 提取序列帧（直接使用主播放器Canvas）
          extractFrames: async function () {
            var _this = this;
            var videoItem = this.originalVideoItem;
            if (!videoItem) {
              throw new Error('请先加载SVGA文件');
            }
            var totalFrames = videoItem.frames;
            var originalWidth = videoItem.videoSize.width;
            var originalHeight = videoItem.videoSize.height;
            
            // 使用用户配置的尺寸
            var targetWidth = this.mp4Config.width || originalWidth;
            var targetHeight = this.mp4Config.height || originalHeight;

            var frames = [];
            
            // 保存当前播放状态
            var wasPlaying = this.isPlaying;
            if (wasPlaying) {
              this.svgaPlayer.pauseAnimation();
            }
            
            // 直接使用主播放器的Canvas
            var playerCanvas = this.$refs.svgaContainer.querySelector('canvas');
            if (!playerCanvas) {
              throw new Error('无法获取播放器Canvas');
            }

            try {
              // 逐帧提取
              for (var i = 0; i < totalFrames; i++) {
                if (this.mp4ConvertCancelled) {
                  throw new Error('用户取消转换');
                }

                // 更新进度
                this.mp4ConvertProgress = Math.round((i + 1) / totalFrames * 100);
                this.mp4ConvertMessage = '提取序列帧 ' + (i + 1) + '/' + totalFrames;

                // 跳转到指定帧
                this.svgaPlayer.stepToFrame(i, false);

                // 等待渲染完成
                await new Promise(function(r) { setTimeout(r, 100); });

                // 创建目标尺寸Canvas
                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = targetWidth;
                tempCanvas.height = targetHeight;
                var tempCtx = tempCanvas.getContext('2d', { 
                  alpha: true,
                  willReadFrequently: true
                });
                
                // 禁用图像平滑
                tempCtx.imageSmoothingEnabled = false;
                
                // 清空并绘制
                tempCtx.clearRect(0, 0, targetWidth, targetHeight);
                tempCtx.drawImage(playerCanvas, 0, 0, playerCanvas.width, playerCanvas.height, 0, 0, targetWidth, targetHeight);
                
                // 获取ImageData
                var imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
                frames.push(imageData);

                // 让出线程，避免阻塞UI
                if (i % 5 === 0) {
                  await new Promise(function(r) { setTimeout(r, 0); });
                }
              }
            } finally {
              // 恢复播放状态
              if (wasPlaying) {
                this.svgaPlayer.startAnimation();
              }
            }

            return frames;
          },

          // 合成双通道帧
          composeDualChannelFrames: async function (frames) {
            var _this = this;
            var dualFrames = [];
            var isColorLeftAlphaRight = this.mp4Config.channelMode === 'color-left-alpha-right';

            for (var i = 0; i < frames.length; i++) {
              if (this.mp4ConvertCancelled) {
                throw new Error('用户取消转换');
              }

              // 更新进度
              this.mp4ConvertProgress = Math.round((i + 1) / frames.length * 100);
              this.mp4ConvertMessage = '合成双通道 ' + (i + 1) + '/' + frames.length;

              var imageData = frames[i];
              var dualCanvas = this.composeDualChannel(imageData, isColorLeftAlphaRight);
              dualFrames.push(dualCanvas);

              // 让出线程
              if (i % 10 === 0) {
                await new Promise(function(r) { setTimeout(r, 0); });
              }
            }

            return dualFrames;
          },

          // 合成单帧双通道
          composeDualChannel: function (imageData, isColorLeftAlphaRight) {
            var width = imageData.width;
            var height = imageData.height;

            // 创建双倍宽度的Canvas（必须带alpha通道，避免黑色底色）
            var dualCanvas = document.createElement('canvas');
            dualCanvas.width = width * 2;
            dualCanvas.height = height;
            var dualCtx = dualCanvas.getContext('2d', { 
              alpha: true,  // 必须为true，避免黑色底色
              willReadFrequently: true 
            });
            
            // 禁用所有图像平滑/抗锯齿
            dualCtx.imageSmoothingEnabled = false;
            
            // 清空为透明背景（重要！）
            dualCtx.clearRect(0, 0, width * 2, height);

            // 创建左侧和右侧的ImageData
            var leftData = dualCtx.createImageData(width, height);
            var rightData = dualCtx.createImageData(width, height);

            // 逐像素分离通道
            for (var i = 0; i < imageData.data.length; i += 4) {
              var r = imageData.data[i + 0];
              var g = imageData.data[i + 1];
              var b = imageData.data[i + 2];
              var a = imageData.data[i + 3];

              // Canvas的getImageData返回预乘Alpha的数据，必须反预乘才能恢复原始颜色
              var finalR = r;
              var finalG = g;
              var finalB = b;
              
              if (a > 0 && a < 255) {
                // 反预乘公式：原始颜色 = 预乘颜色 * 255 / alpha
                finalR = Math.min(255, Math.round(r * 255 / a));
                finalG = Math.min(255, Math.round(g * 255 / a));
                finalB = Math.min(255, Math.round(b * 255 / a));
              } else if (a === 0) {
                // 完全透明：颜色置为黑色
                finalR = 0;
                finalG = 0;
                finalB = 0;
              }
              // a === 255：不需要处理，直接使用原值

              if (isColorLeftAlphaRight) {
                // 左彩右灰：左侧RGB保留半透明，右侧Alpha灰度图必须alpha=255
                leftData.data[i + 0] = finalR;
                leftData.data[i + 1] = finalG;
                leftData.data[i + 2] = finalB;
                leftData.data[i + 3] = a;  // 保留原始alpha

                // 右侧灰度图：灰度值=alpha，但alpha必须设为255（避免putImageData预乘）
                rightData.data[i + 0] = a;  // 灰度值=alpha值
                rightData.data[i + 1] = a;
                rightData.data[i + 2] = a;
                rightData.data[i + 3] = 255;  // 必须255，避免灰度被预乘变暗
              } else {
                // 左灰右彩：左侧Alpha灰度图必须alpha=255，右侧RGB保留半透明
                // 左侧灰度图：灰度值=alpha，但alpha必须设为255（避免putImageData预乘）
                leftData.data[i + 0] = a;
                leftData.data[i + 1] = a;
                leftData.data[i + 2] = a;
                leftData.data[i + 3] = 255;  // 必须255，避免灰度被预乘变暗

                rightData.data[i + 0] = finalR;
                rightData.data[i + 1] = finalG;
                rightData.data[i + 2] = finalB;
                rightData.data[i + 3] = a;  // 保留原始alpha
              }
            }

            // 使用putImageData直接写入，避免任何图像处理
            dualCtx.putImageData(leftData, 0, 0);
            dualCtx.putImageData(rightData, width, 0);

            return dualCanvas;
          },

          // 编码为MP4 (0.11版本API)
          encodeToMP4: async function (dualFrames) {
            var _this = this;
            var ffmpeg = this.ffmpeg;
            var fps = this.mp4Config.fps || 30;
            var quality = this.mp4Config.quality || 80;
            var muted = this.mp4Config.muted;
            var frameCount = dualFrames.length;

            // CRF值：quality 100 对应 CRF 18（最高质量），quality 0 对应 CRF 51（最低质量）
            var crf = Math.round(51 - (quality / 100) * 33);

            try {
              // 将帧写入ffmpeg虚拟文件系统
              for (var i = 0; i < frameCount; i++) {
                if (this.mp4ConvertCancelled) throw new Error('用户取消转换');

                var frameCanvas = dualFrames[i];
                
                // 转换为PNG Blob
                var blob = await new Promise(function(resolve) {
                  frameCanvas.toBlob(resolve, 'image/png');
                });

                // 读取为ArrayBuffer
                var buffer = await blob.arrayBuffer();
                var uint8Array = new Uint8Array(buffer);

                // 写入虚拟文件系统 (0.11版本API)
                var filename = 'frame_' + String(i).padStart(4, '0') + '.png';
                ffmpeg.FS('writeFile', filename, uint8Array);

                // 更新进度 (写入阶段占50%)
                this.mp4ConvertProgress = Math.round((i + 1) / frameCount * 50);
                this.mp4ConvertMessage = '写入帧数据 ' + (i + 1) + '/' + frameCount;
              }

              // 执行编码
              if (this.mp4ConvertCancelled) throw new Error('用户取消转换');
              
              this.mp4ConvertMessage = '正在编码视频...';
              this.mp4ConvertProgress = 50;
              
              // 检查是否有音频数据
              var hasAudioData = this.svgaAudioData && Object.keys(this.svgaAudioData).length > 0;
              var audioWritten = false;
              var audioError = null;
              
              // 仅在有音频数据且未静音时处理音频
              if (hasAudioData && !muted) {
                try {
                  var audioKeys = Object.keys(this.svgaAudioData);
                  var audioKey = audioKeys[0];
                  var audioData = this.svgaAudioData[audioKey];
                  
                  if (!audioData || audioData.length === 0) {
                    throw new Error('音频数据为空');
                  }
                  
                  ffmpeg.FS('writeFile', 'audio.mp3', audioData);
                  audioWritten = true;
                  
                } catch (audioErr) {
                  audioError = audioErr.message || '未知错误';
                  
                  var continueMsg = '音频处理失败：' + audioError + '\n\n是否继续转换（生成的MP4将没有声音）？';
                  if (!confirm(continueMsg)) {
                    throw new Error('用户取消转换');
                  }
                }
              }

              var ffmpegArgs = [
                '-framerate', String(fps),
                '-i', 'frame_%04d.png'
              ];
              
              // 如果有音频，添加音频输入
              if (audioWritten) {
                ffmpegArgs.push('-i', 'audio.mp3');
              }
              
              ffmpegArgs.push(
                // 添加黑色底色：在PNG下方叠加黑色层
                '-vf', 'format=rgba,colorchannelmixer=aa=1,split[bg][fg];[bg]drawbox=c=black@1:replace=1:t=fill[bg];[bg][fg]overlay=format=auto',
                '-c:v', 'libx264',
                '-profile:v', 'high',
                '-level', '4.0',
                '-pix_fmt', 'yuv420p',  // Windows兼容性
                '-crf', String(crf),
                '-preset', 'medium',
                '-sws_flags', 'neighbor',  // 使用最近邻插值，避免颜色混合
                '-movflags', '+faststart'
              );

              // 处理音频轨道
              if (muted || !audioWritten) {
                ffmpegArgs.push('-an');
              } else {
                ffmpegArgs.push(
                  '-c:a', 'aac',
                  '-b:a', '128k',
                  '-shortest'
                );
              }

              ffmpegArgs.push('output.mp4');

              // 执行FFmpeg编码
              try {
                await ffmpeg.run.apply(ffmpeg, ffmpegArgs);
              } catch (ffmpegErr) {
                // 检查是否是音频相关错误
                var errorMsg = String(ffmpegErr.message || ffmpegErr);
                if (audioWritten && (errorMsg.includes('audio') || errorMsg.includes('aac'))) {
                  var retryMsg = '音频编码失败：' + errorMsg + '\n\n是否尝试不带音频重新编码？';
                  if (confirm(retryMsg)) {
                    // 移除音频相关参数，添加-an
                    var retryArgs = ffmpegArgs.filter(function(arg, idx) {
                      if (arg === 'audio.mp3') return false;
                      if (arg === '-i' && ffmpegArgs[idx + 1] === 'audio.mp3') return false;
                      if (arg === '-c:a' || arg === '-b:a' || arg === '-shortest') return false;
                      if (ffmpegArgs[idx - 1] === '-c:a' || ffmpegArgs[idx - 1] === '-b:a') return false;
                      return true;
                    });
                    
                    var outputIdx = retryArgs.indexOf('output.mp4');
                    retryArgs.splice(outputIdx, 0, '-an');
                    
                    await ffmpeg.run.apply(ffmpeg, retryArgs);
                    audioWritten = false;
                  } else {
                    throw ffmpegErr;
                  }
                } else {
                  throw ffmpegErr;
                }
              }

              this.mp4ConvertProgress = 90;
              this.mp4ConvertMessage = '正在读取输出文件...';

              // 读取输出文件 (0.11版本API)
              var data = ffmpeg.FS('readFile', 'output.mp4');
              var mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });

              // 清理虚拟文件系统
              for (var j = 0; j < frameCount; j++) {
                var fname = 'frame_' + String(j).padStart(4, '0') + '.png';
                try {
                  ffmpeg.FS('unlink', fname);
                } catch (e) {}
              }
              try {
                ffmpeg.FS('unlink', 'output.mp4');
              } catch (e) {}
              if (audioWritten) {
                try {
                  ffmpeg.FS('unlink', 'audio.mp3');
                } catch (e) {}
              }

              return mp4Blob;

            } catch (error) {
              console.error('[FFmpeg编码] 错误:', error);
              // 清理可能残留的文件
              for (var k = 0; k < frameCount; k++) {
                try {
                  ffmpeg.FS('unlink', 'frame_' + String(k).padStart(4, '0') + '.png');
                } catch (e) {}
              }
              try {
                ffmpeg.FS('unlink', 'output.mp4');
              } catch (e) {}
              throw error;
            }
          },

          // 下载MP4文件
          downloadMP4: function (blob) {
            var filename = this.svga.fileInfo.name || 'svga';
            // 移除扩展名
            filename = filename.replace(/\.svga$/i, '');
            // 添加后缀
            var suffix = this.mp4Config.channelMode === 'color-left-alpha-right' ? '_yyeva_LR' : '_yyeva_RL';
            filename = filename + suffix + '.mp4';

            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },

          // 取消MP4转换
          cancelMP4Conversion: function () {
            this.mp4ConvertCancelled = true;
            this.mp4ConvertMessage = '正在取消...';
          }
        },
        computed: {
          hasReplacedMaterials: function () {
            return Object.keys(this.replacedImages).length > 0;
          },
          
          isEmpty: function () {
            return !this.svga.hasFile && !this.yyeva.hasFile && !this.lottie.hasFile;
          },
          
          currentFileInfo: function () {
            if (this.currentModule === 'svga' && this.svga.hasFile) {
              return this.svga.fileInfo;
            } else if (this.currentModule === 'yyeva' && this.yyeva.hasFile) {
              return this.yyeva.fileInfo;
            } else if (this.currentModule === 'lottie' && this.lottie.hasFile) {
              return this.lottie.fileInfo;
            }
            return {};
          },
          
          currentBgColor: function () {
            if (this.bgColorKey === 'white') return '#ffffff';
            if (this.bgColorKey === 'green') return '#00ff00';
            if (this.bgColorKey === 'red') return '#df3321';
            if (this.bgColorKey === 'yellow') return '#f1c40d';
            if (this.bgColorKey === 'blue') return '#00b4ff';
            if (this.bgColorKey === 'pattern') {
              return 'transparent';
            }
            return '#000000';
          },
          
          materialThumbBgColor: function () {
            // 如果有设置背景色且不是透明格子，使用当前背景色
            if (this.bgColorKey && this.bgColorKey !== 'pattern') {
              return this.currentBgColor;
            }
            // 否则使用默认颜色：浅色模式 #fcfcfc，暗黑模式 #2a2a2a
            return this.isDarkMode ? '#2a2a2a' : '#fcfcfc';
          },
          
          filteredMaterialList: function () {
            var _this = this;
            if (!this.materialSearchQuery) {
              return this.materialList;
            }
            var query = this.materialSearchQuery.toLowerCase();
            return this.materialList.filter(function(item) {
              return item.imageKey.toLowerCase().indexOf(query) !== -1;
            });
          },
          
          zoomInIcon: function () {
            if (this.isDarkMode) {
              return 'assets/img/zoom_in_dark.png';
            }
            return 'assets/img/zoom_in.png';
          },
          
          zoomOutIcon: function () {
            if (this.isDarkMode) {
              return 'assets/img/zoom_out_dark.png';
            }
            return 'assets/img/zoom_out.png';
          },
          
          oneToOneIcon: function () {
            if (this.isDarkMode) {
              return 'assets/img/one2one_dark.png';
            }
            return 'assets/img/one2one.png';
          },
          
          viewerContainerStyle: function () {
            var style = {
              transform: 'translate(' + this.viewerOffsetX + 'px, ' + this.viewerOffsetY + 'px) scale(' + this.viewerScale + ')',
              cursor: this.dragging ? 'grabbing' : 'grab'
            };
            
            // 根据当前模块设置容器尺寸
            if (this.currentModule === 'svga' && this.svga.hasFile) {
              // SVGA 使用实际尺寸
              var sizeWH = this.svga.fileInfo.sizeWH;
              if (sizeWH) {
                var parts = sizeWH.split(' × ');
                if (parts.length === 2) {
                  style.width = parts[0] + 'px';
                  style.height = parts[1] + 'px';
                }
              }
            }
            
            return style;
          }
        },
        watch: {
          bgColorKey: function () {
            var _this = this;
            this.$nextTick(function() {
              _this.applyCanvasBackground();
            });
          }
        },
        mounted: function () {
          var _this = this;
          this.initSvgaPlayer();
          this.initEmptyStateSvgaPlayer();
          var savedTheme = localStorage.getItem('theme');
          if (savedTheme === 'dark') {
            this.isDarkMode = true;
            document.body.classList.add('dark-mode');
          }

          // 点击外部关闭下拉菜单
          document.addEventListener('click', function(e) {
            if (_this.showChannelModeDropdown) {
              var selectWrapper = document.querySelector('.mp4-select-wrapper');
              if (selectWrapper && !selectWrapper.contains(e.target)) {
                _this.showChannelModeDropdown = false;
              }
            }
          });
          // 加载 help.md
          this.loadHelpContent();
          
          // 预加载非关键库
          this.preloadLibraries();
        }
      });
}

// 动态加载脚本
function loadScript(url) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = function() { reject(new Error('加载失败: ' + url)); };
    document.head.appendChild(script);
  });
}

// 页面加载完成后立即启动
(function() {
  // 显示加载提示
  var loadingDiv = document.createElement('div');
  loadingDiv.id = 'app-loading';
  loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; color: #666;';
  loadingDiv.textContent = '正在加载...';
  document.body.appendChild(loadingDiv);
  
  // 加载Vue
  loadScript('https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js')
    .catch(function() {
      // 备用CDN
      return loadScript('https://unpkg.com/vue@2.6.14/dist/vue.min.js');
    })
    .then(function() {
      // 加载SVGA播放器
      return loadScript('https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js');
    })
    .then(function() {
      // 移除加载提示
      document.body.removeChild(loadingDiv);
      // 启动应用
      initApp();
    })
    .catch(function(error) {
      loadingDiv.textContent = '加载失败，请刷新页面重试';
      loadingDiv.style.color = 'red';
      console.error(error);
    });
})();