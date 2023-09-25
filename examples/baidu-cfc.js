/* eslint-disable sort-keys */
const mqtt = require('mqtt')
const jsonata = require('jsonata')
const crypto = require('crypto')

const ALGORITHM = 'aes-256-cbc'

function encrypt (text, secretKey) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv)
  const encrypted = Buffer.concat([ cipher.update(text), cipher.final() ])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt (text, secretKey) {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift(), 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv)
  const decrypted = Buffer.concat([ decipher.update(encryptedText), decipher.final() ])
  return decrypted.toString()
}

exports.handler = async (event, context) => {
  const headers = event.headers
  const {
    Endpoint,
    Port,
    Username,
    Password,
    ClientID,
    RequestTopic,
    ResponseTopic,
    Convert,
    SecretKey,
  } = headers

  const requestBody = JSON.parse(event.body)

  // 使用jsonata转换数据
  const expression = jsonata(Convert)
  const transformedData = expression.evaluate(requestBody)

  // 如果设置了SecretKey，则加密数据
  const dataToSend = SecretKey ? encrypt(JSON.stringify(transformedData), SecretKey) : JSON.stringify(transformedData)

  // 连接到MQTT broker
  const client = mqtt.connect(`mqtt://${Endpoint}:${Port}`, {
    username: Username,
    password: Password,
    clientId: ClientID,
  })

  return new Promise((resolve, reject) => {
    let timeout

    client.on('connect', () => {
      client.subscribe(ResponseTopic, (err) => {
        if (err.message) {
          reject(new Error(JSON.stringify({
            statusCode: 500,
            body: `Failed to subscribe to ResponseTopic. Error: ${err.message}`,
          })))
          client.end()
          return
        }

        client.publish(RequestTopic, dataToSend, (err) => {
          if (err) {
            reject(new Error(JSON.stringify({
              statusCode: 500,
              body: `Failed to publish to RequestTopic. Error: ${err.message}`,
            })))
            client.end()
          }
        })

        timeout = setTimeout(() => {
          reject(new Error(JSON.stringify({
            statusCode: 408,
            body: 'Request timed out after 10 seconds without receiving a message from ResponseTopic.',
          })))
          client.end()
        }, 10000)
      })
    })

    client.on('message', (topic, message) => {
      if (topic === ResponseTopic) {
        clearTimeout(timeout)
        const decryptedMessage = SecretKey ? decrypt(message.toString(), SecretKey) : message.toString()
        resolve({
          statusCode: 200,
          body: `Received message from ResponseTopic: ${decryptedMessage}`,
        })
        client.end()
      }
    })

    client.on('error', (err) => {
      reject(new Error(JSON.stringify({
        statusCode: 500,
        body: `MQTT error occurred: ${err.message}`,
      })))
      client.end()
    })
  })
}
