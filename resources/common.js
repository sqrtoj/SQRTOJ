if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        return this.substr(position || 0, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

// http://stackoverflow.com/a/1060034/1090657
$(function () {
    var hidden = 'hidden';

    // Standards:
    if (hidden in document)
        document.addEventListener('visibilitychange', onchange);
    else if ((hidden = 'mozHidden') in document)
        document.addEventListener('mozvisibilitychange', onchange);
    else if ((hidden = 'webkitHidden') in document)
        document.addEventListener('webkitvisibilitychange', onchange);
    else if ((hidden = 'msHidden') in document)
        document.addEventListener('msvisibilitychange', onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange(evt) {
        var v = 'window-visible', h = 'window-hidden', evtMap = {
            focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
        };

        evt = evt || window.event;
        if (evt.type in evtMap)
            document.body.className = evtMap[evt.type];
        else
            document.body.className = this[hidden] ? 'window-hidden' : 'window-visible';

        if ('$' in window)
            $(window).trigger('dmoj:' + document.body.className);
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if (document[hidden] !== undefined)
        onchange({type: document[hidden] ? 'blur' : 'focus'});
});

function register_toggle(link) {
    link.click(function () {
        var toggled = link.next('.toggled');
        if (toggled.is(':visible')) {
            toggled.hide(400);
            link.removeClass('open');
            link.addClass('closed');
        } else {
            toggled.show(400);
            link.addClass('open');
            link.removeClass('closed');
        }
    });
}

$(function register_all_toggles() {
    $('.toggle').each(function () {
        register_toggle($(this));
    });
});

function featureTest(property, value, noPrefixes) {
    var prop = property + ':',
        el = document.createElement('test'),
        mStyle = el.style;

    if (!noPrefixes) {
        mStyle.cssText = prop + ['-webkit-', '-moz-', '-ms-', '-o-', ''].join(value + ';' + prop) + value + ';';
    } else {
        mStyle.cssText = prop + value;
    }
    return !!mStyle[property];
}

window.fix_div = function (div, height) {
    var div_offset = div.offset().top - $('html').offset().top;
    var is_moving;
    var moving = function () {
        div.css('position', 'absolute').css('top', div_offset);
        is_moving = true;
    };
    var fix = function () {
        div.css('position', 'fixed').css('top', height);
        is_moving = false;
    };
    ($(window).scrollTop() - div_offset > -height) ? fix() : moving();
    $(window).scroll(function () {
        if (($(window).scrollTop() - div_offset > -height) == is_moving)
            is_moving ? fix() : moving();
    });
};

$(function () {
    var $nav_list = $('#nav-list');
    var $navicon = $('#navicon');
    var $user_menu = $('#user-menu');
    var $user_menu_toggle = $('#user-menu-toggle');

    var close_nav_menus = function () {
        $nav_list.removeClass('show-list');
        $navicon.removeClass('hover').attr('aria-expanded', 'false');
        $user_menu.removeClass('show-list');
        $user_menu_toggle.attr('aria-expanded', 'false');
    };

    $navicon.click(function (event) {
        event.stopPropagation();
        var is_open = !$nav_list.hasClass('show-list');
        $user_menu.removeClass('show-list');
        $user_menu_toggle.attr('aria-expanded', 'false');
        $nav_list.toggleClass('show-list', is_open);
        $(this).toggleClass('hover', is_open).attr('aria-expanded', is_open ? 'true' : 'false');
    }).hover(function () {
        $(this).addClass('hover');
    }, function () {
        if (!$nav_list.hasClass('show-list'))
            $(this).removeClass('hover');
    });

    $nav_list.find('li a .nav-expand').click(function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parent().siblings('ul').toggleClass('show-list');
    });

    $user_menu_toggle.click(function (event) {
        event.stopPropagation();
        var is_open = !$user_menu.hasClass('show-list');
        $nav_list.removeClass('show-list');
        $navicon.removeClass('hover').attr('aria-expanded', 'false');
        $user_menu.toggleClass('show-list', is_open);
        $(this).attr('aria-expanded', is_open ? 'true' : 'false');
    });

    $nav_list.find('li a').each(function () {
        if (!$(this).siblings('ul').length)
            return;
        $(this).on('contextmenu', function (event) {
            event.preventDefault();
        }).on('taphold', function () {
            $(this).siblings('ul').css('display', 'block');
        });
    });

    $nav_list.add($user_menu).click(function (event) {
        event.stopPropagation();
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            close_nav_menus();
            $navicon.trigger('focus');
        }
    });

    $(window).on('resize', function () {
        if (window.innerWidth > 960)
            close_nav_menus();
    });

    $('html').click(close_nav_menus);

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!(/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type)) && !this.crossDomain)
                xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
        }
    });
});

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

