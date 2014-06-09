/*
* Windows - jQuery Plugin
* windows plugin (multi-layer window emulation).
*
* Copyright (c) 2014 Alex Vanyan (http://alex-v.net)
* Version: 1.0
* Requires: jQuery v1.7.0+
*/

(function($) {
    
    $.fn.windows = function(options) {
        
        var windows = $.fn.windows;

        windows.defaults = {
            title: "New window",
            url: false,
            content: false,
            left: 0,
            top: 0,
            width: 400,
            height: 200,
            closeSpeed: "slow",
            beforeClose: function() { return true; },
            afterClose: function() {},
            buttons: {
                minimize: true,
                maximize: true,
                close: true
            }
        };

        var bodyBound = false;

        windows.__init__ = function(opts, elem) {

            if ( ! opts.url && ! opts.content ) {
                console.log("jQuery.Window: Either 'url' or 'content' configuration param should be specified for window to work");
                return;
            }
            
            var el = elem ? elem : $("body");
            var newWindowId = 1;
            
            // try to find at least one window element that was created before
            // grabbing the latest one
            var lastWindow = $(".jquery-window:last-child");
            
            // if found one - id will be its id+1
            if ( lastWindow.length ) {
                newWindowId = parseInt(lastWindow.attr("data-id")) + 1;
            }
            
            // create and append the new window element to body or main selector element (if given)
            var newWindow = $("<div />").addClass("jquery-window")
                                        .attr("data-id", newWindowId)
                                        .css({
                                            position: "absolute",
                                            left: opts.left,
                                            top: opts.top,
                                            width: opts.width,
                                            height: opts.height,
                                            zIndex: newWindowId
                                        })
                                        .appendTo( el.css("position", "relative") ); // set parent's position and append to it
            
            // add title bar
            var titleBar = $("<div />").addClass("window-title-bar").appendTo(newWindow);

            // add title
            $("<span />").addClass("window-title").text(opts.title).appendTo(titleBar);
            
            // check for the options and add the title bar buttons
            if ( opts.buttons.close ) {
                $("<a />").addClass("action-button button-close").appendTo(titleBar);
            }
            if ( opts.buttons.maximize ) {
                $("<a />").addClass("action-button button-maximize").appendTo(titleBar);
            }
            if ( opts.buttons.minimize ) {
                $("<a />").addClass("action-button button-minimize").appendTo(titleBar);
            }

            // append the content area
            var contentWrap = $("<div />").addClass("window-content")
                                          .css("position", "relative")
                                          .appendTo(newWindow);

            windows.bindActions(opts, newWindow, elem);
            
            if ( opts.url ) {
                $("<iframe />").attr({
                    src: opts.url,
                    frameborder: 0,
                    width: opts.width,
                    height: opts.height - titleBar.outerHeight()
                }).appendTo(contentWrap);
            }
            else if ( opts.content ) {
                contentWrap.append(opts.content);
            }

        };

        windows.iframeFix = function(enable, obj) {

            if ( enable ) {
                
                $("iframe").each(function() {
                    
                    if ( this == obj ) return;

                    $(this).css("position", "relative");

                    $("<div />").css({
                        left: $(this).get(0).offsetLeft,
                        top: $(this).get(0).offsetTop,
                        width: $(this).outerWidth(),
                        height: $(this).outerHeight(),
                        position: "absolute",
                        backgroundColor: "#FFFFFF",
                        opacity: 0.001,
                        zIndex: 10000
                    })
                    .addClass("jquery-window-iframe-fix")
                    .appendTo($(this).parent());

                });

            } else {

                $("iframe").css("position", "static");
                $(".jquery-window-iframe-fix").remove();

            }

        };

        windows.bindActions = function(opts, win, elem) {
            
            var dragging = false;
            
            win.find(".window-title-bar").on("mousedown", function(e) {
                e.preventDefault();
                windows.iframeFix(true);
                dragging = $(this).parent();
                dragging.addClass("dragging");
                $(this).data("offsetX", $(this).offset().left);
                $(this).data("offsetY", $(this).offset().top);
                $(this).data("screenX", e.screenX);
                $(this).data("screenY", e.screenY);
                dragging.data("handle", $(this));
            });
            
            win.on("mouseup", function(e) {
                e.preventDefault();
                windows.iframeFix(false);
                if ( dragging ) {
                    dragging.removeClass("dragging");
                    dragging = false;
                }
                $(".jquery-window").each(function() {
                    $(this).css("z-index", $(this).attr("data-id"));
                });
                $(this).css("z-index", 999999);
                windows.iframeFix(true, $(this).find("iframe").get(0));
            });
            
            win.on("mousedown", function(e) {
                e.preventDefault();
                $(".jquery-window").each(function() {
                    $(this).css("z-index", $(this).attr("data-id"));
                });
                $(this).css("z-index", 999999);
            });
            
            if ( ! bodyBound ) {

                var dragHandle, boundaryLimit, left, top;

                $(document).on("mousemove", "body", function(e) {
                
                    bodyBound = true;

                    if ( dragging ) {
                
                        dragHandle = dragging.data("handle");
                    
                        left = parseInt(dragHandle.data("offsetX")) + e.screenX - parseInt(dragHandle.data("screenX")) - elem.offset().left;
                        top = parseInt(dragHandle.data("offsetY")) + e.screenY - parseInt(dragHandle.data("screenY")) - elem.offset().top;

                        // check MIN boundary limit
                        left = left < 0 ? 0 : left;
                        top = top < 0 ? 0 : top;

                        // check MAX boundary limit
                        boundaryLimit = elem.outerWidth() - win.outerWidth();
                        left = left > boundaryLimit ? boundaryLimit : left;
                        boundaryLimit = elem.outerHeight() - win.outerHeight();
                        top = top > boundaryLimit ? boundaryLimit : top;

                        win.css({ left: left, top: top });

                    }

                });

            }

            win.find(".button-close").on("click", function(e) {
                e.preventDefault();
                if ( true === opts.beforeClose() ) {
                    $(this).parents(".jquery-window").fadeOut(opts.closeSpeed, function() {
                        $(this).remove();
                        opts.afterClose();
                    });
                }
            });

        };

        return this.each(function() {
            var opts = $.extend({}, windows.defaults, options);
            windows.__init__(opts, $(this));
        });

    };

})(jQuery);
