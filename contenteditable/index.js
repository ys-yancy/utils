// 不可用
'use strict'
var util = require('../util');
var TreeWalker = require('../TreeWalker');

var isMac = util.isMac();

var BROWSER = (function () {
    var Sys = {};
    var ua = navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
        (s = ua.match(/trident([\s\S].)/)) ? Sys.ie = s[1] :
            (s = ua.match(/edge([\s\S].)/)) ? Sys.ie = s[1] :
                (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
                    (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
                        (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                            (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
    Sys.fillChar = (Sys.chrome || Sys.safari) ? '<br />' : '&#8203;';
    return Sys;
} ());

var dtd = (function () {
    function _(s) {
        for (var k in s) {
            s[k.toUpperCase()] = s[k];
        }
        return s;
    }

    return _({
        $inline: _({ b: 1, big: 1, i: 1, small: 1, tt: 1, abbr: 1, acronym: 1, cite: 1, code: 1, dfn: 1, em: 1, kbd: 1, strong: 1, samp: 1, a: 1, bdo: 1, br: 1, img: 1, map: 1, object: 1, q: 1, script: 1, span: 1, sub: 1, sup: 1, button: 1, input: 1, label: 1, select: 1, textarea: 1 }),
        $empty: _({ area: 1, base: 1, basefont: 1, br: 1, col: 1, command: 1, dialog: 1, embed: 1, hr: 1, img: 1, input: 1, isindex: 1, keygen: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 }),
        $block: _({ address: 1, blockquote: 1, center: 1, dir: 1, div: 1, dl: 1, fieldset: 1, form: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, hr: 1, isindex: 1, menu: 1, noframes: 1, ol: 1, p: 1, pre: 1, table: 1, ul: 1 })
    });
} ());

function getPlainTxt(node) {
    var isStartOfLine = true;
    var text = '';
    var appendText = function appendText(childNodes) {
        for (var index = 0; index < childNodes.length; index++) {
            var _node = childNodes[index];
            if (_node.nodeType === 3) {
                // text node
                text += _node.textContent;
                isStartOfLine = false;
                continue;
            }
            if (_node.tagName === 'IMG') {
                text += _node.outerHTML;
                isStartOfLine = false;
                continue;
            }
            if (_node.tagName === 'BR') {
                text += '\n';
                isStartOfLine = true;
                continue;
            }
            if (dtd.$inline[_node.tagName]) {
                appendText(_node.childNodes);
                continue;
            }
            if (!isStartOfLine) {
                text += '\n';
                isStartOfLine = true;
            }
            appendText(_node.childNodes);
            if (!isStartOfLine) {
                text += '\n';
                isStartOfLine = true;
            }
        }
    };
    appendText(node.childNodes);
    if (text.length && text.charAt(text.length - 1) === '\n') {
        text = text.substring(0, text.length - 1);
    }
    return text;
}

function isWordDocument(str) {
    return /(class="?Mso|style="[^"]*\bmso\-|w:WordDocument|<(v|o):|lang=)/ig.test(str);
}

function replaceEmojiAlt(text) {
    return text.replace(/<img [^>]*class=['"][^'"]+[^>]* *alt=['"]([^'"]+)[^>]*>/gi, function (match, capture) {
        return capture;
    });
}

var ContentEditable = function (node) {
    this.init(node);
};
/**
 * 初始化
 */
ContentEditable.prototype.init = function (node) {
    var me = this;
    me.$node = node;
    me.node = node.get(0);
    me.enable();
    me.bindEvent();

    var range = document.createRange();
    range.setStartAfter(me.$node.children().last().get(0));
    me.range = range;

    // 加一个过滤条件,满足任意一条blur时不清除range
    // eg.使用atwho插件@时使用鼠标点击会触发blur,但是此时需要保留焦点
    me.conditionsKeepsRange = [];
};
/**
 * 设置contenteditable属性
 */
ContentEditable.prototype.enable = function () {
    var me = this;
    me.$node.attr({
        contenteditable: 'true',
        spellcheck: 'false'
    });
};

/**
 * 禁用contenteditable属性
 */
ContentEditable.prototype.disable = function () {
    var me = this;
    me.$node.attr({
        contenteditable: 'false'
    }).html('<p><br /></p>');
};

ContentEditable.prototype.getRange = function () {
    var sel, range;
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
        range = sel.getRangeAt(0);
        return range;
    }
    return false;
}

ContentEditable.prototype.addConditionKeepsRange = function (condition) {
    this.conditionsKeepsRange = this.conditionsKeepsRange.concat(condition);
};

ContentEditable.prototype.setRange = function () {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(this.range);
};

ContentEditable.prototype.resetRange = function () {
    var range = this.getRange();
    if (range) {
        this.range = range;
    }
};
/**
 * 绑定事件
 */
ContentEditable.prototype.bindEvent = function () {
    var me = this;
    var editableFix;
    this.$node.on('blur', function () {
        var shouldResetRange = !_.some(me.conditionsKeepsRange, function (condition) {
            return condition();
        });
        if (shouldResetRange) {
            // blur时存一次range
            me.resetRange();
            // chrome的bug让contenteditable没法正确失去焦点,创建一个input转移焦点
            if (!editableFix) {
                editableFix = $('<input style="width:1px;height:1px;border:none;margin:0;padding:0;" tabIndex="-1">').appendTo(FS.QX_MODULE.APP_CONTAINER);
            }
            editableFix.focus();
            editableFix[0].setSelectionRange(0, 0);
            editableFix.blur();
        }
    }).on('cut copy', function (e) {
        me.setRange();
    }).on('paste', function (event) {
        if (window.clipboardData) {
            // for ie
            var plainText = window.clipboardData.getData('Text');
            var clipboardData = window.clipboardData;

            if (!!plainText) {
                setTimeout(function () {
                    me.appendText(plainText.replace(/(\r\n|\r)/g, '\n'));
                }, 0);
                event.preventDefault();
                return false;
            }
            me.$node.trigger('pasteInFFOrIE');
        }
        else if (event.clipboardData || event.originalEvent) {
            // not ie
            var clipboardData = (event.clipboardData || event.originalEvent.clipboardData);
            if (clipboardData.items) {
                // chrome
                var items = clipboardData.items;
                var isRtf = false;
                for (var _i = 0, _len = items.length; _i < _len; _i++) {
                    var item = items[_i];
                    if (item && /rtf/.test(item.type)) {
                        isRtf = true;
                        continue;
                    }
                    if (item && item.type.match(/^image\//)) {
                        // mac环境下rtf不处理成图片
                        if (isMac && isRtf) {
                            continue;
                        }
                        me.$node.trigger('pasteImage', item.getAsFile());
                        return false;
                    }
                }

                var html = clipboardData.getData('text/html').replace(/\r|\n/gi, '');
                // chrome 42不能显示\t，加一步转换成4空格
                var plainText = clipboardData.getData('text/plain').replace(/\t/g, '    ');
                plainText = plainText.replace(/(\r\n|\r)/g, '\n');

                if (/inner-img/.test(html)) {
                    var $node = $('<div>').append($.parseHTML(html));
                    _.each(me.getContent($node), function (msg, index) {
                        if (typeof msg === 'object') {
                            var info = msg, url = info.fileInfo.dataURL, uuid, src;
                            if (url.match(/^data\:([^\;]+)\;base64\,(.+)$/)) {
                                src = url;
                                uuid = info.fileInfo.fileid.replace('paste', '');
                            } else {
                                src = FS.BASE_PATH + '/FSC/EM/File/GetByPath?path=' + url + '.jpg';
                                uuid = qxUtil.uuid();
                            }
                            me.appendImg(src, uuid, info);
                        } else {
                            me.appendText(msg);
                        }
                    });
                } else {
                    setTimeout(function () {
                        me.appendText(plainText);
                    }, 0);
                }
                event.preventDefault();
            } else {
                // for firefox
                var plainText = clipboardData.getData('text/plain').replace(/(\r\n|\r)/g, '\n');

                if (!!plainText) {
                    setTimeout(function () {
                        me.appendText(plainText);
                    }, 0);
                    event.preventDefault();
                    return false;
                }
                if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
                    event.preventDefault();
                    return false;
                }
                me.$node.trigger('pasteInFFOrIE');
            }
        }
    });
};
/**
 * 新加一行空行
 */
ContentEditable.prototype.appendNewLine = function () {
    var me = this;
    me.$node.focus();
    me.setRange();
    var range = me.range;
    var $currentEnd = $(me.range.endContainer);
    if ($currentEnd.get(0).nodeType === 3) {
        $currentEnd = $currentEnd.parent();
    }
    if ($currentEnd.hasClass('atwho-query')) {
        var text = document.createTextNode($currentEnd.text());
        $currentEnd.remove();
        me.appendNodeAtRange(range, text)
    }
    setTimeout(function () {
        if (!BROWSER.ie) {
            document.execCommand('insertText', false, '\n');
        } else {
            me.appendNodeAtRange(me.range, document.createTextNode('\n'));
        }
        me.resetRange();
        me.setRange();
        me.scrollToView();
    }, 10);
};
/**
 *
 * 在光标后添加img
 * @param src 图片url
 * @param options
 * @param options.id
 */
ContentEditable.prototype.appendImg = function (src, options) {
    var me = this;
    options = options || {};
    if (!options.id) {
        options.id = util.uuid();
    }
    me.appendHtml('<img class="inner-img loading" id="' + options.id + '" src="' + FS.BLANK_IMG + '" draggable="false" />');

    var $img = me.$node.find('#' + options.id);
    if (src == FS.BLANK_IMG) {
        me.scrollToView();
    }
    else {
        util.setImgSrc($img, src).then(function () {
            me.scrollToView();
        });
    }

    return $img;
};
/**
 * 在光标后添加文字
 * @param text,文本信息
 */
ContentEditable.prototype.appendText = function (text) {
    var me = this;
    text = text.replace(/[\u200B\r]/g, '');

    if (text === '') {
        return;
    }

    try {
        var selection = window.getSelection();
        selection.removeAllRanges();
    }
    catch (e){
        console.error(e);
    }

    me.$node.focus();
    me.setRange();

    var html = text.split('\n').map(function (value) {
        return util.emojiCookie(util.emoji(util.encodeHTML(value)));
    }).join('<br />');
    if (!BROWSER.ie) {
        document.execCommand('insertHtml', false, html);
    } else {
        me.appendNodeAtRange(me.range, document.createTextNode(text));
    }
    me.resetRange();
    me.setRange();
    me.scrollToView();
};
/**
 * 在光标后添加表情
 * @param alt
 */
ContentEditable.prototype.appendEmoji = function (alt) {
    var me = this;
    me.appendHtml(util.emojiCookie(util.emoji(alt)));
};
/**
 * 在光标后添加html
 * @param html,元素html
 */
ContentEditable.prototype.appendHtml = function (html) {
    var me = this;
    me.$node.focus();
    me.setRange();
    if (!BROWSER.ie) {
        document.execCommand('insertHtml', false, html);
    } else {
        me.$node.focus();
        me.appendNodeAtRange(me.range, $(html).get(0));
    }
    me.resetRange();
    me.setRange();
    me.scrollToView();
};
/**
 * 在指定位置添加节点
 * @param range
 * @param node
 */
ContentEditable.prototype.appendNodeAtRange = function (range, node) {
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    range.collapse(true)
    this.range = range;
    this.setRange();
};
/**
 * 滚动到当前range开始的位置
 * @method scrollToView
 */
ContentEditable.prototype.scrollToView = function () {
    var me = this;
    var range = me.range;
    var $span = $('<span>&nbsp;</span>');
    var span = $span.get(0);
    range.cloneRange().insertNode(span);
    // 计算需要滚动的高度
    var scrollTop = span.offsetTop +
        span.offsetHeight -
        me.$node.height();
    me.$node.parent().scrollTop(scrollTop);
    $span.remove();
};
/**
 * 将光标移到元素最后
 */
ContentEditable.prototype.setCursorPositionEnd = function () {
    var selector = this.$node;
    // 取文本节点的最后一项
    while (selector.contents().length) {
        selector = selector.contents().last()
    }
    var range;
    range = document.createRange();
    range.setStartAfter(selector.get(0));
    range.setEndAfter(selector.get(0));
    range.collapse(false);
    this.range = range;
    this.setRange();
};

ContentEditable.prototype.isEmpty = function (node) {
    var me = this, type, walker, name, brCount = 0;
    node = node || me.node;

    node = node.firstChild;
    if (node) {
        walker = new TreeWalker(node, node.parentNode);
        do {
            type = node.nodeType;

            if (type === 1) {

                // Keep empty elements like <img />
                name = node.nodeName.toLowerCase();
                if (dtd.$empty[name]) {
                    // Ignore single BR elements in blocks like <p><br /></p> or <p><span><br /></span></p>
                    if (name === 'br') {
                        brCount++;
                        continue;
                    }

                    return false;
                }
            }
            // Keep text nodes unless it is empty
            if ((type === 3 && node.nodeValue.replace(String.fromCharCode(8203), ''))) {
                return false;
            }
        } while ((node = walker.next()));
    }

    return brCount <= 1;
};
/**
 * 获取dom结果，图片节点返回对象，文本节点返回文本
 */
ContentEditable.prototype.getContent = function ($node, noBase64) {
    var result = [];

    var $innerImgs = $node.find('.inner-img');

    var plainTxt = replaceEmojiAlt(getPlainTxt($node.get(0))).replace(/(\u200B|\u200D)/g, '');
    plainTxt = plainTxt.split(/<img.*?class="inner-img.*?".*?(?:id="\d{13}")?.*?(?:>|[\/]*>)/gi);

    var imgLength = $innerImgs.length;
    var textLength = plainTxt.length;
    var length = Math.max(imgLength, textLength);

    plainTxt[textLength - 1] = _.string.rtrim(plainTxt[textLength - 1])

    for (var i = 0; i < length; i++) {
        if (i < textLength) {
            result.push(plainTxt[i]);
        }
        if (i < imgLength) {
            try {
                var $img = $($innerImgs.get(i));
                var info = JSON.parse($img.attr('data-info'));
                if (noBase64 && $img.attr('src').match(/^data\:([^\;]+)\;base64\,(.+)$/)) {
                    info.fileInfo.dataURL = $img.attr('id');
                }
                result.push(info);
            } catch (e) {
            }
        }
    }
    return result;
};
var isBlockNode = (function () {
    var blockTags = {}, blockStyles = {};
    _.each(['address', 'blockquote', 'center',
        'dir', 'div', 'dl', 'fieldset', 'form',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'isindex', 'menu', 'noframes',
        'ol', 'p', 'pre', 'table', 'ul', 'br'], function (k) {
       blockTags[k] = true;
    });
    _.each([
        '-webkit-box', '-moz-box', 'block' ,
        'list-item' , 'table' , 'table-row-group' ,
        'table-header-group', 'table-footer-group' ,
        'table-row' , 'table-column-group' , 'table-column' ,
        'table-cell' , 'table-caption'
    ], function (k) {
        blockStyles[k] = true;
    });
    return function (node) {
        return blockTags[node.tagName.toLowerCase()] || blockStyles[$(node).css('display')]
    }
})();
/**
 * 提取输入框的内容
 * @param node
 * @return {*}
 */
var getContentInfo = function (node) {
    if (node.nodeType == 3) {
        return [{
            type: 'text',
            value: node.nodeValue
        }];
    }
    else if (node.tagName.toLowerCase() == 'img') {
        var cls = node.getAttribute('class');
        var info;
        // 表情
        if (cls == 'emoji-cookie') {
            return [{
                type: 'text',
                value: node.getAttribute('alt')
            }];
        }

        // 通过文件选择的文件
        if (node.getAttribute('data-type') == 'selected-image') {
            /**
             * value: {
             *     id: file.id,
             *     size: file.size,
             *     name: file.name
             * }
             */
            info = JSON.parse(node.getAttribute('data-info'));
            info.src = node.getAttribute('src');
            info.width = node.getAttribute('width');
            info.height = node.getAttribute('height');

            return [{
                type: 'image',
                value: info
            }]
        }

        // 粘贴的图片
        if (node.getAttribute('data-type') == 'paste-image') {
            /**
             * value: {
             *     id: id,
             *     name: me._getCropImgName(),
             *     size: size
             * }
             */
            info = JSON.parse(node.getAttribute('data-info'));
            info.src = node.getAttribute('src');
            info.width = node.getAttribute('width');
            info.height = node.getAttribute('height');

            return [{
                type: 'paste',
                value: info
            }];
        }

        // 无法解析的图片
        return [{
            type: 'text',
            value: node.getAttribute('alt') || node.getAttribute('title') || '['+$t("图片")+']'
        }];
    }
    else if (node.nodeType == 1) {
        var children = node.childNodes,
            length = children.length,
            con = [];
        for (var i = 0; i < length; i++) {
            con = con.concat(getContentInfo(children[i]));
        }
        if (isBlockNode(node) && (!length || children[length - 1].nodeType != 1 || !isBlockNode(children[length - 1]))) {
            con.push({
                type: 'text',
                value: '\n'
            });
        }
        return con;
    }
    return [];
};

ContentEditable.prototype.getContentInfo = function () {
    var infos = getContentInfo(this.$node.get(0)),
        previousType,
        content = [];

    _.each(infos, function (info) {
        if (info.type == 'text' && previousType == 'text') {
            var prevContent = content[content.length - 1];
            prevContent.value = prevContent.value + info.value;
        }
        else {
            content.push(info);
        }
        previousType = info.type;
    });

    _.each(content, function (v) {
        if (v.type == 'text') {
            v.value = _.string.rtrim(v.value).replace(/^(\n|\r)+/, '').replace(/(\u200B|\u200D)/g, '');
        }
    });

    return content;
};

ContentEditable.prototype.clear = function () {
    var me = this;
    me.$node.empty().html('<p>' + BROWSER.fillChar + '</p>');
    me.setCursorPositionEnd();
};

module.exports = ContentEditable;
