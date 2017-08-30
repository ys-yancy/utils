/**
 * 应该继承于Base
 */

export default class Loading {
	constructor() {
		this.init();
	}

	init() {
		this._initAttrs()
	}

	_bind() {

	}

	show() {
		this.el.show();
	}

	hide() {
		this.el.hide();
	}

	finish() {
		this.el.hide();
		
	}

	_initAttrs() {
		if ( this.needInit ) {
			this.render(this.tmpl, this.textMsg, this.el);
		}
	}

	defaults() {
		return {
			finishedMsg: '没有更多数据了！',
			textMsg: '加载中...',
			needInit: true,

			tmpl: '<div class="loading ks-loading"><%= data %></div>'
		}
	}
}