/**
 * 应该继承与Base
 */
'use strick';

const win = $(window);
const doc = $(document);

export default class ScrollLoad {
	constructor(config) {
		this.init();
	};

	init() {
		this.referEl = this.referEl || win;
		this.winHeight = this.referEl.height();
		this._bind();
	}

	_bind() {
		this.referEl.on('scroll', $.proxy(this.scroll, this));
	}

	_scroll() {
		if ( !this.isPause() && !this._isLoading() && this._isRenderToBottom() ) {
			this.resetLoading();
			this.fire('request:nextPage');
		}
	}

	_resize() {
		this.winHeight = this.referEl.height();
	}

	_isLoading() {
		return this.loading == true;
	}

	_isRenderToBottom() {
		return this.referEl.height() - this.referEl.scrollTop() - this.winHeight - this.bufferHeight <= 0;
	}

	destroy() {

	}

	resetLoading() {
		this.loading = false;
	}

	resume() {
		this.isPauseNow = false;
	}

	pause() {
		this.isPauseNow = true;
	}

	isPause() {
		return this.isPauseNow;
	}

	defaults() {
		return {
			loading: false, // 是否正在加载
			bufferHeight: 100, //缓存高度
			isPauseNow: false, // 实现暂停
		}
	}

}