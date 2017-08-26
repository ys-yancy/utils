/**
 * 继承  类似YUI3  Y.extend
 * @child 子类
 * @parent 父累
 * @px child.prototype
 * @sx child
 * 当前依赖zepto或Jquery
 */

"use extend"

/**
 * es5
 */

function extend(child, parent, px, sx) {
	if ( !child || !parent ) {
		return child;
	}

	var parentProto = parent.prototype;
	var childProto = Object.create(parentProto);

	child.prototype = childProto;
	childProto.constructor = child;
    child.superclass = parentProto;

    if ( parent != Object && parentProto.constructor == Object.prototype.constructor ) {
    	parentProto.constructor = parent;
    }

    if (px) {
    	$.extend(childProto, px, true);

    	if ( px.mix && $.isArray(p.mix) ) {
    		$.each(p.mix, function (index, fn) {
    			$.extend(childProto, fn, true);
    		})
    	}
    }

    if(sx) {
    	$.extend(child, sx, true);
    }

    return child;
}

/**
 * es6
 */

export default class extend {
	constructor(child, parent, px, sx) {
		if ( !child || !parent ) {
			return child
		}

		const parentProto = parent.prototype;
		const childProto = Object.create(parentProto);

		child.prototype = childProto;
		childProto.constructor = child;
		child.superclass = parentProto;

		if (parent != Object && parentProto.constructor == Object.prototype.constructor) {
			/**
			 * @(1)  parent = {}  parent为Object;
			 * @(2)  parent.prototype = {}  重写了原型
			 */
			
			parentProto.constructor = parent;
		}

		if(px) {
			$.extend(childProto, px, true);

			if (px.mix && $.isArray(px.mix)) {
				$.each(px.mix, (index, fn) => {
					$.extend(childProto, fn, true);
				})
			}
		}

		if(sx) {
			$.extend(child, sx, true);
		}

		return child;
	}
}




if(!Object.create) {
	Object.create = function(obj) {
		function F () {};

		return function() {
			F.prototype = obj;
			return new F();
		}
	}
}


module.exports = extend;