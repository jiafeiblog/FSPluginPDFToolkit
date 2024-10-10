<script setup lang="ts">
import { PDFMerger } from './pdf-merger'
</script>

<template>
  <div>
    hahah
    <!-- <form-select
      v-if="!modelData.model"
      v-model:value="modelData.pages"
      :msg="t('Configuration split')"
      input
      :options="filterFields(FieldType.Text)"
      @create="pagesCreate"
    >
      <template #tooltip>
        {{ t('Can be entered manually or specified by fields') }}
        <n-ul style="--n-text-color:unset;">
          <n-li>{{ t("Use `,` to separate individual page numbers, such as 3,5,8, to split and merge into one file for pages 3, 5, and 8.") }}</n-li>
          <n-li>{{ t("Use `-` or `to` to indicate a range, such as 3-7, to split and merge into one file from page 3 to page 7.") }}</n-li>
          <n-li>{{ t("Use `/` to create an additional file, such as 1/2-5, to split into two files, the first with only page 1, and the second from page 2 to page 5.") }}</n-li>
          <n-li>{{ t("Use `start/s` or `end/e` to represent the starting page or ending page, such as 5-end, to split from page 5 to the last page, and start-5, to split from the first page to page 5.") }}</n-li>
        </n-ul>
      </template>
    </form-select>
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    /> -->
  </div>
</template>

<style lang="scss" scoped></style>
