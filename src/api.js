import http from './http'

export default {
  queryList(data) {
    return http.get('/books/index', { data: data })
    // var CancelToken = http.CancelToken
    // var cancel

    // http.get('/books/index', {
    //   cancelToken: new CancelToken(function executor(c) {
    //     console.log('@@', c)
    //     // c的值如下：
    //     // ƒunction cancel(message) {
    //     //   if (token.reason) {
    //     //     // Cancellation has already been requested
    //     //     return;
    //     //   }

    //     //   token.reason = new Cancel(message);
    //     //   resolvePromise(token.reason);
    //     // }
    //     // executor 函数接收一个 cancel 函数作为参数
    //     cancel = c
    //   })
    // })

    // 取消请求
    // cancel()
  },
  postTest(data) {
    return http.post('/books/create', { data: data })
  },
  postTest400(data) {
    return http.post('/books/create400', { data: data })
  },
  notFoundApi(data) {
    return http.post('http://www.asdasdasd/books/create123', { data: data })
  }
}
