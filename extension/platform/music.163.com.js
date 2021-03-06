// http://music.163.com/#/search
PLATFORM.Music163Com = function() {
  this.playtime = null;
  this.socket = null;
  this.init();
};
PLATFORM.Music163Com.prototype = {
  init: function() {
    if (!(window.parent !== window && window.location.href.indexOf('//music.163.com/search') > -1)) return;
    if (window.top.location.search.indexOf('livetool') < 0) return;
    this.inject();
    this.initSocket();
    this.play();
    console.log('music.163.com: init');
  },
  inject: function() {
    var scriptNode = document.createElement('script');
    var script = this.send.toString()
      .replace(/function[^(]+()[^{]*{/, '')
      .replace(/}[^}]*$/, '');
    scriptNode.innerHTML = [this.ajax.toString(), script].join(';');
    document.head.appendChild(scriptNode);
  },
  initSocket: function() {
    var socket = this.socket = io('http://127.0.0.1:6688/');
    socket.on('musicCut', this.next.bind(this));
  },
  play: function() {
    var playtime = Number(document.body.dataset.playtime) || 0;
    if (playtime === this.playtime || Date.now() < playtime) return setTimeout(this.play.bind(this), 1000);
    this.playtime = playtime;
    this.next();
  },
  next: function() {
    this.ajax('http://127.0.0.1:6688/music/next', function(err, data) {
      if (err || !data[0]) return alert('歌单需要加入歌曲');
      var song = data[0];
      try {
        document.querySelector('#m-search-input').value = song;
        document.querySelector('a.btn.j-flag').click();
      } catch (e) {
        return alert('播放出错');
      }
      this.play();
    }.bind(this));
  },
  send: function() {
    function shield(song) {
      var songs = ['嫁衣', '跳房子', '没人能听见', '第十三双眼', '癌', '黑色星期五', '人皮娃娃', '忏悔曲', '闹鬼的地下室', '妹妹背着洋娃娃', '百鸟朝凤'];
      for (var i = 0; i < songs.length; i++) {
        if (song.indexOf(songs[i]) > -1) return true;
      }
    }
    function play(songs) {
      if (!songs || !songs.length) return document.body.dataset.playtime = Date.now();
      var song = songs[0];
      console.log(song.id, song.name, song.dt);
      // 记录下一次播放时间
      setTimeout(function() {
        if (shield(song.name)) return document.body.dataset.playtime = Date.now();
        // 播放歌曲
        var el = document.getElementById('song_' + song.id)
        if (!el) return document.body.dataset.playtime = Date.now();
        var elClass = el.parentElement.parentElement.parentElement.className || '';
        if (elClass.indexOf('js-dis') > -1) return document.body.dataset.playtime = Date.now();
        el.click();
        document.body.dataset.playtime = Date.now() + Number(song.dt);
        var img = new Image();
        var query = 'id=' + encodeURIComponent(song.id) + '&name=' + encodeURIComponent(song.name) + '&dt=' + encodeURIComponent(song.dt);
        img.src = 'http://127.0.0.1:6688/music/record?' + query;
      }.bind(this), 1000);
    }
    var XHR_SEND = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function() {
      var onreadystatechange = this.onreadystatechange;
      if (!onreadystatechange._) {
        this.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            try {
              var result = (JSON.parse(this.responseText) || {}).result;
              if (result && typeof result.songCount !== 'undefined') {
                play(result.songs);
              }
            } catch (e) {}
          }
          onreadystatechange.apply(this, arguments);
        }
      }
      XHR_SEND.apply(this, arguments);
    };
  },
  ajax: function ajax(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) {
          callback(null, JSON.parse(this.responseText))
        } else {
          callback(true);
        }
      }
    };
    xmlhttp.onreadystatechange._ = true;
    xmlhttp.open('GET', url, true);
    xmlhttp.send(null);
  }
}