# 內部運作原理
* 透過修改 header, 重導 和 proxy 等方法來存取受限制的網站

# 目錄結構
* /server : proxy server
* /_locales : chrome extension 語系目錄
* /chrome
    * /content : 個別網站前端特殊處理腳本
    * /pages : Chrome Extension 選項設定頁面
    * config.js ; 程式入口
    * header.js : http request header 調整
    * proxy.js : chrome proxy 設定
    * redirect.js : 請求重導
    * storage.js : storage 讀寫
* /shared
    * tools.js
    * urls.js : 支援網址設定
* manifest.json : chrome extension manifest file

# 內部參數
* 預設 HTTP Proxy : proxy.uku.im:443
* 預設 HTTPS Proxy : secure.uku.im:993
* 預設重導服務器 : www.yōukù.com/proxy
* 備份重導服務器 : wbak.yōukù.com/proxy

# Storage
* unblock_youku_mode : 運作模式, lite, normal, redirect
* custom_redirect_server : 重導服務器
* custom_proxy_server_proc: proxy 協定
* custom_proxy_server_addr: proxy 網址

# 運作模式
* lite : header, setup_header()
* redirect : 重導, setup_redirect()
* normal : header + proxy, setup_header() + setup_proxy()
* 共用 : setup_extra_header()

## setup_extra_header()
* unblock_youku.header_extra_url_list 定義的網址, header 添加
    * X-Forwarded-For : unblock_youku.ip_addr
    * Client-IP : unblock_youku.ip_addr

## header_modifier()
* unblock_youku.normal_url_list 定義的網址, header 添加
    * X-Forwarded-For : unblock_youku.ip_addr
    * Client-IP : unblock_youku.ip_addr
    
## setup_redirect()
* unblock_youku.redirect_url_list 定義的網址, 
    * http://play.baidu.com/data/music/songlink(.*) 替換成 http://play.baidu.com/data/cloud/songlink(.*)
    * 使用 backend_server 重導網址, 格式
        * {backend_server}/http/{原始網址不含 http://}
        * {backend_server}/https/{原始網址不含 https://}
        
## setup_proxy()
* 修改 chrome 的 proxy 設定, 會影響所有網站

# 參考資料
* [chrome webRequest](https://developer.chrome.com/extensions/webRequest)
* [chrome proxy](https://developer.chrome.com/extensions/proxy)
