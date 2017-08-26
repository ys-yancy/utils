/**
 * 观察者模式
 */

"use strict";

const _cache = {};

const Watcher =  {
	/**
	 * 派发
	 * @param  {[type]} type 事件类型
	 * @param  {[type]}# data 回调数据
	 * @return {[type]}      [description]
	 */
	
	broadcast: function(type, data) {
		const listeners = _cache[type],
			  len = 0;

		if ( undefined !== listeners ) {
			let args = [].slice.call(arguments, 0);
		    args = args.length > 2 ? args.splice(2, args.length - 1) : [];
		    args = [data].concat(args);

		    len = listeners.length;

		    for ( let i = 0; i < len; i++ ) {
		    	const listener = listeners[i];
		        if (listener && listener.callback) {
		          args = args.concat(listener.args);
		          listener.callback.apply(listener.scope, args);
		        }
		    }
		}

		return this;
	}

	// es6
	broadcast: function(type, data, ...args) {
		const listeners = _cache[type],
			  len = 0;

		if ( undefined !== listeners ) {
			args = data.concat(args);
			len  = listeners.length;

			for (let listener of listeners) {
				if (listener && listener.callback) {
					args = args.concat(listener.args);
					listener.callback.apply(listener.scope, args);
				}
			}
		}
	}

	/**
	 * 订阅广播事件
	 * @param  {[type]}   types     事件类型，支持,分隔符
	 * @param  {Function} callback 回调函数
	 * @param  {[type]}   scope    回调函数上下文
	 * @return {[type]}            this
	 */
	
	subscribe: function(types, callback, scope) {
		types = types || [];
		var args = [].slice.call(arguments);

		if (typeof types === 'string') {
		    types = types.split(',');
		}

		var len = types.length;

		if (len === 0) {
		    return this;
		}

		args = args.length > 3 ? args.splice(3, args.length - 1) : [];

		for (var i = 0; i < len; i++) {
	        var type = types[i];
		    _cache[type] = _cache[type] || [];
		    _cache[type].push({
		        callback: callback,
		        scope: scope,
		        args: args
		    });
	    }

	    return this;
	}

	// es6
	subscribe: function(types = [], callback, scope, ...args) {
		if (typeof types === 'string') {
		    types = types.split(',');
		}

		const len = types.length;

		if (len === 0) {
		    return this;
		}
		for (let type of types) {
		    _cache[type] = _cache[type] || [];
		    _cache[type].push({
		        callback: callback,
		        scope: scope,
		        args: args
		    });
	    }

	    return this;
	}

	/**
	 * 退订
	 * @param  {[type]}   type     [description]
	 * @param  {Function} callback 假如传入则移出传入的监控事件，否则移出全部
	 * @return {[type]}            [description]
	 */
	
	unsubscribe: function(type, callback, scope) {
		var listeners = _cache[type];
	    if (!listeners) {
	        return this;
	    }

	    if (callback) {
	        var len = listeners.length,
	        tmp = [];

	        for (var i = 0; i < len; i++) {
		        var listener = listeners[i];
		        if (listener.callback == callback && listener.scope == scope) {} else {
		          tmp.push(listener);
		        }
	        }
	        listeners = tmp;
	    } else {
	        listeners.length = 0;
	    }

	    return this;
	}

	removeAll: function() {
	    _cache = {};
	    return this;
	}
}