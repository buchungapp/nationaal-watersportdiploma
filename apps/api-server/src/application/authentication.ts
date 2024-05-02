export type Authentication = {
  apiKey: {
    apiKey: string
    location: string
  }
  openId: {
    user: string
    persons: string[]
  }
}
