/* eslint-disable no-console */
import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import mqtt from 'mqtt'

import type { Header, Body } from '../src/http2mqtt.js'
import { decrypt, encrypt, getKey } from '../src//utils.js'

const app = new Koa()
const router = new Router()

app.use(bodyParser())

router.post('/mqtt', async (ctx) => {
  console.debug(JSON.stringify(ctx))
  const headers:Header = ctx.request.headers as unknown as Header
  const body:Body = ctx.request.body as unknown as Body

  const endpoint: string = headers.endpoint || ''
  const username: string = headers.username || ''
  const password: string = headers.password || ''

  const pubTopic: string = body.pubTopic || ''
  const subTopic: string = body.subTopic || ''
  const payload: any = body.payload || ''

  const client = mqtt.connect(`mqtt://${endpoint}`, {
    password,
    username,
  })

  let timeout: any

  return new Promise<void>((resolve) => {
    client.on('connect', () => {
      client.subscribe(subTopic, (err:any) => {
        if (err) {
          ctx.status = 500
          ctx.body = { error: 'Failed to subscribe to topic' }
          client.end()
          resolve()
          return
        }

        const payloadJsonstring = JSON.stringify(payload)
        const key = getKey()
        console.log(`key Text: ${key}`)
        const encryptedText = encrypt(payloadJsonstring, key)
        console.log(`Encrypted Text: ${encryptedText}`)
        const decryptedText = decrypt(encryptedText, key)
        console.log(`Decrypted Text: ${decryptedText}`)

        client.publish(pubTopic, encryptedText, (err) => {
          if (err) {
            ctx.status = 500
            ctx.body = { error: 'Failed to publish to topic' }
            client.end()
            resolve()

          }
        })

        timeout = setTimeout(() => {
          ctx.status = 408
          ctx.body = { error: 'Request timed out' }
          client.end()
          resolve()
        }, 10000) // 10 seconds
      })
    })

    client.on('message', (topic, message) => {
      if (topic === subTopic) {
        clearTimeout(timeout)
        ctx.body = {  error:'ok', message: message.toString() }
        client.end()
        resolve()
      }
    })

    client.on('error', (err) => {
      ctx.status = 500
      ctx.body = { error: err.message }
      client.end()
      resolve()
    })
  })
})

app.use(router.routes()).use(router.allowedMethods())

const PORT = process.env['PORT'] || 3000

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`)
})
