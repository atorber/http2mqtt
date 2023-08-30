import { connect, Client, IClientOptions } from 'mqtt'
import { decrypt, encrypt, getKey } from './utils.js'

export interface Header {
    endpoint: string;
    username: string;
    password: string;
}

export interface Body {
    pubTopic: string;
    subTopic: string;
    payload: any;
}

export interface Options {
  header: Header;
  body: Body;
}

export class Http2Mqtt {

  private responsePayload: any | null = null
  private client: Client
  private options: Options

  constructor (options: Options) {
    this.options = options
    this.client = connect(`mqtt://${options.header.endpoint}`, {
      password: options.header.password,
      username: options.header.username,
    } as IClientOptions)

    this.client.on('connect', () => {
      this.client.subscribe(options.body.subTopic, (err: Error | null) => {
        if (err) {
          console.error(err)
        }
      })
    })

    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === options.body.subTopic) {
        this.responsePayload = JSON.parse(message.toString())
      }
    })
  }

  public async pubMsg (): Promise<any> {
    return new Promise((resolve) => {
      const payload = JSON.stringify(this.options.body.payload)
      const key = getKey()
      const encryptedText = encrypt(payload, key)
      // console.log(`Encrypted Text: ${encryptedText}`)
      const decryptedText = decrypt(encryptedText, key)
      // console.log(`Decrypted Text: ${decryptedText}`)
      this.client.publish(
        this.options.body.pubTopic,
        encryptedText,
      )

      const intervalId = setInterval(() => {
        if (this.responsePayload !== null) {
          clearInterval(intervalId)
          resolve(this.responsePayload)
        } else {
          resolve('超时了')
        }
      }, 100)
    })
  }

}

export class Http2Mqtt2 {

  private header:Header
  private body:Body
  private responsePayload: any | null = null

  constructor (ops:Options) {
    this.header = ops.header
    this.body = ops.body
  }

  async pubMessage () {
    const { endpoint, username, password } = this.header
    const { pubTopic, subTopic, payload } = this.body
    const client = connect(endpoint, {
      password,
      username,
    })
    client.on('connect', () => {
      client.subscribe(subTopic, (err:any) => {
        if (err) {
          this.responsePayload = { error: 'Failed to subscribe to topic' }
          client.end()
          return this.responsePayload
        }

        client.publish(pubTopic, payload, (err) => {
          if (err) {
            this.responsePayload = { error: 'Failed to publish to topic' }
            client.end()
          }
        })

        const timeout = setTimeout(() => {
          this.responsePayload = { error: 'Request timed out' }
          client.end()
        }, 10000) // 10 seconds

        client.on('message', (topic, message) => {
          if (topic === subTopic) {
            clearTimeout(timeout)
            const messageJson = JSON.parse(message.toString())
            this.responsePayload = { message:messageJson }
            client.end()
            return this.responsePayload
          }
        })
      })
    })

    client.on('error', (err) => {
      this.responsePayload = { error: err.message }
      client.end()
      return this.responsePayload
    })
  }

}
