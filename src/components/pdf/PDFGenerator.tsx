import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  paymentMethod: string;
  counterpartyName: string;
}

interface PDFData {
  title: string;
  contributorInfo: {
    type: 'individual' | 'business';
    name: string;
  };
  records: PaymentRecord[];
  userType: 'driver' | 'passenger';
}

export class PDFGenerator {
  static generate(data: PDFData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Contributor Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.contributorInfo.type === 'individual' ? 'Individual' : 'Business'}: ${data.contributorInfo.name}`, 20, yPosition);
    yPosition += 10;

    // Date range
    const dateGenerated = format(new Date(), 'MMM dd, yyyy');
    doc.text(`Report Generated: ${dateGenerated}`, 20, yPosition);
    yPosition += 20;

    // Table data
    const tableData = data.records.map(record => [
      format(new Date(record.date), 'MMM dd, yyyy'),
      format(new Date(record.date), 'h:mm a'),
      `$${record.amount.toFixed(2)}`,
      record.paymentMethod,
      record.counterpartyName
    ]);

    // Calculate total
    const total = data.records.reduce((sum, record) => sum + record.amount, 0);

    // Add table
    autoTable(doc, {
      head: [[
        'Date',
        'Time',
        data.userType === 'driver' ? 'Amount Received' : 'Amount Paid',
        'Payment Method',
        data.userType === 'driver' ? 'Passenger Name' : 'Driver Name'
      ]],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [60, 80, 120],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total ${data.userType === 'driver' ? 'Earnings' : 'Payments'}: $${total.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });

    // Notice
    const noticeY = finalY + 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTICE:', 20, noticeY);
    
    doc.setFont('helvetica', 'normal');
    const noticeText = [
      'This document is not an official invoice.',
      'For invoice requests, please contact the other party directly.',
      'This summary is intended solely for personal tax reporting and record-keeping purposes.'
    ];

    let currentY = noticeY + 5;
    noticeText.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 5;
    });

    return doc;
  }

  static async shareByEmail(doc: jsPDF, filename: string) {
    const pdfBlob = doc.output('blob');
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename)] })) {
      // Use Web Share API if available
      try {
        await navigator.share({
          files: [new File([pdfBlob], filename, { type: 'application/pdf' })],
          title: 'Payment Summary Report',
          text: 'Please find attached your payment summary report.'
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: create mailto link
      const subject = encodeURIComponent('Payment Summary Report');
      const body = encodeURIComponent('Please find attached your payment summary report.\n\nNote: You will need to manually attach the downloaded PDF file to your email.');
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // Download the PDF first
      doc.save(filename);
      
      // Then open email client
      window.location.href = mailtoLink;
    }
  }
}