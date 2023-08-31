# http2mqtt

## 简介

使用http请求同步发送mqtt消息

## 快速开始

```
/* eslint-disable no-console */
import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'

import { type Headers, type Body, Http2Mqtt, type ResponsePayload } from '../src/http-to-mqtt.js'

const app = new Koa()
const router = new Router()

app.use(bodyParser())

router.post('/mqtt', async (ctx) => {
  console.debug(JSON.stringify(ctx))
  const headers:Headers = ctx.request.headers as unknown as Headers
  const body:Body = ctx.request.body as unknown as Body

  const http2mqtt = new Http2Mqtt({ body, headers })
  const res:ResponsePayload = await http2mqtt.pubMessage()

  ctx.status = res.status
  ctx.body = res.body
})

app.use(router.routes()).use(router.allowedMethods())

const PORT = process.env['PORT'] || 3000

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`)
})

```

启动服务

```
npm run quick
```

发起http请求

- 完整路径

127.0.0.1:3000/mqtt

- method

POST

- path

/mqtt

- headers

``` JSON
{
    "endpoint":"broker.emqx.io",
    "port":1883,
    "username":"",
    "password":""
}
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

## 历史版本

### main v0.2.0

1. 构建流水线自动发包

### v0.0.1 (2023-8-31)

1. 初始化创建代码库及npm包

## Copyright & License

- Code & Docs © 2020 Wechaty Contributors <https://github.com/wechaty>
- Code released under the Apache-2.0 License
- Docs released under Creative Commons
