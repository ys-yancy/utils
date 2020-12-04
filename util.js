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
  
  // 是否为回文字符串
  isPalindrome: function (str) {
    str = str.replace(/\W/g, '').toLowerCase();
    return str === (str.split('').reverse().join(''));
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
  },
 _convertStringToUnicodeCodePoints: function (str) {
      var surrogate1st = 0,
          unicodeCodes = [],
          i = 0,
          l = str.length;

      for (; i < l; i++) {
          var utf16Code = str.charCodeAt(i);
          if (surrogate1st != 0) {
              if (utf16Code >= 0xDC00 && utf16Code <= 0xDFFF) {
                  var surrogate2nd = utf16Code,
                      unicodeCode = (surrogate1st - 0xD800) * (1 << 10) + (1 << 16) + (surrogate2nd - 0xDC00);
                  unicodeCodes.push(unicodeCode);
              }
              surrogate1st = 0;
          } else if (utf16Code >= 0xD800 && utf16Code <= 0xDBFF) {
              surrogate1st = utf16Code;
          } else {
              unicodeCodes.push(utf16Code);
          }
      }
      return unicodeCodes;
  },
  //编码转换
  _escapeToUtf32: function (str) {
      var escaped = [],
          excludeHex = ['fe0f', '20e3', '1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff'],
          unicodeCodes = util._convertStringToUnicodeCodePoints(str),
          i = 0,
          l = unicodeCodes.length,
          hex;

      for (; i < l; i++) {
          hex = unicodeCodes[i].toString(16);
          if (excludeHex.indexOf(hex) < 0) {
              escaped.push('0000'.substr(hex.length) + hex);
          }
      }
      return escaped.join('_');
  },
  /**
   * emoji表情
   */
  emoji: (function () {
      var // _reg = /\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]/g,
          _reg = /\u2049\uFE0F|\u2049|\u2122|\u2139\uFE0F|\u2139|\u2194\uFE0F|\u2194|\u2195\uFE0F|\u2195|\u2196\uFE0F|\u2196|\u2197\uFE0F|\u2197|\u2198\uFE0F|\u2198|\u2199\uFE0F|\u2199|\u2600\uFE0F|\u2600|\u2601\uFE0F|\u2601|\u2611\uFE0F|\u2611|\u2614\uFE0F|\u2614|\u2615\uFE0F|\u2615|\u2648\uFE0F|\u2648|\u2649\uFE0F|\u2649|\u2650\uFE0F|\u2650|\u2651\uFE0F|\u2651|\u2652\uFE0F|\u2652|\u2653\uFE0F|\u2653|\u2660\uFE0F|\u2660|\u2663\uFE0F|\u2663|\u2665\uFE0F|\u2665|\u2666\uFE0F|\u2666|\u2668\uFE0F|\u2668|\u2693\uFE0F|\u2693|\u2702\uFE0F|\u2702|\u2705|\u2708\uFE0F|\u2708|\u2709\uFE0F|\u2709|\u2712\uFE0F|\u2712|\u2714\uFE0F|\u2714|\u2716\uFE0F|\u2716|\u2728|\u2733\uFE0F|\u2733|\u2734\uFE0F|\u2734|\u2744\uFE0F|\u2744|\u2747\uFE0F|\u2747|\u2753|\u2754|\u2755|\u2757\uFE0F|\u2757|\u2764\uFE0F|\u2764|\u2795|\u2796|\u2797|\u2934\uFE0F|\u2934|\u2935\uFE0F|\u2935|\u3030|\u3297\uFE0F|\u3297|\u3299\uFE0F|\u3299|\u00A9|\u00AE|\u203C\uFE0F|\u203C|\u21A9\uFE0F|\u21A9|\u21AA\uFE0F|\u21AA|\u231A\uFE0F|\u231A|\u231B\uFE0F|\u231B|\u23E9|\u23EA|\u23EB|\u23EC|\u23F0|\u23F3|\u24C2\uFE0F|\u24C2|\u25AA\uFE0F|\u25AA|\u25AB\uFE0F|\u25AB|\u25B6\uFE0F|\u25B6|\u25C0\uFE0F|\u25C0|\u25FB\uFE0F|\u25FB|\u25FC\uFE0F|\u25FC|\u25FD\uFE0F|\u25FD|\u25FE\uFE0F|\u25FE|\u260E\uFE0F|\u260E|\u261D\uFE0F|\u261D|\u263A\uFE0F|\u263A|\u264A\uFE0F|\u264A|\u264B\uFE0F|\u264B|\u264C\uFE0F|\u264C|\u264D\uFE0F|\u264D|\u264E\uFE0F|\u264E|\u264F\uFE0F|\u264F|\u267B\uFE0F|\u267B|\u267F\uFE0F|\u267F|\u26A0\uFE0F|\u26A0|\u26A1\uFE0F|\u26A1|\u26AA\uFE0F|\u26AA|\u26AB\uFE0F|\u26AB|\u26BD\uFE0F|\u26BD|\u26BE\uFE0F|\u26BE|\u26C4\uFE0F|\u26C4|\u26C5\uFE0F|\u26C5|\u26CE|\u26D4\uFE0F|\u26D4|\u26EA\uFE0F|\u26EA|\u26F2\uFE0F|\u26F2|\u26F3\uFE0F|\u26F3|\u26F5\uFE0F|\u26F5|\u26FA\uFE0F|\u26FA|\u26FD\uFE0F|\u26FD|\u270A|\u270B|\u270C\uFE0F|\u270C|\u270F\uFE0F|\u270F|\u274C|\u274E|\u27A1\uFE0F|\u27A1|\u27B0|\u27BF|\u2B05\uFE0F|\u2B05|\u2B06\uFE0F|\u2B06|\u2B07\uFE0F|\u2B07|\u2B1B\uFE0F|\u2B1B|\u2B1C\uFE0F|\u2B1C|\u2B50\uFE0F|\u2B50|\u2B55\uFE0F|\u2B55|\u303D\uFE0F|\u303D|\uD83C\uDC04\uFE0F|\uD83C\uDC04|\uD83C\uDCCF|\uD83C\uDD70|\uD83C\uDD71|\uD83C\uDD7E|\uD83C\uDD7F\uFE0F|\uD83C\uDD7F|\uD83C\uDD8E|\uD83C\uDD91|\uD83C\uDD92|\uD83C\uDD93|\uD83C\uDD94|\uD83C\uDD95|\uD83C\uDD96|\uD83C\uDD97|\uD83C\uDD98|\uD83C\uDD99|\uD83C\uDD9A|\uD83C\uDE01|\uD83C\uDE02|\uD83C\uDE1A\uFE0F|\uD83C\uDE1A|\uD83C\uDE2F\uFE0F|\uD83C\uDE2F|\uD83C\uDE32|\uD83C\uDE33|\uD83C\uDE34|\uD83C\uDE35|\uD83C\uDE36|\uD83C\uDE37|\uD83C\uDE38|\uD83C\uDE39|\uD83C\uDE3A|\uD83C\uDE50|\uD83C\uDE51|\uD83C\uDF00|\uD83C\uDF01|\uD83C\uDF02|\uD83C\uDF03|\uD83C\uDF04|\uD83C\uDF05|\uD83C\uDF06|\uD83C\uDF07|\uD83C\uDF08|\uD83C\uDF09|\uD83C\uDF0A|\uD83C\uDF0B|\uD83C\uDF0C|\uD83C\uDF0D|\uD83C\uDF0E|\uD83C\uDF0F|\uD83C\uDF10|\uD83C\uDF11|\uD83C\uDF12|\uD83C\uDF13|\uD83C\uDF14|\uD83C\uDF15|\uD83C\uDF16|\uD83C\uDF17|\uD83C\uDF18|\uD83C\uDF19|\uD83C\uDF1A|\uD83C\uDF1B|\uD83C\uDF1C|\uD83C\uDF1D|\uD83C\uDF1E|\uD83C\uDF1F|\uD83C\uDF20|\uD83C\uDF30|\uD83C\uDF31|\uD83C\uDF32|\uD83C\uDF33|\uD83C\uDF34|\uD83C\uDF35|\uD83C\uDF37|\uD83C\uDF38|\uD83C\uDF39|\uD83C\uDF3A|\uD83C\uDF3B|\uD83C\uDF3C|\uD83C\uDF3D|\uD83C\uDF3E|\uD83C\uDF3F|\uD83C\uDF40|\uD83C\uDF41|\uD83C\uDF42|\uD83C\uDF43|\uD83C\uDF44|\uD83C\uDF45|\uD83C\uDF46|\uD83C\uDF47|\uD83C\uDF48|\uD83C\uDF49|\uD83C\uDF4A|\uD83C\uDF4B|\uD83C\uDF4C|\uD83C\uDF4D|\uD83C\uDF4E|\uD83C\uDF4F|\uD83C\uDF50|\uD83C\uDF51|\uD83C\uDF52|\uD83C\uDF53|\uD83C\uDF54|\uD83C\uDF55|\uD83C\uDF56|\uD83C\uDF57|\uD83C\uDF58|\uD83C\uDF59|\uD83C\uDF5A|\uD83C\uDF5B|\uD83C\uDF5C|\uD83C\uDF5D|\uD83C\uDF5E|\uD83C\uDF5F|\uD83C\uDF60|\uD83C\uDF61|\uD83C\uDF62|\uD83C\uDF63|\uD83C\uDF64|\uD83C\uDF65|\uD83C\uDF66|\uD83C\uDF67|\uD83C\uDF68|\uD83C\uDF69|\uD83C\uDF6A|\uD83C\uDF6B|\uD83C\uDF6C|\uD83C\uDF6D|\uD83C\uDF6E|\uD83C\uDF6F|\uD83C\uDF70|\uD83C\uDF71|\uD83C\uDF72|\uD83C\uDF73|\uD83C\uDF74|\uD83C\uDF75|\uD83C\uDF76|\uD83C\uDF77|\uD83C\uDF78|\uD83C\uDF79|\uD83C\uDF7A|\uD83C\uDF7B|\uD83C\uDF7C|\uD83C\uDF80|\uD83C\uDF81|\uD83C\uDF82|\uD83C\uDF83|\uD83C\uDF84|\uD83C\uDF85|\uD83C\uDF86|\uD83C\uDF87|\uD83C\uDF88|\uD83C\uDF89|\uD83C\uDF8A|\uD83C\uDF8B|\uD83C\uDF8C|\uD83C\uDF8D|\uD83C\uDF8E|\uD83C\uDF8F|\uD83C\uDF90|\uD83C\uDF91|\uD83C\uDF92|\uD83C\uDF93|\uD83C\uDFA0|\uD83C\uDFA1|\uD83C\uDFA2|\uD83C\uDFA3|\uD83C\uDFA4|\uD83C\uDFA5|\uD83C\uDFA6|\uD83C\uDFA7|\uD83C\uDFA8|\uD83C\uDFA9|\uD83C\uDFAA|\uD83C\uDFAB|\uD83C\uDFAC|\uD83C\uDFAD|\uD83C\uDFAE|\uD83C\uDFAF|\uD83C\uDFB0|\uD83C\uDFB1|\uD83C\uDFB2|\uD83C\uDFB3|\uD83C\uDFB4|\uD83C\uDFB5|\uD83C\uDFB6|\uD83C\uDFB7|\uD83C\uDFB8|\uD83C\uDFB9|\uD83C\uDFBA|\uD83C\uDFBB|\uD83C\uDFBC|\uD83C\uDFBD|\uD83C\uDFBE|\uD83C\uDFBF|\uD83C\uDFC0|\uD83C\uDFC1|\uD83C\uDFC2|\uD83C\uDFC3|\uD83C\uDFC4|\uD83C\uDFC6|\uD83C\uDFC7|\uD83C\uDFC8|\uD83C\uDFC9|\uD83C\uDFCA|\uD83C\uDFE0|\uD83C\uDFE1|\uD83C\uDFE2|\uD83C\uDFE3|\uD83C\uDFE4|\uD83C\uDFE5|\uD83C\uDFE6|\uD83C\uDFE7|\uD83C\uDFE8|\uD83C\uDFE9|\uD83C\uDFEA|\uD83C\uDFEB|\uD83C\uDFEC|\uD83C\uDFED|\uD83C\uDFEE|\uD83C\uDFEF|\uD83C\uDFF0|\uD83D\uDC00|\uD83D\uDC01|\uD83D\uDC02|\uD83D\uDC03|\uD83D\uDC04|\uD83D\uDC05|\uD83D\uDC06|\uD83D\uDC07|\uD83D\uDC08|\uD83D\uDC09|\uD83D\uDC0A|\uD83D\uDC0B|\uD83D\uDC0C|\uD83D\uDC0D|\uD83D\uDC0E|\uD83D\uDC0F|\uD83D\uDC10|\uD83D\uDC11|\uD83D\uDC12|\uD83D\uDC13|\uD83D\uDC14|\uD83D\uDC15|\uD83D\uDC16|\uD83D\uDC17|\uD83D\uDC18|\uD83D\uDC19|\uD83D\uDC1A|\uD83D\uDC1B|\uD83D\uDC1C|\uD83D\uDC1D|\uD83D\uDC1E|\uD83D\uDC1F|\uD83D\uDC20|\uD83D\uDC21|\uD83D\uDC22|\uD83D\uDC23|\uD83D\uDC24|\uD83D\uDC25|\uD83D\uDC26|\uD83D\uDC27|\uD83D\uDC28|\uD83D\uDC29|\uD83D\uDC2A|\uD83D\uDC2B|\uD83D\uDC2C|\uD83D\uDC2D|\uD83D\uDC2E|\uD83D\uDC2F|\uD83D\uDC30|\uD83D\uDC31|\uD83D\uDC32|\uD83D\uDC33|\uD83D\uDC34|\uD83D\uDC35|\uD83D\uDC36|\uD83D\uDC37|\uD83D\uDC38|\uD83D\uDC39|\uD83D\uDC3A|\uD83D\uDC3B|\uD83D\uDC3C|\uD83D\uDC3D|\uD83D\uDC3E|\uD83D\uDC40|\uD83D\uDC42|\uD83D\uDC43|\uD83D\uDC44|\uD83D\uDC45|\uD83D\uDC46|\uD83D\uDC47|\uD83D\uDC48|\uD83D\uDC49|\uD83D\uDC4A|\uD83D\uDC4B|\uD83D\uDC4C|\uD83D\uDC4D|\uD83D\uDC4E|\uD83D\uDC4F|\uD83D\uDC50|\uD83D\uDC51|\uD83D\uDC52|\uD83D\uDC53|\uD83D\uDC54|\uD83D\uDC55|\uD83D\uDC56|\uD83D\uDC57|\uD83D\uDC58|\uD83D\uDC59|\uD83D\uDC5A|\uD83D\uDC5B|\uD83D\uDC5C|\uD83D\uDC5D|\uD83D\uDC5E|\uD83D\uDC5F|\uD83D\uDC60|\uD83D\uDC61|\uD83D\uDC62|\uD83D\uDC63|\uD83D\uDC64|\uD83D\uDC65|\uD83D\uDC66|\uD83D\uDC67|\uD83D\uDC68|\uD83D\uDC69|\uD83D\uDC6A|\uD83D\uDC6B|\uD83D\uDC6C|\uD83D\uDC6D|\uD83D\uDC6E|\uD83D\uDC6F|\uD83D\uDC70|\uD83D\uDC71|\uD83D\uDC72|\uD83D\uDC73|\uD83D\uDC74|\uD83D\uDC75|\uD83D\uDC76|\uD83D\uDC77|\uD83D\uDC78|\uD83D\uDC79|\uD83D\uDC7A|\uD83D\uDC7B|\uD83D\uDC7C|\uD83D\uDC7D|\uD83D\uDC7E|\uD83D\uDC7F|\uD83D\uDC80|\uD83D\uDC81|\uD83D\uDC82|\uD83D\uDC83|\uD83D\uDC84|\uD83D\uDC85|\uD83D\uDC86|\uD83D\uDC87|\uD83D\uDC88|\uD83D\uDC89|\uD83D\uDC8A|\uD83D\uDC8B|\uD83D\uDC8C|\uD83D\uDC8D|\uD83D\uDC8E|\uD83D\uDC8F|\uD83D\uDC90|\uD83D\uDC91|\uD83D\uDC92|\uD83D\uDC93|\uD83D\uDC94|\uD83D\uDC95|\uD83D\uDC96|\uD83D\uDC97|\uD83D\uDC98|\uD83D\uDC99|\uD83D\uDC9A|\uD83D\uDC9B|\uD83D\uDC9C|\uD83D\uDC9D|\uD83D\uDC9E|\uD83D\uDC9F|\uD83D\uDCA0|\uD83D\uDCA1|\uD83D\uDCA2|\uD83D\uDCA3|\uD83D\uDCA4|\uD83D\uDCA5|\uD83D\uDCA6|\uD83D\uDCA7|\uD83D\uDCA8|\uD83D\uDCA9|\uD83D\uDCAA|\uD83D\uDCAB|\uD83D\uDCAC|\uD83D\uDCAD|\uD83D\uDCAE|\uD83D\uDCAF|\uD83D\uDCB0|\uD83D\uDCB1|\uD83D\uDCB2|\uD83D\uDCB3|\uD83D\uDCB4|\uD83D\uDCB5|\uD83D\uDCB6|\uD83D\uDCB7|\uD83D\uDCB8|\uD83D\uDCB9|\uD83D\uDCBA|\uD83D\uDCBB|\uD83D\uDCBC|\uD83D\uDCBD|\uD83D\uDCBE|\uD83D\uDCBF|\uD83D\uDCC0|\uD83D\uDCC1|\uD83D\uDCC2|\uD83D\uDCC3|\uD83D\uDCC4|\uD83D\uDCC5|\uD83D\uDCC6|\uD83D\uDCC7|\uD83D\uDCC8|\uD83D\uDCC9|\uD83D\uDCCA|\uD83D\uDCCB|\uD83D\uDCCC|\uD83D\uDCCD|\uD83D\uDCCE|\uD83D\uDCCF|\uD83D\uDCD0|\uD83D\uDCD1|\uD83D\uDCD2|\uD83D\uDCD3|\uD83D\uDCD4|\uD83D\uDCD5|\uD83D\uDCD6|\uD83D\uDCD7|\uD83D\uDCD8|\uD83D\uDCD9|\uD83D\uDCDA|\uD83D\uDCDB|\uD83D\uDCDC|\uD83D\uDCDD|\uD83D\uDCDE|\uD83D\uDCDF|\uD83D\uDCE0|\uD83D\uDCE1|\uD83D\uDCE2|\uD83D\uDCE3|\uD83D\uDCE4|\uD83D\uDCE5|\uD83D\uDCE6|\uD83D\uDCE7|\uD83D\uDCE8|\uD83D\uDCE9|\uD83D\uDCEA|\uD83D\uDCEB|\uD83D\uDCEC|\uD83D\uDCED|\uD83D\uDCEE|\uD83D\uDCEF|\uD83D\uDCF0|\uD83D\uDCF1|\uD83D\uDCF2|\uD83D\uDCF3|\uD83D\uDCF4|\uD83D\uDCF5|\uD83D\uDCF6|\uD83D\uDCF7|\uD83D\uDCF9|\uD83D\uDCFA|\uD83D\uDCFB|\uD83D\uDCFC|\uD83D\uDD00|\uD83D\uDD01|\uD83D\uDD02|\uD83D\uDD03|\uD83D\uDD04|\uD83D\uDD05|\uD83D\uDD06|\uD83D\uDD07|\uD83D\uDD08|\uD83D\uDD09|\uD83D\uDD0A|\uD83D\uDD0B|\uD83D\uDD0C|\uD83D\uDD0D|\uD83D\uDD0E|\uD83D\uDD0F|\uD83D\uDD10|\uD83D\uDD11|\uD83D\uDD12|\uD83D\uDD13|\uD83D\uDD14|\uD83D\uDD15|\uD83D\uDD16|\uD83D\uDD17|\uD83D\uDD18|\uD83D\uDD19|\uD83D\uDD1A|\uD83D\uDD1B|\uD83D\uDD1C|\uD83D\uDD1D|\uD83D\uDD1E|\uD83D\uDD1F|\uD83D\uDD20|\uD83D\uDD21|\uD83D\uDD22|\uD83D\uDD23|\uD83D\uDD24|\uD83D\uDD25|\uD83D\uDD26|\uD83D\uDD27|\uD83D\uDD28|\uD83D\uDD29|\uD83D\uDD2A|\uD83D\uDD2B|\uD83D\uDD2C|\uD83D\uDD2D|\uD83D\uDD2E|\uD83D\uDD2F|\uD83D\uDD30|\uD83D\uDD31|\uD83D\uDD32|\uD83D\uDD33|\uD83D\uDD34|\uD83D\uDD35|\uD83D\uDD36|\uD83D\uDD37|\uD83D\uDD38|\uD83D\uDD39|\uD83D\uDD3A|\uD83D\uDD3B|\uD83D\uDD3C|\uD83D\uDD3D|\uD83D\uDD50|\uD83D\uDD51|\uD83D\uDD52|\uD83D\uDD53|\uD83D\uDD54|\uD83D\uDD55|\uD83D\uDD56|\uD83D\uDD57|\uD83D\uDD58|\uD83D\uDD59|\uD83D\uDD5A|\uD83D\uDD5B|\uD83D\uDD5C|\uD83D\uDD5D|\uD83D\uDD5E|\uD83D\uDD5F|\uD83D\uDD60|\uD83D\uDD61|\uD83D\uDD62|\uD83D\uDD63|\uD83D\uDD64|\uD83D\uDD65|\uD83D\uDD66|\uD83D\uDD67|\uD83D\uDDFB|\uD83D\uDDFC|\uD83D\uDDFD|\uD83D\uDDFE|\uD83D\uDDFF|\uD83D\uDE00|\uD83D\uDE01|\uD83D\uDE02|\uD83D\uDE03|\uD83D\uDE04|\uD83D\uDE05|\uD83D\uDE06|\uD83D\uDE07|\uD83D\uDE08|\uD83D\uDE09|\uD83D\uDE0A|\uD83D\uDE0B|\uD83D\uDE0C|\uD83D\uDE0D|\uD83D\uDE0E|\uD83D\uDE0F|\uD83D\uDE10|\uD83D\uDE11|\uD83D\uDE12|\uD83D\uDE13|\uD83D\uDE14|\uD83D\uDE15|\uD83D\uDE16|\uD83D\uDE17|\uD83D\uDE18|\uD83D\uDE19|\uD83D\uDE1A|\uD83D\uDE1B|\uD83D\uDE1C|\uD83D\uDE1D|\uD83D\uDE1E|\uD83D\uDE1F|\uD83D\uDE20|\uD83D\uDE21|\uD83D\uDE22|\uD83D\uDE23|\uD83D\uDE24|\uD83D\uDE25|\uD83D\uDE26|\uD83D\uDE27|\uD83D\uDE28|\uD83D\uDE29|\uD83D\uDE2A|\uD83D\uDE2B|\uD83D\uDE2C|\uD83D\uDE2D|\uD83D\uDE2E|\uD83D\uDE2F|\uD83D\uDE30|\uD83D\uDE31|\uD83D\uDE32|\uD83D\uDE33|\uD83D\uDE34|\uD83D\uDE35|\uD83D\uDE36|\uD83D\uDE37|\uD83D\uDE38|\uD83D\uDE39|\uD83D\uDE3A|\uD83D\uDE3B|\uD83D\uDE3C|\uD83D\uDE3D|\uD83D\uDE3E|\uD83D\uDE3F|\uD83D\uDE40|\uD83D\uDE45|\uD83D\uDE46|\uD83D\uDE47|\uD83D\uDE48|\uD83D\uDE49|\uD83D\uDE4A|\uD83D\uDE4B|\uD83D\uDE4C|\uD83D\uDE4D|\uD83D\uDE4E|\uD83D\uDE4F|\uD83D\uDE80|\uD83D\uDE81|\uD83D\uDE82|\uD83D\uDE83|\uD83D\uDE84|\uD83D\uDE85|\uD83D\uDE86|\uD83D\uDE87|\uD83D\uDE88|\uD83D\uDE89|\uD83D\uDE8A|\uD83D\uDE8B|\uD83D\uDE8C|\uD83D\uDE8D|\uD83D\uDE8E|\uD83D\uDE8F|\uD83D\uDE90|\uD83D\uDE91|\uD83D\uDE92|\uD83D\uDE93|\uD83D\uDE94|\uD83D\uDE95|\uD83D\uDE96|\uD83D\uDE97|\uD83D\uDE98|\uD83D\uDE99|\uD83D\uDE9A|\uD83D\uDE9B|\uD83D\uDE9C|\uD83D\uDE9D|\uD83D\uDE9E|\uD83D\uDE9F|\uD83D\uDEA0|\uD83D\uDEA1|\uD83D\uDEA2|\uD83D\uDEA3|\uD83D\uDEA4|\uD83D\uDEA5|\uD83D\uDEA6|\uD83D\uDEA7|\uD83D\uDEA8|\uD83D\uDEA9|\uD83D\uDEAA|\uD83D\uDEAB|\uD83D\uDEAC|\uD83D\uDEAD|\uD83D\uDEAE|\uD83D\uDEAF|\uD83D\uDEB0|\uD83D\uDEB1|\uD83D\uDEB2|\uD83D\uDEB3|\uD83D\uDEB4|\uD83D\uDEB5|\uD83D\uDEB6|\uD83D\uDEB7|\uD83D\uDEB8|\uD83D\uDEB9|\uD83D\uDEBA|\uD83D\uDEBB|\uD83D\uDEBC|\uD83D\uDEBD|\uD83D\uDEBE|\uD83D\uDEBF|\uD83D\uDEC0|\uD83D\uDEC1|\uD83D\uDEC2|\uD83D\uDEC3|\uD83D\uDEC4|\uD83D\uDEC5|\uD83C\uDDE8\uD83C\uDDF3|\uD83C\uDDE9\uD83C\uDDEA|\uD83C\uDDEA\uD83C\uDDF8|\uD83C\uDDEB\uD83C\uDDF7|\uD83C\uDDEC\uD83C\uDDE7|\uD83C\uDDEE\uD83C\uDDF9|\uD83C\uDDEF\uD83C\uDDF5|\uD83C\uDDF0\uD83C\uDDF7|\uD83C\uDDF7\uD83C\uDDFA|\uD83C\uDDFA\uD83C\uDDF8|\u0023\uFE0F\u20E3|\u0023\u20E3|\u0030\uFE0F\u20E3|\u0030\u20E3|\u0031\uFE0F\u20E3|\u0031\u20E3|\u0032\uFE0F\u20E3|\u0032\u20E3|\u0033\uFE0F\u20E3|\u0033\u20E3|\u0034\uFE0F\u20E3|\u0034\u20E3|\u0035\uFE0F\u20E3|\u0035\u20E3|\u0036\uFE0F\u20E3|\u0036\u20E3|\u0037\uFE0F\u20E3|\u0037\u20E3|\u0038\uFE0F\u20E3|\u0038\u20E3|\u0039\uFE0F\u20E3|\u0039\u20E3/g,
          _default = {
              encodeHTML: false,
              path: FS.QX_MODULE.EMOJI_EXPRESSION_PATH,
              imgPrefix: 'emoji_',
              imgExtension: '.png'
          };
      return function (text, opt) {
          if (!text) {
              return '';
          }
          util.isSupportWebp() && (_default.imgExtension = '.webp');
          opt = _.extend({}, _default, opt);

          if (opt.encodeHTML) {
              text = util.encodeHTML(text);
          }
          return text.replace(/\uD83C\uDFFB|\uD83C\uDFFC|\uD83C\uDFFD|\uD83C\uDFFE|\uD83C\uDFFF/, '').replace(_reg, function (v) {
              return '<img class="emoji" alt="' + v + '" src="' + opt.path + opt.imgPrefix + util._escapeToUtf32(v) + opt.imgExtension + '" />';
          })
      }
  })(),
  /**
   * 获取高亮
   */
  getHighlight: function (string, keyword, callback) {
      var str = string || '';
      return str.split(keyword).map(function (value, index) {
          var content = callback ? callback(value, index) : value;

          return util.encodeHTML(content || value);
      }).join('<span class="highlight">' + util.encodeHTML(keyword) + '</span>');
  },
  /**
   * 获取饼干表情id
   */
  getEmojiCookieId: (function () {
      var cookieMap = {};
      _.each(cookieItems, function (item) {
          cookieMap[item.name] = item;
      });
      return function (name) {
          return cookieMap[name].id;
      }
  })(),
  /**
   * 获取匹配到名称的饼干脸的文本regex的字符串
   * eg:
   *     笑哭 -> \[笑哭了\]
   *     笑 ->  \[笑哭了\]|\[微笑\]
   */
  filterEmojiCookieRegexString: function(partialName, capture) {
      var filterdItems = partialName ?  _.filter(cookieItems, function (item) {
          return item.name.indexOf(partialName) > -1;
      }) : cookieItems;

      if (!filterdItems.length) {
          return null;
      }

      var s = _.map(filterdItems, function (item) {
          return '\\[' + item.name + '\\]';
      }).join('|');

      return capture ? '(' + s + ')' : s;
  },
  /**
   * emoji表情
   */
  emojiCookie: (function () {
      var _default = {
              encodeHTML: false,
              path: FS.QX_MODULE.COOKIE_EXPRESSION_PATH,
              imgPrefix: 'fs_',
              imgExtension: '.png'
          },
          reg = new RegExp(_.map(cookieItems, function (item) {
              return '\\[' + item.name + '\\]';
          }).join('|'), 'gm');

      return function (text, opt) {
          if (!text) {
              return '';
          }
          if(util.isSupportWebp()) {
              _default.imgExtension = '.webp';
          }
          opt = _.extend({}, _default, opt);

          if (opt.encodeHTML) {
              text = util.encodeHTML(text);
          }
          return text.replace(reg, function (v) {
              var t = v.substring(1, v.length - 1),
                  id = util.getEmojiCookieId(t);
              return id ? ['<img class="emoji-cookie" alt="', v, '" src="', opt.path, opt.imgPrefix, id, opt.imgExtension, '" />'].join('') : ['<img class="emoji-cookie" src="', FS.BLANK_IMG, '" />'].join('');
          })
      }
  })(),

  /**
   * 同时转换emoji和emojicookie
   * 无opt参数，即opt均采用默认
   */
  emojiAll: function (text, encodeHTML) {
      if (!text) {
          return '';
      }
      if (encodeHTML) {
          text = util.encodeHTML(text);
      }
      return util.emojiCookie(util.emoji(text));
  },
  /**
   * 根据url query生成对应json
   * @param query
   * @returns {{}}
   */
  queryToJson: function (query) {
      var result = {},
          pairs = query.split('&');

      for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i];
          if (pair) {
              var index = pair.indexOf('=');
              if (index > -1) {
                  result[pair.substring(0, index)] = decodeURIComponent(pair.substring(index + 1));
              }
              else {
                  result[pair] = '';
              }
          }
      }

      return result;
  },
  /**
   * 根据json生成query
   */
  jsonToQuery: function (c, e) {
      var a = [],
          d,
          b = e || function (f) {
              return $.url.escapeSymbol(f)
          };
      $.each(c, function (f, g) {
          if ($.isArray(g)) {
              d = g.length;
              while (d--) {
                  a.push(f + "=" + encodeURIComponent(g[d]))
              }
          } else {
              a.push(f + "=" + encodeURIComponent(g))
          }
      });
      return a.join("&")
  },

  getLocalSize: function() {
    return Promise((resolve) => {
      var test = '0123456789';
      var add = function(num) {
          num += num;
          if(num.length == 10240) {
            test = num;
            return;
          }
          add(num);
      }
      add(test);
      var sum = test;
      var show = setInterval(function(){
        sum += test;
        try {
            window.localStorage.removeItem('test');
            window.localStorage.setItem('test', sum);
        } catch(e) {
          resolve(sum.length / 1024);
          clearInterval(show);
        }
      }, 1);
    });
  },
  rect(el) {
      return el.getBoundingClientRect();
  },

  check(r0, r1) {
      return !(r1.top >= r0.bottom - bufferHeight || r1.bottom <= r0.top);
  },

  checkInView(container = document.body) {
      if (this.check(this.rect(container), this.rect(this.$el))) {
          this.load = true;
      }
  }
};
