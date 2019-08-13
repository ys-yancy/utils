/**
 * Created by haipeng on 12/01/2018
 * @author haipeng
 */
define(function (require, exports, module) {
    /**
     * 漏桶(配置令牌桶也可以)
     * @param {object} [options]
     * @param {number} [options.interval] 至少多长时间执行一次
     * @param {number} [options.size] 桶大小
     * @constructor
     */
    var LeakyBucket = function (options) {
        var me = this;
        options = options || {};

        me._interval = options.interval || 1000;
        me._size = options.size || 10;

        me._lastTime = +new Date();
        me._pending = [];
        me._running = null;

        me._initProperties();
    };

    _.extend(LeakyBucket.prototype, {
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
        },

        throttle: function (cb) {
            var me = this;

            // 超过桶大小，溢出，拒绝执行
            if (me.pending < me._size) {
                me._pending.push(cb);
                me._run();
            }
        },

        _run: function () {
            var me = this;
            if (!me._running && me._pending.length) {
                me._running = true;
                var callback = me._pending.shift();

                var run = function () {
                    var now = +new Date();
                    var delta = now - me._lastTime;
                    me._lastTime = now;

                    if (delta >= me._interval) {
                        $.when(callback.call(null)).always(function () {
                            me._running = false;
                            me._run();
                        });
                    }
                    else {
                        setTimeout(run, me._interval - delta);
                    }
                };

                run();
            }
        }
    });

    module.exports = LeakyBucket;
});