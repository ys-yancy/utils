/**
 * Created by haipeng on 12/01/2018
 * @author haipeng
 */
define(function (require, exports, module) {
    /**
     * 令牌桶
     * @param {object} [options]
     * @param {number} [options.interval] 至少多长时间执行一次
     * @param {number} [options.size] 桶大小
     * @param {number} [options.buffer] 队列大小
     * @param {number} [options.count] 初始数量
     * @param {boolean} [options.shift] 超出buffer大小时，新任务进入，是否弹出旧任务
     * @constructor
     */
    var TokenBucket = function (options) {
        var me = this;
        options = options || {};

        me._interval = options.interval || 1000;
        me._size = options.size || 3;
        me._buffer = Math.max(options.buffer || 10, 1);
        me._count = Math.min(options.count || 3, me._size);
        me._shift = options.shift;

        me._lastTime = +new Date();
        me._pending = [];
        me._running = null;

        me._initProperties();
    };

    _.extend(TokenBucket.prototype, {
        _initProperties: function () {
            var me = this;
            // 是否正在执行任务
            Object.defineProperty(me, 'running', {
                enumerable: true,
                get: function () {
                    return me._running;
                }
            });

            // 排队中的任务数量
            Object.defineProperty(me, 'pending', {
                enumerable: true,
                get: function () {
                    return me._pending.length
                }
            });

            // 返回token数量
            Object.defineProperty(me, 'count', {
                enumerable: true,
                get: function () {
                    var now = + new Date();
                    me._count = Math.min(me._count + Math.floor((now - me._lastTime) / me._interval), me._size);
                    me._lastTime = now;
                    return me._count;
                }
            });

            // 返回桶大小
            Object.defineProperty(me, 'size', {
                enumerable: true,
                get: function () {
                    return me._size;
                }
            });

            // 返回桶大小
            Object.defineProperty(me, 'buffer', {
                enumerable: true,
                get: function () {
                    return me._buffer;
                }
            });
        },

        throttle: function (cb) {
            var me = this;

            // 超出buffer大小时，新任务进入，是否弹出旧任务
            if (me.pending === me._buffer && me._shift) {
                me._pending.shift();
            }

            // 超过桶大小，溢出，拒绝执行
            if (me.pending < me._buffer) {
                me._pending.push(cb);
                me._run();
            }
        },

        _run: function () {
            var me = this;
            if (!me._running && me.pending) {
                me._running = true;
                var callback = me._pending.shift();

                var run = function () {
                    var delta = 1 - me.count;
                    if (delta > 0) {
                        setTimeout(run, Math.ceil(delta * me._interval));
                    }
                    else {
                        $.when(callback.call(null)).always(function () {
                            me._running = false;
                            me._count--;
                            me._run();
                        });
                    }
                };

                run();
            }
        }
    });

    module.exports = TokenBucket;
});