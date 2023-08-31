# http2mqtt

## Introduction

使用http请求同步发送mqtt消息

## quick strat

- headers

``` JSON
    endpoint: string;
    port?:number;
    username: string;
    password: string;
```

- body

```JSON
{
    "pubTopic":"pubTopic",
    "subTopic":"pubTopic",
    "payload":{
        "a":10011112
    }
}
```

## Requirements

## History

### master v1.0

1. Add `SourceToTargetRoomConnector` to connect a source room to a target room by forward messages to target room.
1. Support ES Modules
    1. Deprecated `EventHotHandler` due to ESM
1. Change `MessageAwaiter` plugin to `messagePrompter` helper function. ([#60](https://github.com/wechaty/plugin-contrib/issues/60))

### v0.14 master

1. Add `types.SayableMessage` and `types.toSayableMessage`
1. Normalize config option:
    1. `dm` renamed to `contact`
    1. `at` renamed to `mention`

### v0.10 (Jun 14, 2020)

1. Export `talkers.*`, `finders.*`, and `matchers.*`
1. Add [Mustache](https://github.com/janl/mustache.js) template & view support for all talkers.
1. Add `mappers.messageMapper()`
1. Add `matcher.languageMatcher()`

### v0.8 (Jun 13, 2020)

Add more helper utility functions.

1. Matchers: `RoomMatcher`, `ContactMatcher`, `MessageMatcher`
1. Talkers: `RoomTalker`, `ContactTalker`, `MessageTalker`
1. Finders: `RoomFinder`, `ContactFinder`

### v0.6 (Jun 9, 2020)

1. New Plugins: `OneToManyRoomConnector`, `ManyToOneRoomConnector`, and `ManyToManyRoomConnector`.
1. New Plugin: `FriendshipAccepter` for setting to accept friendship automatically.
1. New Plugin: `RoomInviter` for invite user to rooms with `password`, `rule`, and `welcome` options support.
1. New Plugin: `EventHotHandler` for hot reloading event handler module files.

### v0.4 (May 2020)

1. New plugin: `ChatOps`: forward all DM & Mention messages to a Room for logging.

### v0.2 (May 2020)

Added the following Wechaty Plugins:

1. DingDong
1. EventLogger
1. QRCodeTerminal
1. Heartbeat

### v0.0.1 (Apr 2020)

The `wechaty-plugin-contrib` project was kicked off by the issue [Wechaty Plugin Support with Kickout Example #1939](https://github.com/wechaty/wechaty/issues/1939) and the PR [feat: added wechaty plugin #1946](https://github.com/wechaty/wechaty/pull/1946).

## Copyright & License

- Code & Docs © 2020 Wechaty Contributors <https://github.com/wechaty>
- Code released under the Apache-2.0 License
- Docs released under Creative Commons
