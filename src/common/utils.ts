import { IAttachmentField } from "@lark-base-open/js-sdk";
import { bitable } from "@lark-base-open/js-sdk";
import { IRecord } from "@lark-base-open/js-sdk";

export async function getLookupValueByFieldKey(record: IRecord, fieldKey: string) {
    const vals = record.fields[fieldKey] as any[]
    const allUrls: string[] = []
    for (const item of vals) {
        const { fieldId, recordId, tableId } = item.permission
        const lookupTable = await bitable.base.getTableById(tableId)
        const lookupField = await lookupTable.getFieldById(fieldId)
        const obj = lookupField as IAttachmentField
        // 获取引用字段的附件url
        const urls = await obj.getAttachmentUrls(recordId)
        Array.prototype.push.apply(allUrls, urls)
    }
    return allUrls
}