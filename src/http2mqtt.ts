import { connect, Client, IClientOptions } from 'mqtt'

interface Options {
  header: {
    endpoint: string;
    username: string;
    password: string;
  };
  body: {
    pubTopic: string;
    subTopic: string;
    payload: any;
  };
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
      this.client.publish(
        this.options.body.pubTopic,
        JSON.stringify(this.options.body.payload),
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
