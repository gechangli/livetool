// TODO:
// 1. 语音播报队列
var SPEAKING = false;
var SPEAK_LIST = [];

// 选填  语速，取值0-9，默认为5中语速
var VOICE_SPD = [{value: '0', text: '0'}, {value: '1', text: '1'}, {value: '2', text: '2'}, {value: '3', text: '3'}, {value: '4', text: '4'}, {value: '5', text: '5'}, {value: '6', text: '6'}, {value: '7', text: '7'}, {value: '8', text: '8'}, {value: '9', text: '9'}];
// 选填  音调，取值0-9，默认为5中语调
var VOICE_PIT = [{value: '0', text: '0'}, {value: '1', text: '1'}, {value: '2', text: '2'}, {value: '3', text: '3'}, {value: '4', text: '4'}, {value: '5', text: '5'}, {value: '6', text: '6'}, {value: '7', text: '7'}, {value: '8', text: '8'}, {value: '9', text: '9'}];
// 选填  音量，取值0-15，默认为5中音量
var VOICE_VOL = [{value: '0', text: '0'}, {value: '1', text: '1'}, {value: '2', text: '2'}, {value: '3', text: '3'}, {value: '4', text: '4'}, {value: '5', text: '5'}, {value: '6', text: '6'}, {value: '7', text: '7'}, {value: '8', text: '8'}, {value: '9', text: '9'}, {value: '10', text: '10'}, {value: '11', text: '11'}, {value: '12', text: '12'}, {value: '13', text: '13'}, {value: '14', text: '14'}, {value: '15', text: '15'}];
// 选填  发音人选择, 0为普通女声，1为普通男生，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声
var VOICE_PER = [{value: '0', text: '普通女声'}, {value: '1', text: '普通男生'}, {value: '3', text: '度逍遥'}, {value: '4', text: '度丫丫'} ];

