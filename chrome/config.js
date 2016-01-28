/*
 * Copyright (C) 2012 - 2014  Bo Zhu  http://zhuzhu.org
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/*jslint browser: true */
/*global chrome: false, get_storage: false, set_storage: false, new_random_ip: false */
/*global setup_redirect: false, setup_header: false, setup_proxy: false, setup_timezone: false, setup_extra_header: false */
/*global clear_redirect: false, clear_header: false, clear_proxy: false, clear_timezone: false */
/*global ga_report_event: false, ga_report_ratio: false, ga_report_error: false */
"use strict";

// ====== Constant and Variable Settings ======
var unblock_youku = unblock_youku || {};  // namespace

// only for proxy mode
unblock_youku.default_proxy_server_proc = 'HTTPS';
unblock_youku.default_proxy_server_addr = 'secure.uku.im:993';
unblock_youku.backup_proxy_server_proc = 'HTTP';
unblock_youku.backup_proxy_server_addr = 'proxy.uku.im:443';

// === For debug - start ===
/*
unblock_youku.default_proxy_server_proc = 'SOCKS5';
unblock_youku.default_proxy_server_addr = '127.0.0.1:1080';
unblock_youku.backup_proxy_server_proc = 'SOCKS5';
unblock_youku.backup_proxy_server_addr = '127.0.0.1:1080';
*/
// == For debug - end ===

// only for redirect mode
unblock_youku.default_redirect_server = 'www.yōukù.com/proxy';
// unblock_youku.default_redirect_server = '127.0.0.1:8888/proxy';
unblock_youku.backup_redirect_server = 'bak.yōukù.com/proxy';

unblock_youku.normal_url_list = unblock_youku.common_urls.concat(unblock_youku.chrome_extra_urls);
unblock_youku.redirect_url_list = unblock_youku.common_urls;
unblock_youku.header_extra_url_list = [
    // 'http://web-play.pptv.com/*',
    // 'http://web-play.pplive.cn/*',
    'http://v.api.hunantv.com/*',
    'http://live.gslb.letv.com/*',
    'http://ac.qq.com/*',
    'http://*.ssports.com/*',
    'http://ssports.com/*',
    'http://ssports.smgbb.cn/*',
    'http://www.bilibili.com/*',
    'http://interface.bilibili.com/*',
    'http://*.xiami.com/*',  // xiami is blocked in HK and TW
    'http://*.ku6.com/*',
    'http://kandian.com/player/getEpgInfo*'  // !!!
];

unblock_youku.ip_addr = new_random_ip();
console.log('ip addr: ' + unblock_youku.ip_addr);


// ====== Configuration Functions ======
/**
 * 設定運行模式
 *
 * @param mode_name string 
 */
function set_mode_name(mode_name, callback) {
    if (typeof callback === 'undefined') {
        var err_msg = 'missing callback function in set_mode_name()';
        console.error(err_msg);
        ga_report_error('Unexpected Error', err_msg);
    }

    if (mode_name === 'lite' || mode_name === 'redirect') {
        set_storage('unblock_youku_mode', mode_name, callback);
    } else {
        set_storage('unblock_youku_mode', 'normal', callback);
    }
}

/**
 * 取得運行模式
 *
 * @param callback function( string)
 */
function get_mode_name(callback) {
    if (typeof callback === 'undefined') {
        var err_msg = 'missing callback function in get_mode_name()';
        console.error(err_msg);
        ga_report_error('Unexpected Error', err_msg);
    }

    get_storage('unblock_youku_mode', function(current_mode) {
        if (typeof current_mode === 'undefined' || (
                current_mode !== 'lite'    &&
                current_mode !== 'normal'  &&
                current_mode !== 'redirect')) {
            set_mode_name('normal', function() {
                callback('normal');
            });
        } else {
            callback(current_mode);
        }
    });
}

function clear_mode_settings(mode_name) {
    switch (mode_name) {
    case 'lite':
        // clear_timezone();
        clear_header();
        console.log('cleared settings for lite');
        break;
    case 'redirect':
        clear_redirect();
        console.log('cleared settings for redirect');
        break;
    case 'normal':
        // clear_timezone();
        clear_proxy();
        clear_header();
        console.log('cleared settings for normal');
        break;
    default:
        var err_msg = 'clear_mode_settings: should never come here';
        console.error(err_msg);
        ga_report_error('Unexpected Error', err_msg);
        break;
    }

    console.log('cleared the settings for the mode: ' + mode_name);
}

/**
 * 依據模式配置
 *
 *
 */ 
function setup_mode_settings(mode_name) {
    switch (mode_name) {
    case 'lite':
        setup_header();
        // setup_timezone();
        break;
    case 'redirect':
        setup_redirect();
        break;
    case 'normal':
        setup_header();
        setup_proxy();
        // setup_timezone();
        break;
    default:
        var err_msg = 'setup_mode_settings: should never come here';
        console.error(err_msg);
        ga_report_error('Unexpected Error', err_msg);
        break;
    }

    console.log('initialized the settings for the mode: ' + mode_name);
}

function change_mode(new_mode_name) {
    set_mode_name(new_mode_name, function() {});
    // the storage change listener would take care about the setting changes
}

