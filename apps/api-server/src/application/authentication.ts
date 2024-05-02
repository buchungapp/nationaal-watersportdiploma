export type Authentication = {
  apiKey: {
    apiKey: string
    user: string
  }
  openId: {
    user: string
    persons: string[]
  }
}