function count_down(label) {
    var initial = parseInt(label.attr('data-secs'));
    var start = Date.now();

    function formatUnit(value, singular, plural) {
        return ngettext(singular, plural, value).replace('%s', value);
    }

    var timer = setInterval(function () {
        var time = Math.max(0, Math.round(initial - (Date.now() - start) / 1000));
        if (time <= 0) {
            clearInterval(timer);
            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
        var d = Math.floor(time / 86400);
        var h = Math.floor(time % 86400 / 3600);
        var m = Math.floor(time % 3600 / 60);
        var s = time % 60;
        var parts = [];
        if (d > 0) {
            var day_str = ngettext('%s day', '%s days', d).replace('%s', d);
            label.text(day_str + ' ' + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2));
        } else {
            label.text(('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2));
        }
    }, 1000);
}

function register_time(elems, limit) {
    limit = 60;
    elems.each(function () {
        var outdated = false;
        var $this = $(this);
        var time = moment($this.attr('data-iso'));
        var rel_format = $this.attr('data-format');

        function update() {
            if ($('body').hasClass('window-hidden'))
                return outdated = true;
            outdated = false;
            if (moment().diff(time, 'seconds') < limit) {
                $this.text(rel_format.replace('{time}', time.fromNow()));
            } else {
                $this.text(rel_format.replace('{time}', time.format("h:mm:ss a, DD/MM/YYYY")));
            }
            setTimeout(update, 10000);
        }

        $(window).on('dmoj:window-visible', function () {
            if (outdated)
                update();
        });

        update();
    });
}

$(function () {
    register_time($('.time-with-rel'));

    $('form').submit(function (evt) {
        // Prevent multiple submissions of forms, see #565
        $("button[type=submit], input[type=submit]").prop('disabled', true);
    });

    // Bring the active tab into view on horizontally-scrollable tab strips so it
    // isn't left offscreen on narrow viewports. Scroll the strip itself instead
    // of the whole page to avoid unwanted vertical jumps.
    $('.tabs > ul').each(function () {
        var strip = this;
        var active = $(strip).children('li.active')[0];
        if (!active || strip.scrollWidth <= strip.clientWidth)
            return;
        var target = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
        strip.scrollLeft = Math.max(0, target);
    });

    // Keep the footer copyright year current without a template rebuild.
    $('.js-current-year').text(new Date().getFullYear());
});

window.notification_template = {
    icon: '/logo.png'
};
window.notification_timeout = 5000;

window.notify = function (type, title, data, timeout) {
    if (localStorage[type + '_notification'] != 'true') return;
    var template = window[type + '_notification_template'] || window.notification_template;
    var data = (typeof data !== 'undefined' ? $.extend({}, template, data) : template);
    var object = new Notification(title, data);
    if (typeof timeout === 'undefined')
        timeout = window.notification_timeout;
    if (timeout)
        setTimeout(function () {
            object.close();
        }, timeout);
    return object;
};

window.register_notify = function (type, options) {
    if (typeof options === 'undefined')
        options = {};

    function status_change() {
        if ('change' in options)
            options.change(localStorage[key] == 'true');
    }

    var key = type + '_notification';
    if ('Notification' in window) {
        if (!(key in localStorage) || Notification.permission !== 'granted')
            localStorage[key] = 'false';

        if ('$checkbox' in options) {
            options.$checkbox.change(function () {
                var status = $(this).is(':checked');
                if (status) {
                    if (Notification.permission === 'granted') {
                        localStorage[key] = 'true';
                        notify(type, 'Notification enabled!');
                        status_change();
                    } else
                        Notification.requestPermission(function (permission) {
                            if (permission === 'granted') {
                                localStorage[key] = 'true';
                                notify(type, 'Notification enabled!');
                            } else localStorage[key] = 'false';
                            status_change();
                        });
                } else {
                    localStorage[key] = 'false';
                    status_change();
                }
            }).prop('checked', localStorage[key] == 'true');
        }

        $(window).on('storage', function (e) {
            e = e.originalEvent;
            if (e.key === key) {
                if ('$checkbox' in options)
                    options.$checkbox.prop('checked', e.newValue == 'true');
                status_change();
            }
        });
    } else {
        if ('$checkbox' in options) options.$checkbox.hide();
        localStorage[key] = 'false';
    }
    status_change();
};


$(function () {
    // Close dismissable boxes
    $("a.close").click(function () {
        var $closer = $(this);
        $closer.parent().fadeOut(200);
    });
});

$(function () {
    // Reveal spoiler
    $(document).on('click', 'blockquote.spoiler', function (e) {
        $(this).addClass("is-visible");
        e.stopPropagation();
    } );
});
