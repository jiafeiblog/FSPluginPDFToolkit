<script setup lang="ts">
import { onMounted, ref, watch, reactive, computed, onBeforeMount } from 'vue'
import {
  bitable,
  FieldType,
  IAttachmentField,
  ICurrencyFieldMeta,
  IField,
  IRecord,
  ITable
} from '@lark-base-open/js-sdk'
import { PDFMerger } from './pdf-merger'

const ScopeMap: { table: ITable } = {
  table: null
}
// 所有的可用字段
const tableFieldList = ref<any[]>([])
const tableName = ref('')
const viewName = ref('')
const loading = ref(true)
const feildInfo = reactive<{
  originFields: string[]
  outputField: string
}>({
  originFields: [], // 选中的待合并的列
  outputField: ''
})

// 需要禁用已选的字段
const outputFieldList = computed(() => {
  const arr = tableFieldList.value.slice()
  const origins = feildInfo.originFields
  arr.map((item) => {
    if (origins.includes(item.value)) {
      item.disabled = true
    } else {
      item.disabled = false
    }
  })
  return arr
})

async function getTable() {
  loading.value = true
  const table = await bitable.base.getActiveTable()
  ScopeMap.table = table
  const name = await table.getName()
  tableName.value = name
  const view = await table.getActiveView()
  const vn = await view.getName()
  viewName.value = vn
  // 查询附件类型字段的元数据列表
  const fields = await table.getFieldMetaListByType(FieldType.Attachment)
  const arr = fields.map((item) => {
    return {
      label: item.name,
      value: item.id
    }
  })

  tableFieldList.value = arr
  loading.value = false
}

async function submit() {
  const arr = tableFieldList.value
  // 拿到源数据列 以及输出的列信息
  const originFieldList: IAttachmentField[] = []
  for (const item of feildInfo.originFields) {
    const field = await ScopeMap.table.getFieldById<IAttachmentField>(item)
    originFieldList.push(field)
  }
  const outpuField: IField = await ScopeMap.table.getFieldById(feildInfo.outputField)
  // 根据选中的字段id 查询每一列的数据 拿到附件pdf的链接
  const allResult = {
    hasMore: true,
    total: 0,
    pageToken: null,
    records: []
  }
  console.log('originFieldList', originFieldList)
  console.log('outpuField', outpuField)
  // 翻页读取所有的记录
  while (allResult.hasMore) {
    const res = await ScopeMap.table?.getRecords({
      pageSize: 5000,
      pageToken: allResult.pageToken
    })
    allResult.pageToken = res.pageToken
    allResult.hasMore = res.hasMore
    allResult.records = allResult.records.concat(res.records)
    allResult.total = res.total
  }
  // 筛选出记录中 outpuField 记录为空的数据 有数据了就不用更新了
  const originFieldIds = originFieldList.map((item) => item.id)
  const outputFieldId = outpuField.id
  const finalRecords: IRecord[] = allResult.records.filter((item: IRecord) => {
    const obj = item.fields[outputFieldId] as any
    return !obj || obj.length <= 0
  })
  console.log('allResult', allResult.records)
  console.log('filterRecords', finalRecords)
  // 遍历可用记录 下载pdf 做合并操作
  for (const item of finalRecords) {
    // 待保存的附件列表 此处合并后就一个文件
    const files = []
    const merge = new PDFMerger()
    const allUrls: string[] = []
    for (const f of originFieldList) {
      const attachmentUrls = await f.getAttachmentUrls(item.recordId)
      Array.prototype.push.apply(allUrls, attachmentUrls)
    }
    const mergedPdfBlob = await merge.mergePDFs(allUrls)
    // 取第一条url为新的pdf名称
    files.push(new File([mergedPdfBlob], allUrls[0]))
    // 上传文件保存记录

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(mergedPdfBlob);
    // 设置下载文件名
    downloadLink.download = 'mergedPdf.pdf'; 

    // 触发下载
    downloadLink.click();
    // outpuField.setValue(item.recordId, files)
    // 下载对应的pdf文件 合并为新的文件
    console.log('所有附件地址', allUrls)
  }
}

onBeforeMount(() => {
  // 获取多维表格的 列信息 仅限附件类型
  getTable()
})
</script>

<template>
  <div class="container">
    <div class="form-item">
      <n-grid x-gap="12" :cols="2">
        <n-gi>
          <div class="view-box-left">
            数据库：<n-tag type="info" size="small" round> {{ tableName }} </n-tag>
          </div>
        </n-gi>
        <n-gi>
          <div class="view-box-right">
            视图：<n-tag type="info" size="small" round> {{ viewName }} </n-tag>
          </div>
        </n-gi>
      </n-grid>
    </div>
    <n-form ref="formRef" :model="feildInfo">
      <n-form-item path="originField" label="选择源字段">
        <n-checkbox-group v-model:value="feildInfo.originFields">
          <n-space item-style="display: flex;" v-for="item in tableFieldList" :key="item.value">
            <n-checkbox :value="item.value" :label="item.label" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item path="outputField" label="选择输出字段">
        <n-select v-model:value="feildInfo.outputField" :options="outputFieldList" />
      </n-form-item>
      <n-form-item>
        <n-button attr-type="button" type="info" @click="submit"> 处理 </n-button>
      </n-form-item>
    </n-form>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  flex-wrap: wrap;
  padding: 15px;
  .form-item {
    padding-bottom: 15px;
  }
  .view-box-left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .view-box-right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}
</style>
