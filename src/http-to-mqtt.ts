/* eslint-disable sort-keys */
/* eslint-disable no-console */
import mqtt from 'mqtt'
import { decrypt, encrypt, getKey, DecryptedMessage } from './utils.js'
import jsonata from 'jsonata'
import { v4 } from 'uuid'

type MqttOptions = {
  endpoint: string;
  port?: number;
  username: string;
  password: string;
  clientid?: string;
  secretkey?: string;
}

// 定义接口：请求头部信息
type Headers = {
  [key:string]: string;
}

// 定义接口：请求查询参数
type Query = {
  requesttopic?: string;
  responsetopic?: string;
  convert?: string;
  [key:string]: string | undefined;
}

// 定义接口：请求体内容
type Body = {
  [key: string]: any;
}

// 定义接口：响应内容
type ResponsePayload = {
  status: number;
  body: any;
}

// 定义接口：请求选项
type Options = {
  headers: Headers;
  body: Body;
  query: Query;
  method:'POST'|'GET'|'PUT'|'DELETE';
  path: string;
}

// 主类：处理HTTP到MQTT的转换
class Http2Mqtt {

  private responsePayload: ResponsePayload = { body: {}, status: 200 }
  private ops: Options
  private mqttOps: MqttOptions
  private configOps: {
    requesttopic?: string;
    responsetopic?: string;
    convert?: string;
  }

  constructor (ops: Options) {
    this.mqttOps = {} as MqttOptions
    const headers = Object.fromEntries(
      Object.entries(ops.headers).map(([ key, value ]) => [ key.toLowerCase(), value ]),
    )
    if (headers['authorization']) {
      console.log('headers中包含authorization\n', headers)
      // 对Authorization头部进行解析，删除开头的Bearer ，并对token进行base64解密
      const authorization = headers['authorization'] as string
      const tokenJoin = authorization.split(' ')[1] as string
      let mqttToken = ''
      let token = ''
      if (tokenJoin.includes('http2mqtt')) {
        mqttToken = tokenJoin.split('http2mqtt')[0] || ''
        token = tokenJoin.split('http2mqtt')[1] || ''
        ops.headers['authorization'] = `Bearer ${token}`
      } else {
        mqttToken = tokenJoin
      }
      const decodedToken = Buffer.from(mqttToken, 'base64').toString('utf-8')
      console.log('decodedToken\n', decodedToken)
      this.mqttOps = Object.fromEntries(
        Object.entries(JSON.parse(decodedToken)).map(([ key, value ]) => [ key.toLowerCase(), value ]),
      ) as MqttOptions
    } else {
      ops.headers = headers as Headers
      this.mqttOps = headers as unknown as MqttOptions
    }
    const { requesttopic, responsetopic, convert } = ops.query
    this.configOps = {
      requesttopic, responsetopic, convert,
    }
    // ops.query = Object.fromEntries(
    //   Object.entries(ops.query).map(([ key, value ]) => [ key.toLowerCase(), value ]),
    // ) as Query

    if (ops.query.convert) delete ops.query.convert
    if (ops.query.requesttopic) delete ops.query.requesttopic
    if (ops.query.responsetopic) delete ops.query.responsetopic

    this.ops = ops
  }

  async pubMessage (): Promise<ResponsePayload> {
    console.debug('pubMessage this.ops\n', JSON.stringify(this.ops))
    const {
      endpoint = '',
      username = '',
      password = '',
      port = 1883,
      secretkey: key,
    } = this.mqttOps

    const { requesttopic, responsetopic, convert } = this.configOps
    let pubTopic = requesttopic || ''
    let subTopic = responsetopic || ''

    if (requesttopic === 'http2mqtt/test') {
      subTopic = 'http2mqtt/test'
      pubTopic = 'http2mqtt/test'
    }

    if (!pubTopic || !subTopic) {
      const reqId = v4()
      pubTopic = `http2mqtt/request/${reqId}`
      subTopic = `http2mqtt/response/${reqId}`
    }

    let payload: any = this.ops

    // 如果存在Convert参数，使用jsonata进行数据转换
    if (convert) {
      const expression = jsonata(convert)
      payload = await expression.evaluate(payload)
    }

    payload = JSON.stringify(payload)

    // 如果存在密钥，对消息进行加密
    if (key) {
      payload = JSON.stringify(encrypt(payload, key))
    }

    // 连接到MQTT服务器
    const client = mqtt.connect(`mqtt://${endpoint}:${port}`, {
      password,
      username,
    })

    return new Promise<ResponsePayload>((resolve) => {

      // 设置15秒超时
      const timeout: any = setTimeout(() => {
        this.responsePayload = {
          status: 408,
          body: { error: 'Request timed out' },
        }
        client.end()
        resolve(this.responsePayload)
      }, 15000)

      client.on('connect', () => {
        client.subscribe(subTopic, (err: any) => {
          if (err) {
            this.responsePayload = {
              status: 500,
              body: { error: 'Failed to subscribe to topic' },
            }
            client.end()
            resolve(this.responsePayload)
            return
          }

          client.publish(pubTopic, payload, (err) => {
            if (err) {
              this.responsePayload = {
                status: 500,
                body: { error: 'Failed to publish to topic' },
              }
              client.end()
              resolve(this.responsePayload)
            }
          })
        })
      })

      client.on('message', (topic, message) => {
        if (topic === subTopic) {
          let messageText = message.toString()

          // 如果存在密钥，对收到的消息进行解密
          if (key) {
            messageText = decrypt(JSON.parse(messageText) as DecryptedMessage, key)
          }

          clearTimeout(timeout)
          this.responsePayload = {
            body: JSON.parse(messageText),
            status: 200,
          }
          client.end()
          resolve(this.responsePayload)
        }
      })

      client.on('error', (err) => {
        this.responsePayload = {
          status: 500,
          body: { error: err.message },
        }
        client.end()
        resolve(this.responsePayload)
      })
    })
  }

}

export {
  Http2Mqtt,
  encrypt,
  decrypt,
  getKey,
}

export type {
  Body,
  Headers,
  Query, ResponsePayload,
  Options,
}