var createElement = React.createElement;
var DanmuComponent = createReactClass({
  getInitialState: function() {
    var weak = this.props.admin ? new NoSleep() : null;
    return {
      weak: weak,
      sleep: true,

      messageScrollPercent: 1,
      giftScrollPercent: 1,
      logScrollPercent: 1,

      adminVoiceVisible: false,
      adminAutoscrollVisible: false,
      adminOtherVisible: false,
      baiduVoice: true,
      voiceSpd: '6', // 选填  语速，取值0-9，默认为5中语速
      voicePit: '5', // 选填  音调，取值0-9，默认为5中语调
      voiceVol: '10', // 选填  音量，取值0-15，默认为5中音量
      voicePer: '4', // 选填  发音人选择, 0为普通女声，1为普通男生，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声

      voiceWelcome: this.props.hash.indexOf('core') > -1,
      voiceChat: this.props.hash.indexOf('core') > -1,
      messagesLocked: false,
      giftsLocked: false,
      logsLocked: false,
      welcomes: [],
      messages: [],
      gifts: [],
      logs: [],
    };
  },
  componentDidMount: function() {
    this.props.socket.on('danmu', function(data) {
      var type = data.type;
      switch (data.type) {
        case 'welcome':
          this.welcome(data);
          break;
        case 'chat':
          this.chat(data);
          break;
        case 'gift':
          this.gift(data);
          break;
        case 'deserve':
          this.gift(data);
          break;
        case 'log':
          this.log(data);
          break;
      }
    }.bind(this));
  },
  componentDidUpdate: function() {
    var giftNode = this.refs.gift;
    var messageNode = this.refs.message;
    var logNode = this.refs.log;
    if (!this.state.messagesLocked) {
      messageNode.scrollTop = messageNode.scrollHeight;
    }
    if (!this.state.giftsLocked) {
      giftNode.scrollTop = giftNode.scrollHeight;
    }
    if (!this.state.logsLocked) {
      logNode.scrollTop = logNode.scrollHeight;
    }
  },
  gift: function(data) {
    if (this.props.admin && data.type === 'deserve') return alert(data.response.raw); // TODO
    var response = data.response;
    var body = response.body;
    this.setState(function(prevState) {
      var gifts = Util.copy(prevState.gifts);
      gifts.push({
        key: Date.now(),
        nickname: body.nn,
        body: body,
        raw: response.raw
      });
      return {
        gifts: this.props.admin ? gifts : gifts.slice(gifts.length - 20)
      };
    });
  },
  welcome: function(data) {
    var user = data.user;
    var song = data.song;
    var response = data.response;
    var body = response.body;
    var nickname = body.nn;
    if (user) {
      var names = user.names;
      if (names.indexOf(nickname) < 0) {
        nickname += '(' + names[names.length - 1] + ')';
      }
    }
    // TODO
    // if (!user) return;
    if (this.state.voiceWelcome) {
      this.speak('欢迎' + nickname + (user ? '回' : '来') + '到直播间' + (data.song ? ('(进场音乐：' + data.song + ')') : ''));
    }
    this.setState(function(prevState) {
      var welcomes = Util.copy(prevState.welcomes) || {};
      welcomes.push({
        key: 'W_' + Date.now(),
        type: 'welcome',
        top: Math.round(Math.random() * 80 + 6),
        nickname: nickname,
        body: body,
        user: user,
        raw: response.raw
      });
      return {
        welcomes: welcomes.slice(welcomes.length - 20)
      }
    });
    this.setState(function(prevState) {
      var messages = Util.copy(prevState.messages) || [];
      messages.push({
        key: Date.now(),
        type: 'welcome',
        nickname: nickname,
        body: body,
        user: user,
        song: song,
        raw: response.raw
      });
      return {
        messages: this.props.admin ? messages : messages.slice(messages.length - 20)
      };
    });
  },
  chat: function(data) {
    var response = data.response;
    var body = response.body;
    if (this.state.voiceChat) {
      this.speak(body.txt);
    }
    this.setState(function(prevState) {
      var messages = Util.copy(prevState.messages);
      messages.push({
        key: Date.now(),
        type: 'chat',
        nickname: body.nn,
        danmu: body.txt,
        nameplate: body.bnn,
        permission: body.rg,
        body: body,
        raw: response.raw
      });
      return {
        messages: this.props.admin ? messages : messages.slice(messages.length - 20)
      };
    });
  },
  log: function(data) {
    var response = data.response;
    var body = response.body;
    var message = [body.type.trim()].join(' ');
    this.setState(function(prevState) {
      var logs = Util.copy(prevState.logs);
      logs.push(message);
      return {
        logs: this.props.admin ? logs : logs.slice(logs.length - 20)
      };
    });
  },
  speak: function(text) {
    text = text || '';
    text = text.replace(/\[emot\:dy\d+\]/g, '');
    if (this.state.baiduVoice) {
      this.baiduSpeak(text);
    } else {
      this.systemSpeak(text);
    }
  },
  baiduSpeak: function(text) {
    if (SPEAKING) return;
    var self = this;
    var audio = new Audio();

    audio.oncancel = audio.onerror = function() {
      SPEAKING = false;
      audio = null;
      self.systemSpeak(text);
    };
    audio.onended = function() {
      SPEAKING = false;
      audio = null;
    };
    audio.oncanplay = function() {
      SPEAKING = true;
      audio.play();
      audio = null;
    };

    setTimeout(function () {
      if (!SPEAKING) return;
      SPEAKING = false;
      audio = null;
    }, 5000);

    audio.src = 'http://tsn.baidu.com/text2audio?lan=zh&ctp=1'
      + '&cuid=CUID_' + Date.now()
      + '&tok=' + GLOBAL_CONFIG.baidu_access_token
      + '&tex=' + text
      + '&spd=' + this.state.voiceSpd
      + '&pit=' + this.state.voicePit
      + '&vol=' + this.state.voiceVol
      + '&per=' + this.state.voicePer
    ;
  },
  systemSpeak: function(text) {
    var message = new SpeechSynthesisUtterance(text);
    message.lang = 'zh';
    speechSynthesis.speak(message);
  },
  renderWelcomes: function() {
    if (this.state.admin) return null;
    return createElement('div', {
      className: 'danmu__welcomes'
    },
      this.state.welcomes.map(function(item, index) {
        var lastLogin = '来';
        if (item.user) {
          lastLogin = '回';
        }
        return React.createElement('div', {
          key: item.key,
          style: {
            marginTop: item.top + 'px'
          },
          className: 'welcomes__item'
        }, '欢迎', createElement('span', {
          className: 'item__nickname'
        }, item.nickname), (item.user ? '回' : '来') + '到直播间');
      }.bind(this))
    );
  },
  renderGifts: function() {
    return createElement('div', {
      className: 'danmu__gifts'
    },
      createElement('div', {
        className: 'gifts_percent',
        style: {
          width: (1 - this.state.giftScrollPercent) * 100 + '%'
        }
      }),
      createElement('div', {
        className: 'gifts__inner',
        onScroll: function(event) {
          this.setState({
            giftScrollPercent: event.target.scrollTop / ((event.target.scrollHeight - event.target.offsetHeight) || 1)
          });
        }.bind(this),
        ref: 'gift'
      },
        this.state.gifts.map(function(item, index) {
          var gift = '';
          if (this.props.admin) {
            gift = Config.danmu.gifts[item.body.gfid];
          }
          gift = gift || '礼物';
          return React.createElement('li', {
            key: item.key,
            className: 'gifts__item'
          }, '感谢', createElement('span', {
            className: 'item__nickname'
          }, item.nickname), '送的' + gift);
        }.bind(this))
      )
    );
  },
  renderMessageWelcom: function(item, index) {
    var lastLogin = '来';
    if (item.user) {
      lastLogin = '回';
      if (this.props.admin && item.user.timestamp) {
        lastLogin = ' (上次 ' + (new Date(item.user.timestamp)).toLocaleString() + ' ) ' + lastLogin
      }
    }
    return React.createElement('div', {
      key: item.key,
      className: 'messages__item messages__item--' + item.type
    }, '欢迎', createElement('span', {
      className: 'item__nickname'
    }, item.nickname), lastLogin + '到直播间' + (item.song ? (' (进场音乐：' + item.song + ')') : ''));
  },
  renderMessageChat: function(item, index) {
    var permission = Config.danmu.permissions[item.permission];
    var nickname = item.nickname;
    var nameplate = item.nameplate;
    var permissionNode = permission ? createElement('span', {
      className: 'item__permission'
    } , '[' + permission + ']') : null;
    var nameplateNode = nameplate ? createElement('span', {
      className: 'item__nameplate' + (Number(item.body.brid) === Config.room ? ' item__nameplate--family' : '')
    }, '[' + nameplate + ']') : null;
    var nicknameNode = createElement('span', {
      className: 'item__nickname'
    } , nickname + ':');
    var danmuNode = item.danmu.split(/(\[emot:[^\]]+\])/).map(function(item, index) {
      if (/^\[emot\:dy\d+\]$/.test(item)) {
        var id = item.match(/dy\d+/)[0];
        return createElement('img', {
          key: index,
          src: Config.danmu.emojis(id)
        });
      }
      return item;
    });
    return React.createElement('div', {
      key: item.key,
      className: 'messages__item messages__item--' + item.type
    }, permissionNode, nameplateNode, nicknameNode, danmuNode);
  },
  renderMessages: function() {
    return createElement('div', {
      className: 'danmu__messages'
    },
      createElement('div', {
        className: 'messages_percent',
        style: {
          width: (1 - this.state.messageScrollPercent) * 100 + '%'
        }
      }),
      createElement('div', {
        className: 'messages__inner',
        ref: 'message',
        onScroll: function(event) {
          this.setState({
            messageScrollPercent: event.target.scrollTop / ((event.target.scrollHeight - event.target.offsetHeight) || 1)
          });
        }.bind(this)
      },
        this.state.messages.map(function(item, index) {
          var message = '';
          switch (item.type) {
            case 'welcome':
              return this.renderMessageWelcom(item, index);
            case 'chat':
              return this.renderMessageChat(item, index);
              break;
          }
        }.bind(this))
      )
    );
  },
  renderLogs: function() {
    return createElement('div', {
      className: 'danmu__logs'
    },
      createElement('div', {
        className: 'logs_percent',
        style: {
          width: (1 - this.state.logScrollPercent) * 100 + '%'
        }
      }),
      createElement('ul', {
        onScroll: function(event) {
          this.setState({
            logScrollPercent: event.target.scrollTop / ((event.target.scrollHeight - event.target.offsetHeight) || 1)
          });
        }.bind(this),
        ref: 'log'
      }, this.state.logs.map(function(msg, index) {
        return React.createElement('li', {
          key: index,
          className: 'logs__item'
        }, msg);
      }))
    );
  },
  renderAdmin: function() {
    if (!this.props.admin) return null;
    return createElement('div', {
      className: 'danmu__admin'
    },
      createElement('div', {
        className: 'admin__item admin__item--voice'
      },
        createElement('button', {
          onClick: function() {
            this.setState(function(prevState) {
              return {
                adminVoiceVisible: !prevState.adminVoiceVisible
              };
            });
          }.bind(this)
        }, '语音设置'),
        this.state.adminVoiceVisible ? createElement('div', {
          onClick: function(event) {
            if (event.target !== event.currentTarget) return;
            this.setState({
              adminVoiceVisible: false
            });
          }.bind(this)
        }, createElement('ul', null,
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  voiceWelcome: !prevState.voiceWelcome
                }
              });
            }.bind(this)
          }, '语音欢迎：' + (this.state.voiceWelcome ? '开启' : '关闭')),
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  voiceChat: !prevState.voiceChat
                }
              });
            }.bind(this)
          }, '播放弹幕：' + (this.state.voiceChat ? '开启' : '关闭')),
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  baiduVoice: !prevState.baiduVoice
                }
              });
            }.bind(this)
          }, '百度语音API：' + (this.state.baiduVoice ? '开启' : '关闭')),
          this.state.baiduVoice ? [
            createElement('li', {
              key: 'VOICE_SPD'
            }, '语速: ', createElement('select', {
              value: this.state.voiceSpd,
              onChange: function(event) {
                this.setState({ voiceSpd: event.target.value })
              }.bind(this)
            }, VOICE_SPD.map(function(item, index) {
              return createElement('option', { key: item.value, value: item.value }, item.text);
            }))),
            createElement('li', {
              key: 'VOICE_PIT'
            }, '音调: ', createElement('select', {
              value: this.state.voicePit,
              onChange: function(event) {
                this.setState({ voicePit: event.target.value })
              }.bind(this)
            }, VOICE_PIT.map(function(item, index) {
              return createElement('option', { key: item.value, value: item.value }, item.text);
            }))),
            createElement('li', {
              key: 'VOICE_VOL'
            }, '音量: ', createElement('select', {
              value: this.state.voiceVol,
              onChange: function(event) {
                this.setState({ voiceVol: event.target.value })
              }.bind(this)
            }, VOICE_VOL.map(function(item, index) {
              return createElement('option', { key: item.value, value: item.value }, item.text);
            }))),
            createElement('li', {
              key: 'VOICE_PER'
            }, '发音人: ', createElement('select', {
              value: this.state.voicePer,
              onChange: function(event) {
                this.setState({ voicePer: event.target.value })
              }.bind(this)
            }, VOICE_PER.map(function(item, index) {
              return createElement('option', { key: item.value, value: item.value }, item.text);
            })))
          ] : null
        )) : null
      ),
      createElement('div', {
        className: 'admin__item admin__item--autoscroll'
      },
        createElement('button', {
          onClick: function() {
            this.setState(function(prevState) {
              return {
                adminAutoscrollVisible: !prevState.adminAutoscrollVisible
              };
            });
          }.bind(this)
        }, '滚屏设置'),
        this.state.adminAutoscrollVisible ?  createElement('div', {
          onClick: function(event) {
            if (event.target !== event.currentTarget) return;
            this.setState({
              adminAutoscrollVisible: false
            });
          }.bind(this)
        }, createElement('ul', null,
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  messagesLocked: !prevState.messagesLocked
                }
              });
            }.bind(this)
          }, '弹幕滚动：' + (this.state.messagesLocked ? '自由' : '锁定')),
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  giftsLocked: !prevState.giftsLocked
                }
              });
            }.bind(this)
          }, '礼物滚动：' + (this.state.giftsLocked ? '自由' : '锁定')),
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                return {
                  logsLocked: !prevState.logsLocked
                }
              });
            }.bind(this)
          }, '日志滚动：' + (this.state.logsLocked ? '自由' : '锁定'))
        )) : null
      ),
      createElement('div', {
        className: 'admin__item admin__item--other'
      },
        createElement('button', {
          onClick: function() {
            this.setState(function(prevState) {
              return {
                adminOtherVisible: !prevState.adminOtherVisible
              };
            });
          }.bind(this)
        }, '其他设置'),
        this.state.adminOtherVisible ?  createElement('div', {
          onClick: function(event) {
            if (event.target !== event.currentTarget) return;
            this.setState({
              adminOtherVisible: false
            });
          }.bind(this)
        }, createElement('ul', null,
          createElement('li', {
            onClick: function() {
              this.setState(function(prevState) {
                var sleep = !prevState.sleep;
                if (sleep) {
                  this.state.weak.disable();
                } else {
                  this.state.weak.enable();
                }
                return {
                  sleep: sleep
                }
              });
            }.bind(this)
          }, '屏幕锁定：' + (this.state.sleep ? '自动' : '常亮'))
        )) : null
      )
    );
  },
  renderNotice: function() {
    function content() {
      return createElement('ul', null,
        createElement('li', null, '直播内容 ->'),
        createElement('li', null, '前端/后端开发、产品/UI设计'),
        createElement('li', null, '程序员必备 ->'),
        createElement('li', null, '编辑器：Sublime Text 3'),
        createElement('li', null, '鼠标i：山业 SANWA SUPPLY MA-ERGW6'),
        createElement('li', null, '键盘：IKBC Poker II'),
        createElement('li', null, '眼贴/药水：好视力眼贴、santen 参天 FXNEO、santen 参天 beautyeye'),
        createElement('li', null, '膏药：万通筋骨贴')
      );
    }
    return createElement('div', {
      className: 'danmu__notice'
    }, content(), content())
  },
  render: function() {
    return createElement('div', {
        className: 'tool__danmu'
      },
      this.renderWelcomes(),
      this.renderGifts(),
      this.renderMessages(),
      this.renderLogs(),
      this.renderAdmin(),
      this.renderNotice(),
      createElement('div', {
        className: 'danmu__state danmu__state--' + this.props.state
      }, ['离线', '连接中', '在线'][this.props.state])
    );
  }
});
