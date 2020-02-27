/**
 * Created by Ys.
 */
define(function (require, exports, module) {
    var util = require('qx-util'),
        Video = require('./video');

    module.exports = function (options) {
        var $wrapper = options.wrapper = $('<div class="no-drag f-qx-pop-video-wrapper" style="-webkit-app-region: no-drag;"><div class="f-qx-pop-video-wrapper-bg"></div></div>').appendTo('body'),
            video = new Video(_.extend({
                autoPlay: true
            }, options)),
            $el = $wrapper.find('.f-qx-video-panel'),
            $close = $('<div class="close"></div>').appendTo($el),
            $video = $wrapper.find('video'),
            $win = $(window),
            resize = function () {
                var videoEl = $video[0],
                    winWidth = $win.width(),
                    winHeight = $win.height(),
                    videoHeight = videoEl.videoHeight,
                    videoWidth = videoEl.videoWidth;

                if (!videoWidth || !videoHeight) {
                    return;
                }

                var height = Math.min(winHeight - 36, videoHeight),
                    width = height * videoWidth / videoHeight;

                if (width > winWidth) {
                    width = winWidth - 36;
                    height = width * videoHeight / videoWidth;
                }

                $el.css({
                    height: height,
                    width: width
                });
            };

        if (options.poster) {
            $el.css('background-image', 'url(' + options.poster + ')');
        }

        video.on('canplay', resize);
        $win.on('resize', resize);
        $wrapper.on('click', function (evt) {
            evt.stopPropagation();
        });

        util.delayHover($el, function () {
            $close.show();
        }, function () {
            $close.hide();
        });


        $close.on('click', function (evt) {
            evt.stopPropagation();
            $win.off('resize', resize);
            video.destroy();
            $wrapper.remove();
        });

        return video;
    };
});