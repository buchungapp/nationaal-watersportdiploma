export type Authentication = {
  apiKey: {
    apiKey: string
    user: string
    isSuper: boolean
  }
  openId: {
    userId: string
    personIds: string[]
    locationIds: string[]
  }
}
