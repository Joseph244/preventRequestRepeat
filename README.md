1.自定义指令 directive
思路： 点击之后当前按钮一定时间内（例如：setTimeout 1000ms）不可以再次被点击，相当于节流；
但是如果一个请求 1000ms 以上还没有返回，那么再次点击就会触发新的请求了。
添加自定义文件 directives.js
import Vue from 'vue'

const preventReClick = Vue.directive('preventReClick', {
inserted: function(el, binding) {
el.addEventListener('click', () => {
if (!el.disabled) {
el.disabled = true
setTimeout(() => {
el.disabled = false
}, binding.value || 3000) // 传入绑定值就使用，默认 3000 毫秒内不可重复触发
}
})
}
})

export { preventReClick }
在 main.js 中引用
import preventReClick from './plugins/directives.js' //防多次点击，重复提交
在按钮上添加 v-preventReClick
// 指定延迟 1000ms
<el-button size="small" type="primary" @click="handleSave()" v-preventReClick="1000">保 存</el-button>

// 默认延迟时间 3000
<el-button size="small" type="primary" @click="handleSave()" v-preventReClick>保 存</el-button>

2.请求队列与 axios.CancelToken 取消请求
补充知识点——Axios 的 cancel
Axios 的 cancel token API 基于 cancelable promises proposal
。
可以使用 CancelToken.source 工厂方法创建 cancel token，像这样：

var CancelToken = axios.CancelToken;
var source = CancelToken.source();

axios.get('/user/12345', {
cancelToken: source.token
}).catch(function(thrown) {
if (axios.isCancel(thrown)) {
console.log('Request canceled', thrown.message);
} else {
// 处理错误
}
});

// 取消请求（message 参数是可选的）
source.cancel('Operation canceled by the user.');
还可以通过传递一个 executor 函数到 CancelToken 的构造函数来创建 cancel token：

var CancelToken = axios.CancelToken;
var cancel;

axios.get('/user/12345', {
cancelToken: new CancelToken(function executor(c) {
// executor 函数接收一个 cancel 函数作为参数
cancel = c;
})
});

// 取消请求
cancel();
Note : 可以使用同一个 cancel token 取消多个请求

思路：请求中（pending 状态，服务端还未返回结果之前）的接口存储一个请求队列，请求返回之后就从队列中删除；如果正在请求中，那么相同请求再次被触发也不会调用后台，而是被 cancel；
这个只能在前一次请求服务端未返回结果时候阻止继续请求。
代码更新于 2020-05-16 10:30

import Axios from 'axios'
const baseURL = 'http://rap2.taobao.org:38080/app/mock/238367/' // 后台 baseUrl

const axios = Axios.create({
baseURL: baseURL,
timeout: 30000
})
const pending = [] // 声明一个数组用于存储每个 ajax 请求的队列
const cancelToken = Axios.CancelToken // 初始化取消请求的构造函数
let arr = [] // 区分是请求还是响应的头部

/\*\*

- @param {请求体信息} config
- @param {直接执行的 cancel 函数，执行即可取消请求} f
  \*/
  const removePending = (config, f) => {
  arr = config.url.split(baseURL)
  arr = arr[arr.length - 1]
  const flagUrl = arr + '&' + config.method // 每次请求存储在请求中队列的元素关键值,例如：一个地址为 books/create 的 post 请求处理之后为："books/create&post"

// 当前请求存在队列中，取消第二次请求
if (pending.indexOf(flagUrl) !== -1) {
if (f) {
// f 为实例化的 cancelToken 函数
f()
} else {
pending.splice(pending.indexOf(flagUrl), 1) // cancelToken 不存在，则从队列中删除该请求
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
// 由于表单提交都使用 post 请求，此处只对 post 做处理；具体情况要结合业务需要
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

大家在测试的时候如果会自己搭建后台服务，写几个测试接口，接口返回的时候做延迟可以看到效果；否则服务端接口返回速度很快的话是很难看到效果的；
更简单一点，也可以将浏览器的 network 速度调整到 slow 3G，这样网络速度比较慢，也容易看到效果如图：

切换好网络之后，疯狂点击 POST 按钮，发现只有请求返回结束的时候下一次请求才会被发起。
使用 vue-cli 做的完整测试代码见本人 github：

3.其他情况
这部分参考知乎作者：长天之云，感谢分享，原地址

不推荐用外部变量锁定或修改按钮状态的方式，因为那样比较难：
要考虑并理解 success, complete, error, timeout 这些事件的区别，并注册正确的事件，一旦失误，功能将不再可用；
不可避免地比普通流程要要多注册一个 complete 事件；
恢复状态的代码很容易和不相干的代码混合在一起；

我推荐用主动查询状态的方式（A、B，jQuery 为例）或工具函数的方式（C、D）来去除重复操作，并提供一些例子作为参考：

A. 独占型提交
只允许同时存在一次提交操作，并且直到本次提交完成才能进行下一次提交。
module.submit = function() {
if (this.promise*.state() === 'pending') {
return
}
return this.promise* = \$.post('/api/save')
}
B. 贪婪型提交
无限制的提交，但是以最后一次操作为准；亦即需要尽快给出最后一次操作的反馈，而前面的操作结果并不重要。
module.submit = function() {
if (this.promise*.state() === 'pending') {
this.promise*.abort()
}
// todo
}
比如某些应用的条目中，有一些进行类似「喜欢」或「不喜欢」操作的二态按钮。如果按下后不立即给出反馈，用户的目光焦点就可能在那个按钮上停顿许久；如果按下时即时切换按钮的状态，再在程序上用 abort 来实现积极的提交，这样既能提高用户体验，还能降低服务器压力，皆大欢喜。

C. 节制型提交
无论提交如何频繁，任意两次有效提交的间隔时间必定会大于或等于某一时间间隔；即以一定频率提交。
module.submit = throttle(150, function() {
// todo
})
如果客户发送每隔 100 毫秒发送过来 10 次请求，此模块将只接收其中 6 个（每个在时间线上距离为 150 毫秒）进行处理。
这也是解决查询冲突的一种可选手段，比如以知乎草稿举例，仔细观察可以发现：
编辑器的 blur 事件会立即触发保存；
保存按钮的 click 事件也会立即触发保存；
但是存在一种情况会使这两个事件在数毫秒内连续发生——当焦点在编辑器内部，并且直接去点击保存按钮——这时用 throttle 来处理是可行的。
另外还有一些事件处理会很频繁地使用 throttle，如： resize、scroll、mousemove。

D. 懒惰型提交
任意两次提交的间隔时间，必须大于一个指定时间，才会促成有效提交；即不给休息不干活。
module.submit = debounce(150, function() {
// todo
})
还是以知乎草稿举例，当在编辑器内按下 ctrl + s 时，可以手动保存草稿；如果你连按，程序会表示不理解为什么你要连按，只有等你放弃连按，它才会继续。
