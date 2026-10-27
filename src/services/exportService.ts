import { jsPDF } from 'jspdf';
import { ScanAnalysis } from '../types';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'document';
}

/**
 * Exports analysis as a clean, structured Plain Text file (.txt)
 */
export function exportAsTextFile(
  analysis: ScanAnalysis,
  checkedSteps: Record<number, boolean> = {}
): void {
  const timestamp = new Date().toLocaleString();
  const filename = `lifelens-${sanitizeFilename(analysis.documentTitle)}-report.txt`;

  const lines: string[] = [
    '================================================================================',
    '                       LIFELENS AI — ANALYSIS REPORT                            ',
    '               Scan It. Understand It. Make Better Decisions.                   ',
    '================================================================================',
    `Generated On    : ${timestamp}`,
    `Document Title  : ${analysis.documentTitle}`,
    `Category        : ${analysis.categoryLabel || analysis.category.toUpperCase()}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. KEY TAKEAWAY',
    '--------------------------------------------------------------------------------',
    analysis.oneSentenceSummary,
    '',
    '--------------------------------------------------------------------------------',
    '2. WHAT DOES THIS ACTUALLY MEAN?',
    '--------------------------------------------------------------------------------',
    analysis.whatItMeans,
    '',
    '--------------------------------------------------------------------------------',
    '3. IMPORTANT DETAILS & KEY FIGURES',
    '--------------------------------------------------------------------------------',
  ];

  if (analysis.keyDetails && analysis.keyDetails.length > 0) {
    analysis.keyDetails.forEach((detail) => {
      const badge = detail.badge ? ` [${detail.badge}]` : '';
      lines.push(`• ${detail.label.padEnd(30)}: ${detail.value}${badge}`);
    });
  } else {
    lines.push('No specific numerical figures extracted.');
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('4. POTENTIAL CONCERNS & RED FLAGS');
  lines.push('--------------------------------------------------------------------------------');

  if (analysis.concernsAndFlags && analysis.concernsAndFlags.length > 0) {
    analysis.concernsAndFlags.forEach((flag, idx) => {
      lines.push(`[${flag.severity.toUpperCase()} PRIORITY] ${flag.title}`);
      lines.push(`  Explanation: ${flag.explanation}`);
      lines.push(`  Advice     : ${flag.advice}`);
      lines.push('');
    });
  } else {
    lines.push('No critical concerns or red flags detected.');
    lines.push('');
  }

  lines.push('--------------------------------------------------------------------------------');
  lines.push('5. ACTION CHECKLIST & NEXT STEPS');
  lines.push('--------------------------------------------------------------------------------');

  if (analysis.nextSteps && analysis.nextSteps.length > 0) {
    analysis.nextSteps.forEach((step) => {
      const isDone = Boolean(checkedSteps[step.stepNumber]);
      const status = isDone ? '[X] COMPLETED:' : '[ ] PENDING  :';
      const deadline = step.deadline ? ` (Due: ${step.deadline})` : '';
      lines.push(`${status} Step ${step.stepNumber} - ${step.action}${deadline}`);
    });
  } else {
    lines.push('No pending actions required.');
  }

  if (analysis.verificationNotice) {
    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('6. LIFELENS VERIFICATION TRANSPARENCY NOTICE');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(analysis.verificationNotice);
  }

  if (analysis.extractedText) {
    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('7. RAW TRANSCRIBED OCR TEXT');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(analysis.extractedText);
  }

  lines.push('');
  lines.push('================================================================================');
  lines.push('LifeLens AI — Personal Document Record. Keep this for your archives.');
  lines.push('================================================================================');

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports analysis as a beautifully formatted PDF document (.pdf) using jsPDF
 */
export function exportAsPDF(
  analysis: ScanAnalysis,
  imageDataUrl?: string,
  checkedSteps: Record<number, boolean> = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('LIFELENS AI — PERSONAL DOCUMENT REPORT', margin, 25);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  // 1. Top Brand Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(56, 189, 248); // cyan-400
  doc.text('LifeLens.ai', margin + 16, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Scan It. Understand It. Make Better Decisions.', margin + 16, y + 42);

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Exported: ${dateStr}`, pageWidth - margin - 16, y + 32, { align: 'right' });

  y += 70;

  // 2. Document Title & Category
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241); // indigo-500
  doc.text((analysis.categoryLabel || analysis.category).toUpperCase(), margin, y);
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(analysis.documentTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  // 3. One-Sentence Takeaway Box
  const summaryLines = doc.splitTextToSize(analysis.oneSentenceSummary, contentWidth - 24);
  const summaryBoxHeight = summaryLines.length * 14 + 18;

  doc.setFillColor(240, 249, 255); // light sky
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(3, 105, 161);
  doc.text(summaryLines, margin + 12, y + 16);
  y += summaryBoxHeight + 18;

  // 4. Section: What does this actually mean?
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('What does this actually mean?', margin, y);
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + 140, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const meaningLines = doc.splitTextToSize(analysis.whatItMeans, contentWidth);
  doc.text(meaningLines, margin, y);
  y += meaningLines.length * 14 + 18;

  // 5. Section: Important Details & Key Figures
  if (analysis.keyDetails && analysis.keyDetails.length > 0) {
    checkPageBreak(100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Important Details & Key Figures', margin, y);
    y += 6;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + 140, y);
    y += 14;

    analysis.keyDetails.forEach((detail) => {
      checkPageBreak(22);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(detail.label, margin + 8, y + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(detail.value, pageWidth - margin - 8, y + 14, { align: 'right' });

      y += 26;
    });

    y += 10;
  }

  // 6. Section: Potential Concerns & Red Flags
  if (analysis.concernsAndFlags && analysis.concernsAndFlags.length > 0) {
    checkPageBreak(100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28); // red
    doc.text('Potential Concerns & Red Flags', margin, y);
    y += 6;
    doc.setDrawColor(254, 202, 202);
    doc.line(margin, y, margin + 150, y);
    y += 14;

    analysis.concernsAndFlags.forEach((flag) => {
      const isHigh = flag.severity === 'high';
      const explLines = doc.splitTextToSize(flag.explanation, contentWidth - 20);
      const adviceLines = doc.splitTextToSize(`Advice: ${flag.advice}`, contentWidth - 20);
      const cardHeight = 22 + explLines.length * 12 + adviceLines.length * 12 + 10;

      checkPageBreak(cardHeight);

      if (isHigh) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(252, 165, 165);
      } else {
        doc.setFillColor(254, 252, 232);
        doc.setDrawColor(253, 230, 138);
      }
      doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(isHigh ? 185 : 161, isHigh ? 28 : 98, isHigh ? 28 : 7);
      doc.text(`[${flag.severity.toUpperCase()}] ${flag.title}`, margin + 10, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(explLines, margin + 10, y + 26);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(15, 23, 42);
      doc.text(adviceLines, margin + 10, y + 26 + explLines.length * 12);

      y += cardHeight + 8;
    });

    y += 10;
  }

  // 7. Section: Action Checklist
  if (analysis.nextSteps && analysis.nextSteps.length > 0) {
    checkPageBreak(100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Next Steps & Action Checklist', margin, y);
    y += 6;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + 140, y);
    y += 14;

    analysis.nextSteps.forEach((step) => {
      const isDone = Boolean(checkedSteps[step.stepNumber]);
      const statusIcon = isDone ? '[X]' : '[  ]';
      const stepText = `${statusIcon} Step ${step.stepNumber}: ${step.action}${
        step.deadline ? ` (Due: ${step.deadline})` : ''
      }`;
      const stepLines = doc.splitTextToSize(stepText, contentWidth - 10);

      checkPageBreak(stepLines.length * 14 + 6);

      doc.setFont('helvetica', isDone ? 'normal' : 'bold');
      doc.setFontSize(9);
      doc.setTextColor(isDone ? 148 : 30, isDone ? 163 : 41, isDone ? 184 : 59);
      doc.text(stepLines, margin + 4, y);

      y += stepLines.length * 14 + 4;
    });

    y += 14;
  }

  // 8. Verification Transparency Notice
  if (analysis.verificationNotice) {
    checkPageBreak(60);
    const noticeLines = doc.splitTextToSize(
      `Transparency Notice: ${analysis.verificationNotice}`,
      contentWidth - 16
    );
    const boxHeight = noticeLines.length * 11 + 14;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(noticeLines, margin + 8, y + 11);

    y += boxHeight + 14;
  }

  // Save PDF
  const filename = `lifelens-${sanitizeFilename(analysis.documentTitle)}-report.pdf`;
  doc.save(filename);
}
