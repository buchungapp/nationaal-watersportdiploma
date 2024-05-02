export type Authentication = {
  apiKey: {
    apiKey: number
    school: string
  }
  openId: {
    user: string
    people: string[]
  }
}
