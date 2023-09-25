/* eslint-disable no-console */
import express from 'express'
import bodyParser from 'body-parser'

import { Headers, Body, Http2Mqtt, ResponsePayload, Query } from '../src/http-to-mqtt.js'

const app = express()

// 使用bodyParser中间件处理请求体
app.use(bodyParser.json())

// 包装函数，用于处理异步路由处理程序中的错误
function asyncHandler (fn: Function) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

app.post('/mqtt', asyncHandler(async (req: { headers: { [s: string]: unknown } | ArrayLike<unknown>; body: Body; query: unknown }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: any): void; new(): any } } }) => {
  // 将请求的上下文打印到控制台，方便调试
  console.debug('Request Headers:', req.headers)
  console.debug('Request Body:', req.body)

  // 将请求头部的键转换为小写，以确保统一性
  const headers: Headers = Object.fromEntries(
    Object.entries(req.headers).map(([ key, value ]) => [ key.toLowerCase(), value ]),
  ) as unknown as Headers

  const body: Body = req.body as Body
  const query: Query = req.query as unknown as Query

  // 打印整合后的操作参数，方便调试
  console.debug('Operations:', JSON.stringify({ body, headers, query }))

  // 使用Http2Mqtt类处理请求
  const http2mqtt = new Http2Mqtt({ body, headers, query })
  const responsePayload: ResponsePayload = await http2mqtt.pubMessage()

  // 设置响应的状态码和主体
  res.status(responsePayload.status).json(responsePayload.body)
}))

// 从环境变量中获取端口号，如果没有定义，则默认为3001
const PORT = process.env['PORT'] || 3001

// 启动Express服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
