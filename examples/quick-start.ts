/* eslint-disable no-console */
import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'

import { type Headers, type Body, Http2Mqtt, type ResponsePayload } from '../src/http2mqtt.js'

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
