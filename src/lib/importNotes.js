export async function extractNoteFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose a file smaller than 8 MB.');
  let text;
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }
    text = pages.join('\n\n');
  } else if (/\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith('text/')) {
    text = await file.text();
  } else throw new Error('Choose a PDF, TXT, or Markdown file.');
  if (!text.trim()) throw new Error('No selectable text was found in that file.');
  return { text: text.slice(0, 12000), truncated: text.length > 12000 };
}
