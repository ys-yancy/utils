/**
 * Created by Ys.
 */
define(function (require, exports, module) {
    var util = require('qx-util'),
        RangeBar = require('qx-modules/video/range-bar');
    var defaultVolume;

    module.exports = Backbone.View.extend({
        options: {
            autoPlay: false,
            wrapper: null,
            loop: false,
            currentTime: 0,
            volume: 30,
            mute: false,
            playbackRate: 1,
            src: ''
        },

        events: {
            'click': '_stopPropagation',
            'click .video': 'togglePlay',
            'click .btn-play': 'togglePlay',
            'click .controls-panel': '_stopPropagation',
            'click .btn-volume': 'toggleMute'
        },

        initialize: function () {
            var me = this;
            me._initElements();
            me._initWidgets();
            me._bindDomEvents();
            me._bindWidgetEvents();
            me._initVideo();
        },

        _initElements: function () {
            var me = this,
                options = me.options,
                $el = $('<div class="f-qx-video-panel"></div>');

            me.$video = $('<video class="video"></video>').appendTo($el);
            var $controlsPanel = me.$controlsPanel = $('<div class="controls-panel"></div>').appendTo($el);
            me.$playButton = $('<div class="btn-play"></div>').appendTo($controlsPanel);
            me.$volumeWrapper = $('<div class="volume-wrapper"></div>').appendTo($controlsPanel);
            me.$volumeButton = $('<span class="btn-volume"></span>').appendTo(me.$volumeWrapper);
            me.$volumePanel = $('<div class="volume-panel"></div>').appendTo(me.$volumeWrapper);
            me.$currentTime = $('<div class="current-time">00:00</div>').appendTo($controlsPanel);
            me.$totalTime = $('<div class="total-time">00:00</div>').appendTo($controlsPanel);
            me.$progressWrapper = $('<div class="progress-wrapper"></div>').appendTo($controlsPanel);
            me.$loading = $('<div class="loading-wrapper"></div>').appendTo($el);

            $el.appendTo(options.wrapper || 'body');
            me.setElement($el);
        },

        _initWidgets: function () {
            var me = this;
            me.widgets = {
                volume:new RangeBar({
                    wrapper: me.$volumePanel,
                    direction: 'vertical'
                }),
                progressBar: new RangeBar({
                    wrapper: me.$progressWrapper,
                    step: 0,
                    fixed: 6
                })
            };
        },

        _bindDomEvents: function () {
            var me = this,
                $video = me.$video;

            var updateProgressBar = function () {
                    var currentTime = $video[0].currentTime;
                    me.widgets.progressBar.setValue(currentTime, true);
                    stopUpdateProgressBar();
                    me.updateTimer = setTimeout(function () {
                        updateProgressBar();
                    }, 16);
                },
                stopUpdateProgressBar = function () {
                    if (me.updateTimer) {
                        clearTimeout(me.updateTimer);
                        me.updateTimer = null;
                    }
                };

            $video.on('pause', function (evt) {
                me.$playButton.attr('data-state', 'pause');
                me.$controlsPanel.show();
                me.trigger('pause', evt);
                stopUpdateProgressBar();
            });

            $video.on('play', function (evt) {
                me.$playButton.attr('data-state', 'play');
                me.trigger('play', evt);
                updateProgressBar();
            });

            $video.on('playing', function (evt) {
                me.trigger('playing', evt);
                updateProgressBar();
            });

            $video.on('ended', function (evt) {
                me.setCurrentTime(0);
                stopUpdateProgressBar();
                me.trigger('ended', evt);
            });

            $video.on('canplay', function (evt) {
                me.$el.addClass('state-ready');
                me.$loading.hide();
                me.trigger('canplay', evt);
            });

            $video[0].onerror = function (evt) {
                var error = evt.srcElement.error;
                me.error = true;
                console.error('[Video Error]', 'Error Code:' + error.code, 'Error Message:' + error.message);
            };

            _.each(['emptied', 'stalled', 'waiting'], function (v) {
                $video.on(v, function (evt) {
                    me.trigger(v, evt);
                    stopUpdateProgressBar();
                });
            });

            _.each(['seeking', 'seeked', 'ratechange', 'suspend'], function (v) {
                $video.on(v, function (evt) {
                    me.trigger(v, evt);
                });
            });

            $video.on('volumechange', function (evt) {
                var volume = $video[0].volume;

                if (volume === 0) {
                    me.$volumeButton.attr('data-state', 'mute');
                }
                else if (volume > 0.5) {
                    me.$volumeButton.attr('data-state', 'loud');
                }
                else {
                    me.$volumeButton.attr('data-state', '');
                }

                var value = parseInt(volume * 100, 10);
                me.widgets.volume.setValue(value, false);
                me.trigger('volumeChange', value);
                defaultVolume = value;
            });

            $video.on('durationchange', function () {
                var duration = parseInt($video[0].duration, 10);
                me.$totalTime.text(util.formatSeconds(duration));
                me.widgets.progressBar.setOptions({
                    max: duration
                });
            });

            $video.on('timeupdate', (function () {
                var last = '00:00';
                return function () {
                    var currentTime = $video[0].currentTime,
                        str = util.formatSeconds(parseInt(currentTime, 10));
                    if (str !== last) {
                        last = str;
                        me.$currentTime.text(util.formatSeconds(currentTime));
                    }
                    me.widgets.progressBar.setValue(currentTime, true);
                }
            })());

            util.delayHover(me.$volumeWrapper, function () {
                me.$volumePanel.show();
                me.widgets.volume.updatePosition();
            }, function () {
                me.$volumePanel.hide();
            });

            util.delayHover(me.$el, function () {
                me.$controlsPanel.show();
                me.widgets.progressBar.updatePosition();
            }, function () {
                if (!$video[0].paused) {
                    me.$controlsPanel.hide();
                }
            });
        },

        _bindWidgetEvents: function () {
            var me = this,
                widgets = me.widgets;

            widgets.volume.on('change', function (value) {
                me.$video[0].volume = (value / 100).toFixed(1);
            });
            widgets.progressBar.on('change', function (value) {
                me.setCurrentTime(value);
            });
            me.once('canplay', function () {
                if (me.options.autoPlay) {
                    me.play();
                }
            });
        },

        _initVideo: function () {
            var me = this,
                $video = me.$video,
                options = me.options;
            if (options.src) {
                $video.empty().append('<source src="' + options.src + '" type="video/mp4">');
            }

            if (options.loop) {
                $video.attr('loop', true);
            }

            if (options.mute) {
                me.setVolume(0);
            }
            else {
                if (defaultVolume !== undefined) {
                    me.setVolume(defaultVolume);
                }
                else {
                    me.setVolume(options.volume);
                }
            }

            me.setCurrentTime(options.currentTime);
        },

        /**
         * 跳转到
         * @param value
         */
        setCurrentTime: function (value) {
            try {
                this.$video[0].currentTime = value;
            }
            catch (e) {
                console.error(e);
            }
        },

        /**
         * 设置声音大小
         * @param {number} value 取值范围0到100
         */
        setVolume: function (value) {
            this.widgets.volume.setValue(value);
        },

        /**
         * 获取声音大小
         * @return {number} 取值范围0到100
         */
        getVolume: function () {
            return this.widgets.volume.getValue();
        },

        /**
         *
         * @param {number} value
         */
        setPlaybackRate: function (value) {
            this.$video[0].playbackRate = value
        },

        load: function () {
            this.$video[0].load();
        },

        /**
         * 播放
         */
        play: function () {
            var me = this;
            if (me.error) {
                me.load();
                me.once('canplay', function () {
                    me.error = false;
                    me.play();
                });
            }
            else {
                me.$video[0].play();
            }
        },

        /**
         * 重新播放
         */
        replay: function () {
            this.stop();
            this.play();
        },

        /**
         * 暂停
         */
        pause: function () {
            this.$video[0].pause();
        },

        /**
         * 暂停、播放
         */
        togglePlay: function () {
            var me = this;
            if (me.$video[0].paused) {
                me.play();
            }
            else {
                me.pause();
            }
        },

        /**
         * 静音、取消静音
         */
        toggleMute: (function () {
            var volume;
            return function () {
                var me = this, value = me.getVolume();
                if (value) {
                    volume = value;
                    me.setVolume(0);
                }
                else {
                    me.setVolume(volume || me.options.volume);
                }
            }
        })(),

        /**
         * 停止
         */
        stop: function () {
            this.pause();
            this.setCurrentTime(0);
        },

        _stopPropagation: function (evt) {
            evt && evt.stopPropagation();
        },

        destroy: function () {
            this.trigger('destroy');
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
            this.widgets.volume.destroy();
            this.widgets.progressBar.destroy();
            this.remove();
        }
    });
});