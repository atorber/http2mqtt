import { connect, Client } from 'mqtt'

interface Options {
  endpoint: string;
  username: string;
  password: string;
  pubTopic: string;
  subTopic: string;
  payload: any;
}

export class Http2Mqtt {

  private responsePayload: any | null = null
  private client: Client
  private options: Options

  constructor (options: Options) {
    this.options = options
    this.client = connect(`mqtt://${options.endpoint}`, {
      password: options.password,
      username: options.username,
    })

    this.client.on('connect', () => {
      this.client.subscribe(options.subTopic, (err: Error | null) => {
        if (err) {
          console.error(err)
        }
      })
    })

    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === options.subTopic) {
        this.responsePayload = JSON.parse(message.toString())
      }
    })
  }

  async pubMsg (): Promise<any> {
    return new Promise((resolve) => {
      this.client.publish(this.options.pubTopic, JSON.stringify(this.options.payload))
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
