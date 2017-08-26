var extnd = require();
/**
 * @base 
 * @config 参数 {}
 * @attrs 属性
 * @states 状态
 * @defaults 默认值
 *  attrs states defaults 最后都转化为实例自身上
 */

// es6


// class Base {
//     constructor() {
//         var config = arguments[0] || {};
//         var attrs = this.attrs || {};
//         var states = this.states || {};

//         initAttrs(this, attrs);
//         initAttrs(this, states, true);
//         initAttrs(this, config);
//         this._events = {};
//     }

//     [...CustomEvent]

// }

// es5

function Base() {
	var config = arguments[0] || {};
    var attrs = this.attrs || {};
    var states = this.states || {};

    if (typeof this.defaults === 'function') {
	    var defaults = this.defaults();
	    initAttrs(this, defaults);
  	}

  	initAttrs(this, attrs);
  	initAttrs(this, states, true);
  	initAttrs(this, config);

  	// 在html里提供webpack对象的入口
  	// window.webpackObject = this;

  	// this._events = {};  // 实例内watcher的缓存容器
  	
}

Base.prototype.constructor = Base;
Base.extend = extend;

// 自定义方法
$.extend(Base.prototype, CustomEvent);

function initAttrs(obj, attrs, isDefine) {
  	var val, getter, setter;

  	for ( var key in attrs ) {
  		if (attrs.hasOwnProperty(key)) {
  			val = attrs[key];

  			if (isDefine) {
  				if ($.isPlainObject(attrs[key]) && isConfigObj(attrs[key])) {
  					val = attrs[key].value;
  					getter = attrs[key].getter;
  					setter = attrs[key].setter;
  				}
  				defineProperty(obj, key, val, getter, setter);
  			}

  			obj[key] = val;
  		}
  	}
}

function isConfigObj(obj) {
  	return $.isFunction(obj.setter) || $.isFunction(obj.getter);
}

function defineProperty(obj, key, val, getter, setter) {
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,

		get: function() {
			if (getter && $.isFunction(getter)) {
				return getter(val);
			} else {
				return val;
			}
		},
		set: function(value) {
			if (val !== value) {
				var upperKey = upperCase(key);
				var eventType = 'before' + upperKey + 'Change';

				// this.fire(eventType, {
				// 	curVal: val,
				// 	newVal: value
				// });
				
				var preVal = val;

				if (setter && $.isFunction(setter)) {
					val = setter(value);
				} else {
					return value;
				}

				var eventType = 'after' + upperKey + 'Change';
				// this.fire(eventType, {
				// 	curVal: val,
    //       			preVal: preVal
				// })
			}
		}
	});
};

function upperCase(word) {
  return word.substring(0, 1).toUpperCase() + word.substring(1);
}

$.merge = function(target) {
  var deep, slice = [].slice,
    args = slice.call(arguments, 1),
    ret = {}
  if (typeof target == 'boolean') {
    deep = target
    target = args
  } else {
    target = slice.call(arguments, 0)
  }
  $.extend.apply($, [!!deep, ret].concat(target))
  return ret;
};

module.exports = Base;
