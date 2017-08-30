/**
 * 继承Base
 */

"use strict";
import Loading from './loading';
import ScrollLoad from './scroll-load';

export default class InfinityScroll {
	constructor() {

	}

	init() {

	}

	_bind() {

	}

	pause() {
		this.scrollLoad.pause();
	}

	resume() {
		this.scrollLoad.resume();
	}

	_loading(isLoading) {
		if ( isLoading ) {
			this.loading.show();
		} else {
			this.loading.hide();
      		this.scrollLoad.resetLoading();
		}
	}

	_load() {
		let params = this._getParams();

		params = $.merge(this.params, params);

		if ( this._isLoading() ) {
			return;
		}

		this._setLoading(true);

		if( this._hasNext() ) {
			this._getData(params);
			this._loading(true);
		} else {
			this._destroy();
		}
	}

	_getData(params) {
		this._request(params);
	}

	_request(params) {
	    let el = this.el,
	        v = this.v,
	        url = this.url,
	        tmpl = this.tmpl,
	        emptyTmpl = this.emptyTmpl,
	        page = this.page,
	        callback = this.callback,
	        parse = this.parse;

	    this.ajax({
	    	url: url,
	    	data: params,
	    	unjoin: this.unjoin
	    }).then((data) => {
	    	if ( this.hasDestroy ) {
	    		return;
	    	}

	    	data = parse({
	    		page: this.page,
        		pageSize: this.pageSize
	    	});

	    	if (!(data && data.data)) {
		        return;
		    }

		    // 内容为空
		    if (data.data.length === 0 && page == 0) {
		        this._noData(emptyTmpl, data, el);

		        callback(data);
		        return;
		    }

		    this.renderTo(tmpl, data.data, el);
		    this.hasNextPage = data.hasNextPage === 'true' || data.hasNextPage === true;
		    this.page += 1;
		    this._loading(false);
		    this._setLoading(false);
		    callback(data);
	    }, () => {
	    	let empty = self.error(data);
		    if (empty) {
		       self._noData(emptyTmpl, {}, el);
		    }
	    })
	}

	_noData(emptyTmpl, data, el) {
		this.render(emptyTmpl, data.data, el);
	    this._destory(true);
	    this.empty && this.empty();
	}

	_getParams() {
		let params = {
	        page: this.page,
	        pageSize: this.pageSize
    	};

	    if (this.beforeRequest && typeof this.beforeRequest === 'function') {
	      	params = this.beforeRequest(params);
	    }

	    return params;
	}

	destroy() {
		this.hasDestory = true;
    	this._destory();
	}

	_destory(isFirst) {
		let loadOnce = !this.infinite;
	    this.scrollLoad.destroy();
	    this.loading.finish({
	      	loadOnce: loadOnce,
	      	isFirst: isFirst
	    });
	}

	// 非无限加载机制，默认只加载一页
	_hasNext: function() {
	    if (this.infinite) {
	      	return this.hasNextPage === true;
	    } else {
	      	return this.page === 0;
	    }
	},

	_isLoading: function() {
    	return this.isLoading;
  	},

	_setLoading: function(isLoading) {
	    this.isLoading = !!isLoading;
	},

	defaults() {
		return {
			el: null,
			params: {},
			pageSize: 12,
			page: 0,
			hasNextPage: true,
			url: '',
    		v: '',
    		tmpl: null,
    		emptyTmpl: null,
    		empty: () => {},
    		callback: () => {},
    		parse: data => {data},
    		beforeRequestP: data => {data},
    		error: () => {},
    		infinite: true,
    		isLoading: false
		}
	}
}