var instanceName = 'lazyLoad';
    var util = require('util');
    var LazyLoad = module.exports = function (opts) {
        var me = this;
        opts = _.extend({
            wrapper: $('body'),
            selector: '[data-lazy-src]',
            span: 60,
            handler: function () {
            }
        }, opts);

        me.$el = $(opts.wrapper);
        if (me.$el.data(instanceName)) {
            return me.$el.data(instanceName);
        }
        me.options = opts;
        me.$el.data(instanceName, me);
        me.id = util.uid();
        me._bindEvent();
    };
    _.extend(LazyLoad.prototype, {
        _isInViewport: function (r1, r2) {
            var span = this.options.span;
            return !(r2.bottom + span < r1.top || r2.top > r1.bottom + span);
        },
        _getElementRect: function ($el) {
            var offset = $el.offset() || {
                    top: 0,
                    left: 0
                },
                width = $el.width(),
                height = $el.height();

            return {
                width: width,
                height: height,
                top: offset.top,
                bottom: offset.top + height,
                left: offset.left,
                right: offset.left + width
            }
        },
        _bindEvent: function () {
            var me = this,
                $el = me.$el;

            var check = function () {
                me.update();
            };
            $el.on('scroll.' + me.id, check);
            $el.on('resize.' + me.id, check);
        },
        update: function () {
            var me = this,
                options = me.options;

            clearTimeout(me.timer);
            me.timer = setTimeout(function () {
                var r1 = me._getElementRect(me.$el);
                if (r1.width && r1.height) {
                    util.processLargeArrayByChunk(me.$el.find(options.selector), {
                        chunkSize: 100,
                        step: function (el) {
                            var $this = $(el),
                                r2 = me._getElementRect($this);
                            if (r2.width && r2.height && me._isInViewport(r1, r2)) {
                                options.handler($this);
                            }
                        }
                    });
                }
            }, 60);
        },
        /**
         * 元素是否可见，暂不考虑webkit浏览器，position:fixed的情况。
         * https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/offsetParent
         * 在 Webkit 中，如果元素为隐藏的（该元素或其祖先元素的 style.display 为 "none"），或者该元素的 style.position 被设为 "fixed"，则该属性返回 null。
         * 在 IE 9 中，如果该元素的 style.position 被设置为 "fixed"，则该属性返回 null。（display:none 无影响。）
         * @param $el
         * @returns {boolean|*}
         */
        isVisible: function ($el) {
            var el = $($el).get(0);
            return el && el.offsetParent !== null;
        },
        destroy: function () {
            this.$el.off('.' + this.id);
        }
    })
