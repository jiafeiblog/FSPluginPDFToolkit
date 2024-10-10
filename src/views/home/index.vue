<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { bitable, FieldType, IAttachmentField, ICurrencyFieldMeta } from '@lark-base-open/js-sdk'
import { PDFMerger } from './pdf-merger'

const tableFieldList = ref(null)
const loading = ref(true)

async function getTable() {
  loading.value = true
  const table = await bitable.base.getActiveTable()
  // 查询附件类型字段的元数据列表
  const fields = await table.getFieldMetaListByType(FieldType.Attachment)
  console.log('temps', fields)

  tableFieldList.value = fields
  loading.value = false
}

onMounted(() => {
  // 获取多维表格的 列信息 仅限附件类型
  getTable()
})

function submit() {
  const arr = tableFieldList.value
  // 1、查询每一列的数据 拿到附件pdf的链接
  // 2、下载pdf
  // 3、合并所有的pdf文件
  // 4、合并后的文件上传为新链接
}
</script>

<template>
  <div>haha {{ loading }} {{ tableFieldList }}</div>
</template>

<style lang="scss" scoped></style>
