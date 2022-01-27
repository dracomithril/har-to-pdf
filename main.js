const { writeFileSync, mkdirSync, rmSync, createWriteStream, readFileSync } = require("fs");
const { resolve, join } = require("path/win32");
const PDFDocument = require("pdfkit");
const { randomUUID } = require("crypto");
const args = process.argv.slice(2);
try {
  const har = JSON.parse(readFileSync(args[0], { encoding: "utf-8" }));
  const { entries } = har.log;
  const pageCount = entries.length;
  console.log("number of entries", pageCount);
  const padding = String(pageCount).length;
  const baseDir = `./images-${randomUUID()}`;
  mkdirSync(baseDir);
  const pdf = new PDFDocument({
    autoFirstPage: false,
  });

  pdf.pipe(createWriteStream(join(baseDir, "output.pdf")));
  pdf.on("pageAdded", () => console.log("page added"));
  pdf.on("end", () => console.log("[pdf] all finished"));
  entries
    .filter(({ response }) => {
      return (
        response.status === 200 && response.content.mimeType.includes("image/png") && response.content.size > 10_000
      );
    })
    .map(({ response }) => {
      return response.content;
    })
    .forEach(({ text }, ind) => {
      const fileName = resolve(`${baseDir}/${String(ind).padStart(padding, "0")}.png`);
      writeFileSync(fileName, text, "base64", function (err) {
        console.log(`file ${fileName}: ${err ? "ERROR" : "OK"}`);
      });
      pdf.addPage({ size: [800, 1131] }).image(Buffer.from(text, "base64"), 0, 0);
    });
  pdf.end();
} catch (error) {
  console.error(error);
} finally {
  console.info("All finished");
}
