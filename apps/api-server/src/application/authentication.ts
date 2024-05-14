export type Authentication = {
  apiKey: {
    apiKey: string
    user: string
    isSuper: boolean
  }
  openId: {
    user: string
    persons: string[]
  }
}
