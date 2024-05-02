export type Authentication = {
  apiKey: {
    apiKey: number
    school: string
  }
  openId: {
    user: string
    persons: string[]
  }
}
