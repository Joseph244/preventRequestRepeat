import Axios from 'axios'
const baseURL = 'http://rap2.taobao.org:38080/app/mock/238367/' // 后台baseUrl

const axios = Axios.create({
  baseURL: baseURL,
  timeout: 30000
})
const pending = [] // 声明一个数组用于存储每个ajax请求的队列
const cancelToken = Axios.CancelToken // 初始化取消请求的构造函数
let arr = [] // 区分是请求还是响应的头部

/**
 * @param {请求体信息} config
 * @param {直接执行的cancel函数，执行即可取消请求} f
 */
const removePending = (config, f) => {
  arr = config.url.split(baseURL)
  arr = arr[arr.length - 1]
  const flagUrl = arr + '&' + config.method // 每次请求存储在请求中队列的元素关键值,例如：一个地址为books/create的post请求处理之后为："books/create&post"

  // 当前请求存在队列中，取消第二次请求
  if (pending.indexOf(flagUrl) !== -1) {
    if (f) {
      // f为实例化的cancelToken函数
      f()
    } else {
      pending.splice(pending.indexOf(flagUrl), 1) // cancelToken不存在，则从队列中删除该请求
    }
  } else {
    // 当前请求不在队列中，就加进队列
    if (f) {
      pending.push(flagUrl)
    }
  }
}
// 添加请求拦截器
axios.interceptors.request.use(
  config => {
    if (config.method === 'post') {
      // 由于表单提交都使用post请求，此处只对post做处理；具体情况要结合业务需要
      config.cancelToken = new cancelToken(c => {
        removePending(config, c)
      })
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(response => {
  if (response.config.method === 'post') {
    removePending(response.config)
  }
})

export default axios
