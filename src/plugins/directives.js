import Vue from 'vue'

const preventReClick = Vue.directive('preventReClick', {
  inserted: function(el, binding) {
    el.addEventListener('click', () => {
      if (!el.disabled) {
        el.disabled = true
        setTimeout(() => {
          el.disabled = false
        }, binding.value || 3000) // 传入绑定值就使用，默认3000毫秒内不可重复触发
      }
    })
  }
})

export { preventReClick }
