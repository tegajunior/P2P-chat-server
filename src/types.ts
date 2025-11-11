export interface User {
  _id?: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
}

export interface Message {
  senderId: string
  receiverId: string
  content: string
  timestamp: number
  delivered?: boolean
}

export type DmPayload = {
  from: string
  to: string
  text: string
  ts: number
  clientId?: string
  fromUser?: any
}
