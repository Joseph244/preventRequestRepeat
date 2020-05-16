<template>
  <div id="app">
    <button v-preventReClick="3000" @click="queryList">查询</button>
    <button @click="postBtn">POST</button>
    <button @click="postBtn400">POST400</button>
    <button @click="notFoundBtn">notFoundBtn</button>
    <div>{{ tableData }}</div>
  </div>
</template>

<script>
import api from './api.js'
export default {
  name: 'App',
  data() {
    return {
      tableData: []
    }
  },
  methods: {
    queryList() {
      api.queryList({ test: 1233 }).then(res => {
        this.tableData = res
      })
    },
    postBtn() {
      api.postTest({ posttt: 2222 })
    },
    postBtn400() {
      api.postTest400({ posttt: 400 })
    },
    notFoundBtn() {
      api.notFoundApi({ aya: 666 }).then(res => {
        console.log(res)
      })
    }
  }
}
</script>
