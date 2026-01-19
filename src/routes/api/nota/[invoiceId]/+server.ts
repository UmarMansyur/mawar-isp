import { prisma } from "$lib/server/prisma";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import PDFDocument from "pdfkit";

export const GET: RequestHandler = async ({ params, url }) => {
  const { invoiceId } = params;

  // Optional token for public access
  const token = url.searchParams.get("token");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      user: {
        select: { name: true, email: true }
      }
    }
  });

  if (!invoice) {
    throw error(404, "Invoice tidak ditemukan");
  }

  // Only allow PAID invoices to generate receipt
  if (invoice.status !== "PAID") {
    throw error(400, "Nota hanya tersedia untuk tagihan yang sudah dibayar");
  }

  // Generate PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Company Header
  doc.fontSize(24).font("Helvetica-Bold").text("NOTA PEMBAYARAN", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica").text("MawarISP", { align: "center" });
  doc.fontSize(10).text("Internet Service Provider", { align: "center" });
  doc.moveDown(2);

  // Horizontal line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Invoice Info
  doc.fontSize(11).font("Helvetica-Bold").text("No. Invoice:", { continued: true });
  doc.font("Helvetica").text(`  ${invoice.invoiceNo}`);

  doc.font("Helvetica-Bold").text("Tanggal Bayar:", { continued: true });
  doc.font("Helvetica").text(`  ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  }) : "-"}`);

  doc.moveDown(1.5);

  // Customer Info Box
  doc.rect(50, doc.y, 495, 80).stroke();
  const boxY = doc.y + 10;
  doc.y = boxY;
  doc.x = 60;

  doc.fontSize(10).font("Helvetica-Bold").text("Data Pelanggan:");
  doc.moveDown(0.3);
  doc.font("Helvetica").text(`Nama: ${invoice.customer?.name || "-"}`);
  doc.text(`Telepon: ${invoice.customer?.phone || "-"}`);

  doc.y = boxY + 90;
  doc.x = 50;
  doc.moveDown(1);

  // Payment Details Table
  doc.font("Helvetica-Bold").fontSize(11).text("Detail Pembayaran:");
  doc.moveDown(0.5);

  // Table header
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillAndStroke("#f1f5f9", "#e2e8f0");
  doc.fillColor("#000").fontSize(10).font("Helvetica-Bold");
  doc.text("Deskripsi", 60, tableY + 8, { width: 300 });
  doc.text("Jumlah", 400, tableY + 8, { width: 135, align: "right" });

  // Table row
  const rowY = tableY + 25;
  doc.rect(50, rowY, 495, 30).stroke();
  doc.font("Helvetica").fontSize(10);
  doc.text(invoice.description || `Tagihan Internet`, 60, rowY + 10, { width: 300 });
  doc.font("Helvetica-Bold").text(formatCurrency(invoice.amount), 400, rowY + 10, { width: 135, align: "right" });

  // Total
  const totalY = rowY + 30;
  doc.rect(50, totalY, 495, 30).fillAndStroke("#dbeafe", "#93c5fd");
  doc.fillColor("#1e40af").fontSize(12).font("Helvetica-Bold");
  doc.text("TOTAL DIBAYAR", 60, totalY + 9, { width: 300 });
  doc.text(formatCurrency(invoice.amount), 400, totalY + 9, { width: 135, align: "right" });

  doc.fillColor("#000");
  doc.y = totalY + 50;
  doc.moveDown(2);

  // Footer
  doc.fontSize(9).font("Helvetica").fillColor("#64748b");
  doc.text("Terima kasih atas pembayaran Anda.", { align: "center" });
  doc.text("Nota ini adalah bukti pembayaran yang sah.", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(8).text(`Digenerate: ${new Date().toLocaleString("id-ID")}`, { align: "center" });

  doc.end();

  // Wait for PDF to finish
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="nota-${invoice.invoiceNo}.pdf"`,
      "Cache-Control": "public, max-age=3600"
    }
  });
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
