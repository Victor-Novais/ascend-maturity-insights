import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { ReportExportData } from "@/types/analytics";

export function generateAssessmentPdf(data: ReportExportData) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(31, 78, 121);
  doc.text("ASCEND - Relatorio de Maturidade", 20, 30);
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(data.companyName, 20, 45);
  doc.text(`Segmento: ${data.segment ?? "Nao informado"}`, 20, 55);
  doc.text(`Data: ${format(new Date(data.reportDate), "dd/MM/yyyy")}`, 20, 65);

  const levelColor: Record<string, [number, number, number]> = {
    CRITICO: [239, 68, 68],
    ALTO: [249, 115, 22],
    EFICIENTE: [234, 179, 8],
    EFICAZ: [34, 197, 94],
    OTIMIZADO: [16, 185, 129],
    ARTESANAL: [239, 68, 68],
    ESTRATEGICO: [16, 185, 129],
  };

  doc.setFontSize(36);
  doc.setTextColor(...(levelColor[data.maturityLevel] || [59, 130, 246]));
  doc.text(`${data.totalScore}%`, 20, 95);
  doc.setFontSize(16);
  doc.text(data.maturityLevel, 60, 95);

  autoTable(doc, {
    startY: 110,
    head: [["Categoria", "Score"]],
    body: Object.entries(data.categoryScores).map(([category, score]) => [category, `${score}%`]),
  });

  let currentY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 120;
  currentY += 12;

  const textSections = [
    { title: "Pontos Fortes", items: data.strengths },
    { title: "Pontos Fracos", items: data.weaknesses },
    { title: "Recomendacoes", items: data.recommendations },
  ];

  textSections.forEach((section, index) => {
    if (currentY > 240 && index > 0) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(31, 78, 121);
    doc.text(section.title, 20, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const lines = section.items.length ? section.items : ["Nenhum item registrado."];
    lines.forEach((item) => {
      const wrapped = doc.splitTextToSize(`- ${item}`, 170);
      doc.text(wrapped, 22, currentY);
      currentY += wrapped.length * 6;
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });
    currentY += 8;
  });

  doc.save(`ASCEND_${data.companyName.replace(/\s/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
