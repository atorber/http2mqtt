import crypto from 'crypto'

// 加密函数
export function encrypt (text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([ encrypted, cipher.final() ])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// 解密函数
export function decrypt (text: string, key: Buffer): string {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([ decrypted, decipher.final() ])
  return decrypted.toString()
}

export function getKey (): Buffer {
  return crypto.randomBytes(32) // 256 bits
}
