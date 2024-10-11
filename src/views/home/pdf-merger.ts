import { PDFDocument } from "pdf-lib"
export class PDFMerger {
  constructor() {

  }
  async mergePDFs(pdfUrls) {
    // 创建一个新的空白PDF文档
    const mergedPdfDoc = await PDFDocument.create();

    for (const pdfUrl of pdfUrls) {
      // 获取PDF文件的二进制数据
      const pdfBytes = await fetch(pdfUrl).then(response => response.arrayBuffer());

      // 将获取到的PDF文件添加到新的文档中
      const pdfDoc = await PDFDocument.load(pdfBytes);
      // 如果单个PDF为多页，则要一页一页往新建的PDF中添加
      const copiedPages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdfDoc.addPage(page));
    }

    // 将合并后的PDF保存为Blob对象
    const mergedPdfBytes = await mergedPdfDoc.save();
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    return mergedPdfBlob
  }
}