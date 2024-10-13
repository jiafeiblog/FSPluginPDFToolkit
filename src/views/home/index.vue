<script setup lang="ts">
import { onMounted, ref, watch, reactive, computed, onBeforeMount } from 'vue'
import {
  bitable,
  FieldType,
  IAttachmentField,
  ICurrencyFieldMeta,
  IField,
  ILookupField,
  IOpenAttachment,
  IRecord,
  ITable
} from '@lark-base-open/js-sdk'
import { useMessage, useDialog } from 'naive-ui'
import { getLookupValueByFieldKey, getRecordsListByTablePop } from '../../common/utils'
import { PDFMerger } from './pdf-merger'

const ScopeMap: { table: ITable } = {
  table: null
}
// 所有的可用字段
const tableFieldList = ref<any[]>([])
const tableName = ref('')
const viewName = ref('')
const feildInfo = reactive<{
  originFields: string[]
  outputField: string
}>({
  originFields: [], // 选中的待合并的列
  outputField: ''
})

const message = useMessage()
const dialog = useDialog()
// 处理进度
const processInfo = reactive<{
  total: number // 全部
  processed: number // 已处理
  successNum: number
  errorNum: number
  loading: boolean
  loadLabel: string
}>({
  total: 0,
  processed: 0,
  successNum: 0,
  errorNum: 0,
  loading: false,
  loadLabel: ''
})

// 需要禁用已选的字段 并且输出字段只允许附件类型
const outputFieldList = computed(() => {
  const arr = tableFieldList.value.slice()
  const origins = feildInfo.originFields
  arr.map((item) => {
    if (origins.includes(item.value)) {
      item.disabled = true
    } else {
      item.disabled = false
    }
    if (item.type !== FieldType.Attachment) {
      item.disabled = true
    }
  })
  return arr
})

watch(
  () => feildInfo.originFields,
  () => {
    console.log('feildInfo.originFields', feildInfo.originFields)
    feildInfo.outputField = ''
  }
)
// 获取多维表格信息
async function getTable() {
  processInfo.loading = true
  processInfo.loadLabel = '表格元数据加载中'
  const table = await bitable.base.getActiveTable()
  ScopeMap.table = table
  const name = await table.getName()
  tableName.value = name
  const view = await table.getActiveView()
  const vn = await view.getName()
  viewName.value = vn
  // 查询附件类型字段的元数据列表
  // const fields = await table.getFieldMetaListByType(FieldType.Attachment)
  // 根据当前视图 查询字段元数据 不然顺序可能会有问题
  const fielsSort = await view.getFieldMetaList()
  // 筛选出附件类型 查找引用类型
  const types = [FieldType.Attachment, FieldType.Lookup]
  const resultFields = fielsSort.filter((i) => {
    return types.includes(i.type)
  })
  const arr = resultFields.map((item) => {
    return {
      label: item.name,
      type: item.type,
      value: item.id
    }
  })

  tableFieldList.value = arr
  processInfo.loading = false
  processInfo.loadLabel = ''
}

function handleValidate() {
  if (feildInfo.originFields.length <= 0) {
    message.warning('请选择源字段')
    return false
  } else if (!feildInfo.outputField) {
    message.warning('请选择输出字段')
    return false
  }
  return true
}

// 更具fieldKey和record获取那一列的数据 仅限附件类型
function getValueByFieldKey(field: IRecord, key: string) {
  const fileNames = []
  const objs = field.fields[key] as IOpenAttachment[]
  if (objs && objs?.length > 0) {
    const arr = objs.map((i) => i.name)
    Array.prototype.push.apply(fileNames, arr)
  }
  return fileNames
}

