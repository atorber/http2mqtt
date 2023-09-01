/* eslint-disable no-console */
import mqtt from 'mqtt'
import { decrypt, encrypt, getKey } from './utils.js'

export interface Headers {
    endpoint: string;
    port?:number;
    username: string;
    password: string;
}

export interface Body {
    pubTopic: string;
    subTopic: string;
    payload: any;
}

export interface ResponsePayload {
  status: number;
  body: any;
}

export interface Options {
  headers: Headers;
  body: Body;
}

export class Http2Mqtt {

  private headers:Headers
  private body:Body
  private responsePayload!: ResponsePayload

  constructor (ops:Options) {
    this.headers = ops.headers
    this.body = ops.body
    this.responsePayload = { body:{}, status:200 }
  }

  async pubMessage () {
    const endpoint: string = this.headers.endpoint || ''
    const username: string = this.headers.username || ''
    const password: string = this.headers.password || ''
    const port:number = this.headers.port || 1883

    const pubTopic: string = this.body.pubTopic || ''
    const subTopic: string = this.body.subTopic || this.body.pubTopic || ''
    const payload: any = this.body.payload || ''

    const client = mqtt.connect(`mqtt://${endpoint}:${port}`, {
      password,
      username,
    })

    let timeout: any

    return new Promise<ResponsePayload>((resolve) => {
      client.on('connect', () => {
        client.subscribe(subTopic, (err:any) => {
          if (err) {
            this.responsePayload.status = 500
            this.responsePayload.body = { error: 'Failed to subscribe to topic' }
            client.end()
            resolve(this.responsePayload)
            return
          }

          const payloadJsonstring = JSON.stringify(payload)
          const key = getKey()
          console.log(`key Text: ${key}`)
          const encryptedText = encrypt(payloadJsonstring, key)
          // console.log(`Encrypted Text: ${encryptedText}`)
          // const decryptedText = decrypt(encryptedText, key)
          // console.log(`Decrypted Text: ${decryptedText}`)

          client.publish(pubTopic, encryptedText, (err) => {
            if (err) {
              this.responsePayload.status = 500
              this.responsePayload.body = { error: 'Failed to publish to topic' }
              client.end()
              resolve(this.responsePayload)

            }
          })

          timeout = setTimeout(() => {
            this.responsePayload.status = 408
            this.responsePayload.body = { error: 'Request timed out' }
            client.end()
            resolve(this.responsePayload)
          }, 10000) // 10 seconds
        })
      })

      client.on('message', (topic, message) => {
        if (topic === subTopic) {
          clearTimeout(timeout)
          this.responsePayload.body = {  error:'ok', message: message.toString() }
          client.end()
          resolve(this.responsePayload)
        }
      })

      client.on('error', (err) => {
        this.responsePayload.status = 500
        this.responsePayload.body = { error: err.message }
        client.end()
        resolve(this.responsePayload)
      })
    })
  }

}

export {
  encrypt,
  decrypt,
  getKey,
}
