import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { ReportExportData } from "@/types/analytics";

export function generateAssessmentPdf(data: ReportExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let pageNumber = 1;

  // Função para adicionar rodapé
  const addFooter = () => {
    const footerText = `ASCEND | ${data.companyName} | Página ${pageNumber} de ?`;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  // Página inicial
  doc.setFontSize(22);
  doc.setTextColor(31, 78, 121);
  doc.text("ASCEND - Relatório de Maturidade", 20, 30);
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(data.companyName, 20, 45);
  doc.text(`Segmento: ${data.segment ?? "Não informado"}`, 20, 55);
  doc.text(`Data: ${format(new Date(data.reportDate), "dd/MM/yyyy")}`, 20, 65);
  if (data.responsible) {
    doc.setFontSize(11);
    doc.text(`Responsável: ${data.responsible}`, 20, 75);
  }

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
  doc.text(`${data.totalScore}%`, 20, 105);
  doc.setFontSize(16);
  doc.text(data.maturityLevel, 60, 105);

  // Tabela de categorias
  autoTable(doc, {
    startY: 125,
    head: [["Categoria", "Score"]],
    body: Object.entries(data.categoryScores).map(([category, score]) => [
      category,
      `${score}%`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255] },
  });

  let currentY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } })
    .lastAutoTable?.finalY ?? 160;
  currentY += 12;

  addFooter();
  pageNumber++;

  // Páginas de conteúdo
  const textSections = [
    { title: "Pontos Fortes", items: data.strengths },
    { title: "Pontos Fracos", items: data.weaknesses },
    { title: "Recomendações", items: data.recommendations },
  ];

  textSections.forEach((section, sectionIndex) => {
    // Adicionar nova página se necessário
    if (currentY > 240) {
      addFooter();
      doc.addPage();
      currentY = 20;
      pageNumber++;
    }

    doc.setFontSize(16);
    doc.setTextColor(31, 78, 121);
    doc.text(section.title, 20, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const lines = section.items.length ? section.items : ["Nenhum item registrado."];

    lines.forEach((item, itemIndex) => {
      // Adicionar nova página se necessário
      if (currentY > 270) {
        addFooter();
        doc.addPage();
        currentY = 20;
        pageNumber++;
      }

      const wrapped = doc.splitTextToSize(`• ${item}`, 170);
      doc.text(wrapped, 22, currentY);
      currentY += wrapped.length * 6;
    });

    currentY += 8;
  });

  // Adicionar rodapé na última página
  addFooter();

  doc.save(
    `ASCEND_${data.companyName.replace(/\s/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`
  );
}
