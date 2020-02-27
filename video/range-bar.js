/**
 * Created by Ys.
 */
define(function (require, exports, module) {
    /**
     * @param {object} options
     * @param {number} options.min 最小值
     * @param {number} options.max 最大值
     * @param {number} options.start 初始值
     * @param {number} options.step 步长
     * @param {number} options.fixed 没有设置步长时，保留小数点后几位
     * @param {boolean} options.disable 是否禁用
     * @param {string} options.direction 设置方向
     */
    module.exports = Backbone.View.extend({
        options: {
            wrapper: null,
            min: 0,
            max: 100,
            start: 0,
            step: 1,
            disable: false,
            fixed: 2,
            direction: 'horizontal' // horizontal vertical
        },

        initialize: function () {
            var me = this,
                $el = $('<div class="f-qx-range-bar"></div>');

            me.$slider = $('<div class="slider"></div>').appendTo($el);
            me.$track = $('<div class="track"></div>').appendTo($el);
            $el.appendTo($(me.options.wrapper || 'body'));
            me.setElement($el);
            // 设置拖动状态，绑定事件
            if (me.options.disable) {
                $el.addClass('f-qx-range-bar-disable');
            }
            else {
                me._bindEvents();
            }
            me.setOptions(this.options);
        },

        setOptions: function (options) {
            var me = this;
            options.disable ? me.disable() : me.enable();
            _.extend(me.options, options);
            if (options.hasOwnProperty('direction')) {
                me.setDirection(me.options.direction); // 设置方向
            }

            if (options.hasOwnProperty('start')) {
                me.setValue(me.options.start, true);   // 设值
            }
            else {
                me.setValue(me.getValue(), true);   // 设值
            }
        },

        setDirection: function (direction) {
            var me = this, updatePosition;
            // 设置方向
            if (direction === 'vertical') {
                me._move = me._verticalMove;
                updatePosition = me._updateVerticalPosition;
                me.$el.addClass('f-qx-range-bar-vertical');
            }
            else {
                me._move = me._horizontalMove;
                updatePosition = me._updateHorizontalPosition;
                me.$el.addClass('f-qx-range-bar-horizontal');
            }

            me.updatePosition = function () {
                if (me.$el.is(':visible')) {
                    updatePosition.call(me);
                }
            };
        },

        _bindEvents: function () {
            var me = this,
                $document = $(document),
                eventNameSpace = '.' + me.cid,
                move = function (evt) {
                    evt.preventDefault();
                    if (!me.options.disable) {
                        me._move(evt);
                    }
                },
                up = function () {
                    $document.off('mousemove' + eventNameSpace, move);
                    $document.off('mouseup' + eventNameSpace, up);
                };

            me.$el.on('mousedown' + eventNameSpace, function (evt) {
                move(evt);
                $document.on('mousemove' + eventNameSpace, move);
                $document.on('mouseup' + eventNameSpace, up);
            });
        },

        _unbindEvents: function () {
            var me = this;
            me.$el.off('.' + me.cid);
            $(document).off('.' + me.cid);
        },

        /**
         *
         * @param {number} pos 当前位置
         * @param {number} start 开始位置
         * @param {number} length 可拖拽区域长度
         * @private
         */
        _calcValueByPosition: function (pos, start, length) {
            var options = this.options,
                value = 0;

            if (length) {
                value = (pos - start) * (options.max - options.min) / length;
            }

            return value;
        },

        _verticalMove: function (evt) {
            var me = this,
                trackHeight = me.$el.height() - me.$slider.height();
            me.setValue(me._calcValueByPosition(-evt.clientY, $(window).scrollTop() - me.$el.offset().top - trackHeight, trackHeight));
        },

        _horizontalMove: function (evt) {
            var me = this;
            me.setValue(me._calcValueByPosition(evt.clientX, me.$el.offset().left - $(window).scrollLeft(), me.$el.width() - me.$slider.width()));
        },

        _updateVerticalPosition: function () {
            var me = this,
                y = 0,
                h = me.$el.height() - me.$slider.height(),
                r = me.options.max - me.options.min;

            if (r) {
                y = h * (1 - me.getValue() / r);
            }

            me.$slider.css('top', y);
        },

        _updateHorizontalPosition: function () {
            var me = this,
                x = 0,
                w = me.$el.width() - me.$slider.width(),
                r = me.options.max - me.options.min;

            if (r) {
                x = w * me.getValue() / r;
            }

            me.$slider.css('left', x);
        },

        /**
         *
         * @param {number} value
         * @param {boolean} silent 是否静默设值
         * @return {number}
         */
        setValue: function (value, silent) {
            var me = this,
                options = me.options,
                oldValue = me.__value__;

            if (value > options.max) {
                value = options.max;
            }
            else if (value < options.min) {
                value = options.min;
            }

            if (options.step) {
                value = Math.floor(value / options.step) * options.step
            }

            if (options.fixed) {
                value = parseFloat(value.toFixed(options.fixed));
            }

            if (value !== oldValue) {
                me.__value__ = value;
                me.updatePosition();
                !silent && this.trigger('change', value, oldValue);
            }
            return value;
        },

        /**
         *
         * @return {value|*}
         */
        getValue: function () {
            return this.__value__;
        },

        /**
         * 不可拖动
         */
        disable: function () {
            var me = this;
            if (!me.options.disable) {
                me._unbindEvents();
                me.options.disable = true;
                me.$el.addClass('f-qx-range-bar-disable');
            }
        },

        /**
         * 启用拖动
         */
        enable: function () {
            var me = this;
            if (me.options.disable) {
                me._bindEvents();
                me.options.disable = false;
                me.$el.removeClass('f-qx-range-bar-disable');
            }
        },

        /**
         *
         */
        destroy: function () {
        }
    });
});