function _change_browser_icon(option) {
    var today = new Date();
    var y = today.getFullYear();
    var d = today.getDate();
    var m = today.getMonth() + 1;

    // hard-coded spring festivals
    var is_spring = false;
    switch (y) {
        case 2016:  // February 8, 2016
            if ((m === 1 && d >= 29) || (m === 2 && d <= 18)) {
                is_spring = true;
            }
            break;
        case 2017:  // January 28
            if ((m === 1 && d >= 18) || (m === 2 && d <= 7)) {
                is_spring = true;
            }
            break;
        case 2018:  // February 16
            if (m === 2 && (6 <= d && d <= 26)) {
                is_spring = true;
            }
            break;
    }
    if (is_spring) {
        chrome.browserAction.setIcon({path: 'chrome/icons/icon19spring.png'});
        chrome.browserAction.setTitle({title: 'Happy Spring Festival! (Unblock Youku ' + unblock_youku.version + ')'});
        return;
    }

    // christmas
    if (m === 12 && d >= 15) {
        chrome.browserAction.setIcon({path: 'chrome/icons/icon19xmas.png'});
        chrome.browserAction.setTitle({title: 'Merry Christmas! (Unblock Youku ' + unblock_youku.version + ')'});
        return;
    }
    
    if (option === 'heart') {
        chrome.browserAction.setIcon({path: 'chrome/icons/icon19heart.png'});
        chrome.browserAction.setTitle({title: 'Thank you! (Unblock Youku ' + unblock_youku.version + ')'});
    } else {
        chrome.browserAction.setIcon({path: 'chrome/icons/icon19.png'});
        chrome.browserAction.setTitle({title: 'Unblock Youku ' + unblock_youku.version});
    }
}


function change_browser_icon(option) {
    // check chrome.storage before changing icons
    // the mode should already be set in previous get_mode_name()
    get_storage('unblock_youku_mode', function(current_mode) {
        if (typeof current_mode !== 'undefined') {
            _change_browser_icon(option);
        } else {
            var err_msg = 'chrome.storage has some problems';
            console.log(err_msg);
            ga_report_error('Unexpected Error', err_msg);
        }
    });

}


// Settings are changed asynchronously
function storage_monitor(changes, area) {
    console.log('storage changes: ' + JSON.stringify(changes));

    if (typeof changes.unblock_youku_mode !== 'undefined') {
        var mode_change = changes.unblock_youku_mode;

        // doesn't run if it's first time to migrate the old settings
        if (typeof mode_change.oldValue !== 'undefined' && typeof mode_change.newValue !== 'undefined') {
            clear_mode_settings(mode_change.oldValue);
            setup_mode_settings(mode_change.newValue);
            //ga_report_event('Change Mode', mode_change.oldValue + ' -> ' + mode_change.newValue);
        }
    }

    if (typeof changes.custom_redirect_server !== 'undefined') {
        var redirect_server_change = changes.custom_redirect_server;
        
        if (typeof redirect_server_change.newValue !== 'undefined') {
            // have to use a localStorage cache for using in the blocking webRequest listener
            localStorage.custom_redirect_server = redirect_server_change.newValue;
        } else {
            if (typeof localStorage.custom_redirect_server !== 'undefined') {
                localStorage.removeItem('custom_redirect_server');
            }
        }
    }

    if (typeof changes.custom_proxy_server !== 'undefined') {
        var proxy_server_change = changes.custom_proxy_server;
        if (typeof proxy_server_change.newValue !== 'undefined'
                && typeof proxy_server_change.newValue.proc !== 'undefined'
                && typeof proxy_server_change.newValue.addr !== 'undefined') {
            localStorage.custom_proxy_server_proc = proxy_server_change.newValue.proc;
            localStorage.custom_proxy_server_addr = proxy_server_change.newValue.addr;
        } else {
            if (typeof localStorage.custom_proxy_server_proc !== 'undefined') {
                localStorage.removeItem('custom_proxy_server_proc');
            }
            if (typeof localStorage.custom_proxy_server_addr !== 'undefined') {
                localStorage.removeItem('custom_proxy_server_addr');
            }
        }
    }
}


function setup_storage_monitor() {
    if (!chrome.storage.onChanged.hasListener(storage_monitor)) {
        chrome.storage.onChanged.addListener(storage_monitor);
        console.log('storage_monitor is set');
    } else {
        var err_msg = 'storage_monitor is already there!';
        console.error(err_msg);
        ga_report_error('Unexpected Error', err_msg);
    }
}


// ====== Initialization ======
document.addEventListener("DOMContentLoaded", function() {
    setup_storage_monitor();

    unblock_youku.version = chrome.runtime.getManifest().version;

    // the latest version to show NEW on the icon; it's usually a big update with new features
    unblock_youku.lastest_new_version = '2.8.0.1';
    get_storage('previous_new_version', function(version) {
        // previous_new_version will be set by the popup page once the page is opened
        if (typeof version === 'undefined' || version !== unblock_youku.lastest_new_version) {
            chrome.browserAction.setBadgeText({text: 'NEW'});
        }
    });

    get_mode_name(function(current_mode_name) {
        setup_mode_settings(current_mode_name);

        ga_report_ratio('Init Mode', current_mode_name);
        ga_report_ratio('Version', unblock_youku.version);

        change_browser_icon('regular');  // set the icon once everything is done
    });

    setup_extra_header();
    // setup_extra_redirector();
});

