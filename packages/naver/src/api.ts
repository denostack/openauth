
export interface NaverApiResult<TData> {
  resultcode: '00'
  message: 'success'
  response: TData
}

export interface NidMe {
  id: string
  email: string
  name: string
}
