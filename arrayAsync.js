/**
 * Created by Ys on 16/6/30.
 * @author Yancy
 * 异步操作数组
 */
define(function (require, exports, module) {
    var EXECUTE_MODE = {
        'parallel': 'parallel',
        'serial': 'serial'
    };
    var Future = function (callback) {
        var me = this;
        me._queue = [];
        me.isDone = false;

        var consumeQueue = function (value) {
            if (!me.isDone) {
                me._value = value;
                me.isDone = true;
            }
            _.each(me._queue, function (cb) {
                cb(me._value);
            });
            me._queue.length = 0;
        };
        callback(consumeQueue);
    };
    Future.prototype.done = Future.prototype.then = function (callback) {
        var me = this;
        if (me.isDone) {
            callback(me._value);
        }
        else {
            me._queue.push(callback);
        }
        return this;
    };
    /**
     *
     * @param arr
     * @param iterator 迭代器
     * @param context 作用域|上下文
     * @param option.mode 执行方式, 'serial':串行, 默认方式;'parallel':并行
     */
    var each = exports.each = exports.forEach = function (arr, iterator, context, option) {
        return new Future(function (done) {
            var next;
            var len = arr.length;
            option = _.extend({
                mode: EXECUTE_MODE.serial
            }, option || {});

            if (option.mode == EXECUTE_MODE.parallel) {
                var count = 0;
                next = function () {
                    count++;
                    if (count == len || status == each.__BREAK_FLAG__) {
                        done();
                    }
                };

                _.each(arr, function (item, index) {
                    iterator.call(context, item, index, next);
                });
            }
            else {
                var index = -1;
                next = function (status) {
                    index++;
                    if (index == len || status == each.__BREAK_FLAG__) {
                        done();
                    }
                    else {
                        iterator.call(context, arr[index], index, next)
                    }
                };
                next();
            }
        });
    };
    each.__BREAK_FLAG__ = {};
    exports.Future = Future;
});