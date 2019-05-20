"use strict";

var Focha = require('../lib/focha');

var slice = [].slice;
var HTTP_REG = /(((http[s]?|ftp):\/\/|www\.)[a-z0-9\.\-]+\.([a-z]{2,4})|((http[s]?|ftp):\/\/)?((2[0-4][\d])|(25[0-5])|([01]?[\d]{1,2}))(\.((2[0-4][\d])|(25[0-5])|([01]?[\d]{1,2}))){3})(:\d+)?(\/?[a-z0-9\$\^\*\+\?\(\)\{\}\.\-_~!@#%&:;/=<>]*)?/gi;
// 参考 https://developer.mozilla.org/en-US/docs/Glossary/Empty_element
var emptyTags = util.makeMap('area base br col embed hr img input keygen link meta param source track wbr');

var utils = module.exports = {
  guid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  getUnit: function(num) {
    var num = parseFloat(num),
      unit = 0;

    while (num < 1) {
      num *= 10;
      unit++;
    }

    return unit;
  },

  getTime: function(timestr, pattern) {
    return Focha.parse(timestr, pattern || 'YYYY-MM-DD HH:mm:ss').getTime();
  },

  formateDate: function(time, forate) {
    var date = new Date(time);
    return Focha.format(date, forate || 'YYYY-MM-DD HH:mm:ss');
  },

  getDate: function(time) {
    var date = new Date(time || Date.now());
    return Focha.format(date, 'YYYY-MM-DD');
  },

  getStrLen: function(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      //单字节加1 
      if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
        len++;
      } else {
        len += 2;
      }
    }

    return len;
  },


  /** * 对Date的扩展，将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
      可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) * eg: * (new
      Date()).pattern("yyyy-MM-dd hh:mm:ss.S")==> 2006-07-02 08:09:04.423      
   * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04      
   * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04      
   * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04      
   * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18      
   */
  formateTime: function(time, fmt) { //author: meizz 
    var date = new Date(time);
    var o = {
      "M+": date.getMonth() + 1, //月份         
      "d+": date.getDate(), //日         
      "h+": date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, //小时         
      "H+": date.getHours(), //小时         
      "m+": date.getMinutes(), //分         
      "s+": date.getSeconds(), //秒         
      "q+": Math.floor((date.getMonth() + 3) / 3) //季度         
        // "S": date.getMilliseconds() //毫秒         
    };
    var week = {
      "0": "/u65e5",
      "1": "/u4e00",
      "2": "/u4e8c",
      "3": "/u4e09",
      "4": "/u56db",
      "5": "/u4e94",
      "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[date.getDay() + ""]);
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  },

  isWeixin: function() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
      return true;
    } else {
      return false;
    }
  },

  isZhifubao: function() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/AlipayClient/i) == 'alipayclient') {
      return true;
    } else {
      return false;
    }
  },

  isAndroid: function() {
    var u = navigator.userAgent;
    return u.indexOf('Android') > -1 || u.indexOf('Linux') > -1;
  },

  isIOS: function() {
    var u = navigator.userAgent;
    return u.indexOf('iPhone') > -1 || u.indexOf('iPad') > -1;
  },

  isDaily: function() {
    return location.host.indexOf('localhost') !== -1 || location.host.indexOf('waibao.') !== -1;
  },

  supportWebsocket: function() {
    var protocol = 'https:' == location.protocol ? 'wss' : 'ws',
      protoBin;

    if ('WebSocket' in window) {
      if (protoBin = 'binaryType' in WebSocket.prototype) {
        return protoBin;
      }
      try {
        return !!(new WebSocket(protocol + '://.').binaryType);
      } catch (e) {}
    }

    return false;

  },

  ensure: function (obj, key, factory) {
    return obj[key] || (obj[key] = factory());
  },
  
  createPromiseQueue: function (callback, context, getQueueKey, queueMap) {
    queueMap = queueMap || {};

    if (!getQueueKey) {
      var randomKey = util.uid();
      getQueueKey = function () {
        return randomKey;
      }
    }

    return function () {
      var args = [].slice.call(arguments),
        key = getQueueKey.apply(context, args),
        dfd = $.Deferred();

      $.when(queueMap[key]).always(function () {
        dfd.resolve();
      });

      return queueMap[key] = dfd.then(function () {
        return callback.apply(context, args);
      });
    };
  },

  /**
   * 把小promise组合成一个大promise
   * 小promise之间串行处理，上游promise的返回数据作为下游promise的入参
   * @param {*} 不限类型，不限数量
   * @returns {*|JQueryDeferred<T>}
   * ``` javascript
   * var test = composePromises(function (num) {
   *     return parseInt(num * 5000);
   * }, function (n) {
   *     var $dfd = $.Deferred();
   *     setTimeout(function () {
   *         n % 2 ? $dfd.resolve(n) : $dfd.reject(n);
   *     }, n);
   *     return $dfd;
   * });
   *
   * test(Math.random()).then(function (res) {
   *     console.log('resolved:', res);
   * }, function (res) {
   *     console.log('rejected:', res);
   * });
   * ```
   */
  composePromises: (function () {
    var dispatch = function (handlers, index, data) {
      var handler = handlers[index];
      var result = $.when($.isFunction(handler) ? handler(data) : handler);

      if (index < handlers.length - 1) {
        return result.then(function (res) {
          return dispatch(handlers, ++index, res);
        });
      }

      return result;
    };

    return function () {
      var args = Array.prototype.slice.call(arguments, 0);
      return function (data) {
        return dispatch(args, 0, data);
      }
    }
  })(),

  /**
   * 分片处理大数据量数组
   * @param arr                   一个庞大的数组
   * @param options
   * @param options.startIndex    起始index
   * @param options.endIndex      结束index
   * @param options.chunkSize     分片大小
   * @param options.chunkStart    分片执行开始
   * @param options.step          单步执行
   * @param options.chunkEnd      分片执行结束
   * @param options.complete      所有任务执行结束
   * @param options.interval      分片之间的时间间隔
   */
  processLargeArrayByChunk: function (arr, options) {
    var index = options.startIndex || 0,
      chunkSize = options.chunkSize || 100,
      chunkStart = options.chunkStart || function () { },
      step = options.step || function () { },
      chunkEnd = options.chunkEnd || function () { },
      complete = options.complete || function () { },
      interval = options.interval || 20,
      len = arr.length,
      endIndex = options.endIndex || len;

    if (!len) {
      complete();
    }
    setTimeout(function run() {
      var s = index,
        e = Math.min(index + chunkSize, len, endIndex);

      chunkStart(s, e - 1);

      while (index < e) {
        step(arr[index], index);
        index++;
      }

      chunkEnd(s, e - 1);

      if (index < len) {
        setTimeout(run, interval);
      }
      else {
        complete();
      }
    }, 0);
  },

  /**
   * 根据字符串、字符串数组创建map
   * @param {array.<{string}>|string} items
   * @param {string|regExp} [delimiter] 默认值/\s+/
   * @param {object} [map]
   * @returns {{*}}
   */
  makeMap: function (items, delimiter, map) {
    items = items || [];
    if (typeof items === 'string') {
      items = items.split(delimiter || /\s+/);
    }
    map = map || {};

    for (var i = items.length - 1; i >= 0; i--) {
      map[items[i]] = true;
    }
    return map;
  },

  /**
   * 设置图片路径：确保图片正常加载后再设置图片路径
   * @param $img
   * @param src
   * @return {*|JQueryDeferred<T>}
   *      失败状态码说明：1=参数错误; 2=网络加载失败; 3=当前设置已过期。
   */
  setImgSrc: (function () {
    var queue = [];
    var runing = [];

    var setImgSrc = function (item) {
      var img;
      var $img = item.$img;
      var src = item.src;
      var $dfd = item.$dfd;

      if (src && $img) {
        $img = $($img);
        img = new Image();
        var id = util.uid();
        $img.data('async-set-img-src-id', id);
        img.onload = function () {
          if ($img.data('async-set-img-src-id') == id) {
            $img.removeAttr('async-set-img-src-id');
            $img.attr('src', src).addClass('state-loaded');
            $dfd.resolve({
              width: img.width,
              height: img.height
            });
            img = null;
          }
          else {
            $dfd.reject(3);
          }
        };
        img.onerror = function () {
          img = null;
          $dfd.reject(2);
        };
        img.src = src;
      }
      else {
        $dfd.reject(1);
      }

      return $dfd;
    };

    var run = function () {
      if (queue.length && runing.length < 4) {
        var item = queue.shift();
        runing.push(item);
        setImgSrc(item).always(function () {
          var index = runing.indexOf(item);
          if (index > -1) {
            runing.splice(index, 1);
          }
          run();
        });
      }
    };
    return function ($img, src) {
      var item = {
        $img: $img,
        src: src,
        $dfd: $.Deferred()
      };

      queue.push(item);
      run();

      return item.$dfd.promise();
    }
  })(),

  // 遍历节点下的文本节点
  walkTextNode: function (node, fn) {
    if (node.nodeType == 3) {
      fn(node);
    }
    else if (node.nodeType == 1 && !emptyTags[node.tagName.toLowerCase()]) {
      var cursor = node.firstChild,
        next;

      while (cursor) {
        next = cursor.nextSibling;
        utils.walkTextNode(cursor, fn);
        cursor = next;
      }
    }
  },

  /**
   * 扫描文本节点内容
   * @param {Text} textNode 文本节点
   * @param {RegExp|string} reg 匹配要处理的内容
   * @param {function} fn 处理函数
   * @param {object} [options] 可选配置
   * @param {object} [options.context] 执行处理函数的上下文
   */
  scanner: function (textNode, reg, fn, options) {
    options = options || {};
    var content = textNode.nodeValue;
    var tempNode = document.createElement('div');
    var context = options.context || null;

    var cursor = 0, con = '';
    if (reg instanceof RegExp) {
      reg.lastIndex = 0;
    }

    content.replace(reg, function (m) {
      var index = content.indexOf(m, cursor);
      con += util.encodeHTML(content.substring(cursor, index));
      con += fn.apply(context, slice.call(arguments, 0));
      cursor = index + m.length;
    });
    con += util.encodeHTML(content.substring(cursor));

    tempNode.innerHTML = con;

    while (tempNode.firstChild) {
      textNode.parentNode.insertBefore(tempNode.firstChild, textNode);
    }

    textNode.parentNode.removeChild(textNode);
    tempNode = null;
  },

  /**
   * 遍历字符串，格式化特定字符
   * @param {string} content
   * @param {string|RegExp} reg
   * @param {function} handler
   * @param {object} [options]
   * @param {boolean} [options.encodeHTML]
   * @param {object} [options.context]
   * @return {*}
   */
  walkStringByTextNode: function (content, reg, handler, options) {
    if (!content) {
      return '';
    }

    if (!reg || !handler) {
      return content;
    }

    var df = document.createElement('div');
    var html;

    options = _.extend({ encodeHTML: true }, options);
    df.innerHTML = options.encodeHTML ? util.encodeHTML(content) : content;

    utils.walkTextNode(df, function (textNode) {
      utils.ensurescanner(textNode, reg, handler, {
        context: options.context
      });
    });

    html = df.innerHTML;
    df = null;

    return html;
  },

  /**
   * 给文本节点中的链接内容添加链接
   * @param {string} content
   * @param {object} [options]
   * @param {boolean} [options.encodeHTML]
   */
  addAnchor: function (content, options) {
    return utils.walkStringByTextNode(content, HTTP_REG, function (m) {
      var protocolReg = /^(https?|ftp)/i;
      var a = document.createElement('a');
      var con;

      a.setAttribute('rel', 'external');
      a.setAttribute('href', (protocolReg.test(m) ? '' : 'http://') + m);
      a.setAttribute('target', '_blank');
      a.textContent = m;

      con = a.outerHTML;
      a = null;
      return con;
    }, {
        encodeHTML: options ? options.encodeHTML !== false : true
      });
  };

  /**
   * 给文本节点中符合条件的词语添加高亮
   * @param {string} content
   * @param {string} keywords
   * @param {object} [options]
   * @param {boolean} [options.encodeHTML]
   */
  highlight: function (content, keywords, options) {
    var arr = [];
    _.each(keywords.split(/\s+/), function (word) {
      if (word) {
        arr.push(word);
      }
    });

    if (arr.length) {
      arr = _.sortBy(arr, function (v) {
        return -v.length;
      });

      arr = _.map(arr, function (v) {
        return util.escapeRegExp(v);
      });

      return utils.walkStringByTextNode(content, new RegExp(arr.join('|'), 'gi'), function (m) {
        return '<span class="highlight-keyword">' + util.encodeHTML(m) + '</span>';
      }, {
          encodeHTML: options ? options.encodeHTML !== false : true
        });
    }

    return content;
  },

  mixin: function(...list) {
    if (typeof Object.assign != 'function') {
      Object.assign = function(target) {
        'use strict';
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source != null) {
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
        }
        return target;
      };
    }
    return function(target) {
      Object.assign(target.prototype, ...list)
    };
  }
};
