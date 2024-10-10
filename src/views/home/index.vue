<script setup lang="ts">
import { onMounted, ref, watch, reactive, computed } from 'vue'
import { bitable, FieldType, IAttachmentField, ICurrencyFieldMeta } from '@lark-base-open/js-sdk'
import { PDFMerger } from './pdf-merger'

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