async function handleRecords(selectRecordIds: string[]) {
  processInfo.loading = true
  processInfo.loadLabel = '正在读取源字段'
  // 将源字段排序处理好
  const tempFields = tableFieldList.value
  const filterOriginFields = []
  for (const item of tempFields) {
    if (feildInfo.originFields.includes(item.value)) {
      filterOriginFields.push(item.value)
    }
  }
  console.log('filterOriginFields', filterOriginFields)

  // 拿到源数据列 以及输出的列信息
  const originFieldList: IField[] = []
  for (const item of filterOriginFields) {
    const field = await ScopeMap.table.getFieldById(item)
    originFieldList.push(field)
  }
  processInfo.loadLabel = '正在读取输出字段'
  const outpuField: IField = await ScopeMap.table.getFieldById(feildInfo.outputField)
  // 根据选中的字段id 查询每一列的数据 拿到附件pdf的链接
  const allResult = {
    // hasMore: true,
    total: 0,
    // pageToken: null,
    records: []
  }
  processInfo.loadLabel = '正在读取多维表数据'
  for (const id of selectRecordIds) {
    const info = await ScopeMap.table.getRecordById(id)
    // @ts-ignore
    info.recordId = id
    allResult.records.push(info)
    allResult.total += 1
  }
  // let ticket = 0
  // while (allResult.hasMore) {
  //   if (ticket > 100000) {
  //     // 防止意料之外的死循环
  //     return
  //   }
  //   ticket++
  //   const res = await ScopeMap.table?.getRecords({
  //     pageSize: 5000,
  //     pageToken: allResult.pageToken
  //   })
  //   allResult.pageToken = res.pageToken
  //   allResult.hasMore = res.hasMore
  //   allResult.total = res.total
  //   if (res.total) {
  //     allResult.records = allResult.records.concat(res.records)
  //   }
  // }
  // if (allResult.total <= 0) {
  //   processInfo.loading = false
  //   message.warning('多维表数据为空，不可操作')
  //   return
  // }
  // // 排序调整
  // allResult.records.reverse()

  // 筛选出记录中 outpuField 记录为空的数据 有数据了就不用更新了
  const originFieldIds = originFieldList.map((item) => item.id)
  const outputFieldId = outpuField.id
  const finalRecords: IRecord[] = allResult.records.filter((item: IRecord) => {
    const obj = item.fields[outputFieldId] as any
    const outputStatus = !obj || obj.length <= 0
    // 输出字段不为空 就跳过
    if (!outputStatus) {
      return false
    }

    // 取出所有的文件名称
    const fileNames: string[] = []
    originFieldIds.map((key) => {
      const arr = getValueByFieldKey(item, key)
      Array.prototype.push.apply(fileNames, arr)
    })
    if (fileNames.length <= 0) {
      // 源字段的值为空 跳过这一行
      return false
    }
    // 如果有一个名称不是pdf文件 就跳过这一行
    const unPdfs = fileNames.filter((i) => !i.endsWith('.pdf'))
    if (unPdfs.length > 0) {
      // 检测到有其他类型的文件 跳过这一行
      return false
    }

    return true
  })

  processInfo.loading = false

  const handle = async () => {
    processInfo.successNum = 0
    processInfo.errorNum = 0
    processInfo.processed = 0
    processInfo.total = 0

    processInfo.total = finalRecords.length
    processInfo.loading = true
    processInfo.loadLabel = `处理进度 ${processInfo.processed}/${processInfo.total}`
    const errorRecordIds: string[] = []
    // 遍历可用记录 下载pdf 做合并操作
    for (const item of finalRecords) {
      // 待保存的附件列表 此处合并后就一个文件
      try {
        const files = []
        const merge = new PDFMerger()
        const allUrls: string[] = []
        scendFor: for (const f of originFieldList) {
          // 判断这列有没有值
          const tempFileNames = getValueByFieldKey(item, f.id)
          if (tempFileNames.length <= 0) {
            continue scendFor
          }
          let attachmentUrls: string[] = []
          const t = await f.getType()
          if (t === FieldType.Attachment) {
            const af = f as IAttachmentField
            attachmentUrls = await af.getAttachmentUrls(item.recordId)
          } else {
            const lf = f as ILookupField
            // 查找应用类型 需要独立查询
            attachmentUrls = await getLookupValueByFieldKey(item, lf.id)
            console.log('引用类型', attachmentUrls)
          }

          Array.prototype.push.apply(allUrls, attachmentUrls)
        }
        const mergedPdfBlob = await merge.mergePDFs(allUrls)
        files.push(new File([mergedPdfBlob], 'mergedAll.pdf'))
        // 上传文件保存记录
        outpuField.setValue(item.recordId, files)
        processInfo.successNum += 1
      } catch (err) {
        errorRecordIds.push(item.recordId)
        processInfo.errorNum += 1
        message.error(err.message)
        console.error('error:', err)
      }
      processInfo.processed += 1
      processInfo.loadLabel = `处理进度 ${processInfo.processed}/${processInfo.total}`
      await new Promise(function (resolve) {
        setTimeout(() => {
          resolve(null)
        }, 200)
      })
    }
    processInfo.loading = false
    processInfo.loadLabel = '处理完成'
    let errMsg = ''
    const msg = `总共处理${finalRecords.length}条记录，执行成功${processInfo.successNum}条`
    if (processInfo.errorNum) {
      errMsg = errorRecordIds.length > 0 ? `；执行失败${processInfo.errorNum}条` : ''
    }
    dialog.info({
      title: '信息提示',
      content: `${msg}${errMsg}`,
      onClose: () => {
        processInfo.successNum = 0
        processInfo.errorNum = 0
        processInfo.processed = 0
        processInfo.total = 0
      }
    })
  }

  if (finalRecords.length) {
    dialog.info({
      title: '信息提示',
      content: `总共${finalRecords.length}条记录可处理，是否确认`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        handle()
      }
    })
  } else {
    dialog.warning({
      title: '信息提示',
      content: '当前多维表可处理数据条数为0',
      positiveText: '确定'
    })
  }
}

async function singleSubmit() {
  if (!handleValidate()) {
    return
  }
  const table = ScopeMap.table
  const view = await table.getActiveView()
  const recordIds = await getRecordsListByTablePop(table.id, view.id)
  handleRecords(recordIds)
}

onBeforeMount(() => {
  // 获取多维表格的 列信息 仅限附件类型
  getTable()
})
</script>

<template>
  <div class="container">
    <div style="margin-bottom: 15px">
      <n-alert title="" type="info" :bordered="bordered">
        1. 源字段的值为空会跳过处理 <br />
        2. 工具只会合并PDF类型文件，如果有其余类型的文件，会跳过表格行<br />
        3. 输出字段值不为空会跳过<br />
      </n-alert>
    </div>
    <n-spin :show="processInfo.loading">
      <template #description> {{ processInfo.loadLabel }} </template>
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
        <n-button attr-type="button" type="info" @click="singleSubmit"> 处理 </n-button>
      </n-form>
    </n-spin>
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
