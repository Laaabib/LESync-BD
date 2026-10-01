import { jsPDF } from 'jspdf';
import { LeaveRequest, Employee, AttendanceRecord, DepartmentSummary } from '../types/hrTypes';
import { pmsService } from './pmsService';
import { renderPdfPropertyLogo, cleanPdfText, triggerPdfDownload } from './pdfExportService';

export const hrPdfService = {
  /**
   * Generates a formal, printable PDF for an Employee Leave Application Form
   * Two distinct parts on a single A4 page:
   *  - Part 1 (Top): HR Department Copy (Office Record & Audit)
   *  - Perforation / Tear-off divider
   *  - Part 2 (Bottom): Employee Copy (Sanction Slip & Resumption Pass)
   */
  generateLeaveFormPDF(leave: LeaveRequest, employee?: Employee): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm
    let y = 7;

    const getResumptionDate = (toDateStr: string) => {
      try {
        const d = new Date(toDateStr);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }
      return toDateStr;
    };
    const resumptionDate = getResumptionDate(leave.toDate);

    const getStatusColor = (status: string) => {
      if (status === 'Approved') return [16, 185, 129];
      if (status === 'Rejected') return [239, 68, 68];
      return [245, 158, 11];
    };
    const statusColor = getStatusColor(leave.status);

    const empCode = leave.employeeCode || employee?.employeeCode || 'EMP-1001';
    const empName = leave.employeeName || employee?.name || 'Staff Employee';
    const empDept = leave.department || employee?.department || 'Operations';
    const empDesig = leave.designation || employee?.designation || 'Staff';
    const empPhone = employee?.phone || '+880 1711-000000';
    const empJoining = employee?.joiningDate || '2024-02-15';

    const annualRemain = employee?.leaveBalance?.annual ?? 14;
    const casualRemain = employee?.leaveBalance?.casual ?? 8;
    const medicalRemain = employee?.leaveBalance?.medical ?? 13;

    const sysSettings = pmsService.getState()?.settings;
    const resortName = sysSettings?.resortName || 'Hotel & Resort PMS';
    const logoImg = sysSettings?.logoUrl;

    // ==========================================
    // PART 1: HR DEPARTMENT COPY (OFFICE RECORD)
    // ==========================================

    // Header Background Accent
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentWidth, 15.5, 1.5, 1.5, 'F');

    // Property Logo
    renderPdfPropertyLogo(doc, margin + 3, y + 2, 19, 11.5, logoImg, resortName);
    const textStartX = margin + 25;

    // Property Name in Amber Gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text(cleanPdfText(resortName.toUpperCase()), textStartX, y + 5);

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LEAVE APPLICATION & AUTHORIZATION • PART 1: HR COPY', textStartX, y + 9.5);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Ref ID: ${leave.id}  |  Applied: ${leave.appliedAt ? leave.appliedAt.split('T')[0] : 'Current Date'}  |  Dept: ${empDept}`, textStartX, y + 13.5);

    // Status Badge
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth - margin - 26, y + 3.5, 22, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(leave.status.toUpperCase(), pageWidth - margin - 15, y + 8.5, { align: 'center' });

    y += 17.5;

    // 1. Employee Particulars
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('1. EMPLOYEE PARTICULARS', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 13, 'D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    const col1X = margin + 3;
    const col2X = margin + 66;
    const col3X = margin + 130;

    doc.text('Staff ID:', col1X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empCode, col1X + 15, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Full Name:', col2X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empName, col2X + 17, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Department:', col3X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empDept, col3X + 19, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Designation:', col1X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empDesig, col1X + 18, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Joining Date:', col2X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empJoining, col2X + 19, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Contact Phone:', col3X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empPhone, col3X + 21, y + 9.5);

    y += 15;

    // 2. Leave Schedule & Specifications
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('2. LEAVE SCHEDULE & REASON', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 14, 'D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text('Leave Category:', col1X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.leaveType, col1X + 22, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('From:', col2X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.fromDate, col2X + 10, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('To:', col2X + 30, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.toDate, col2X + 36, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Duration:', col3X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${leave.days} Calendar Day(s)`, col3X + 14, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Purpose / Grounds:', col1X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const shortReason = leave.reason ? (leave.reason.length > 40 ? leave.reason.substring(0, 38) + '...' : leave.reason) : 'Personal necessity';
    doc.text(shortReason, col1X + 26, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Station Contact:', col3X - 22, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const contactLoc = leave.contactDuringLeave || 'Available on registered phone';
    doc.text(contactLoc.length > 25 ? contactLoc.substring(0, 23) + '..' : contactLoc, col3X + 3, y + 9.5);

    y += 16;

    // 3. Reliever Handover & Entitlement Audit
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('3. RELIEVER HANDOVER & LEAVE BALANCE AUDIT', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 14, 'D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text('Assigned Reliever:', col1X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.relieverName || 'Duty Senior Assigned', col1X + 25, y + 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Handover verified: Operations, physical keys & pending task roster transferred.', col1X, y + 9);

    // Mini Balance Audit on Right
    const balX = margin + contentWidth - 85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Annual Leave: 18 Quota / 4 Used / ${annualRemain} Rem.`, balX, y + 4);
    doc.text(`Casual Leave: 10 Quota / 2 Used / ${casualRemain} Rem.`, balX, y + 7.5);
    doc.text(`Medical Leave: 14 Quota / 1 Used / ${medicalRemain} Rem.`, balX, y + 11);

    y += 16;

    // 4. Authorization Signatures (4 Boxes)
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('4. AUTHORIZATION SIGN-OFF & EXECUTIVE CLEARANCES', margin + 3, y + 3.2);

    y += 4.5;
    const sigBoxW = contentWidth / 4;
    const sigBoxH = 18;
    const signatures = [
      { title: '1. Applicant Employee', name: empName, role: 'Employee Signature' },
      { title: '2. Reliever Officer', name: leave.relieverName || 'Duty Senior', role: 'Handover Ack.' },
      { title: '3. Department Head', name: 'Recommended', role: 'HOD Clearance' },
      { title: '4. HR Directorate', name: leave.reviewedBy || 'HR Directorate', role: leave.status === 'Approved' ? 'APPROVED & FILED' : 'SANCTION PENDING' }
    ];

    signatures.forEach((sig, idx) => {
      const bx = margin + sigBoxW * idx;
      doc.rect(bx, y, sigBoxW, sigBoxH, 'D');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(sig.title, bx + 2.5, y + 3.5);

      doc.setDrawColor(148, 163, 184);
      doc.line(bx + 2.5, y + 11, bx + sigBoxW - 2.5, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text(sig.name.length > 22 ? sig.name.substring(0, 20) + '..' : sig.name, bx + 2.5, y + 14);
      doc.setTextColor(100, 116, 139);
      doc.text(sig.role, bx + 2.5, y + 17);
    });

    y += sigBoxH + 2;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('[PART 1: HR DEPARTMENT ARCHIVE COPY • TO BE PRESERVED IN MASTER PERSONNEL FILE]', margin, y + 2);

    // ==========================================
    // PERFORATION / TEAR-OFF LINE (CUT HERE)
    // ==========================================
    y += 6;
    doc.setLineDashPattern([2, 1.5], 0);
    doc.setDrawColor(100, 116, 139);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    doc.setLineDashPattern([], 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth / 2 - 45, y - 0.5, 90, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('✂  CUT / TEAR HERE  •  PART 2: EMPLOYEE ACKNOWLEDGMENT COPY  ✂', pageWidth / 2, y + 3, { align: 'center' });

    y += 6;

    // ==========================================
    // PART 2: EMPLOYEE COPY (SANCTION SLIP)
    // ==========================================

    // Header Background Accent (Dark Slate-800)
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 15.5, 1.5, 1.5, 'F');

    // Property Logo
    renderPdfPropertyLogo(doc, margin + 3, y + 2, 19, 11.5, logoImg, resortName);
    const textStartX2 = margin + 25;

    // Property Name in Amber Gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text(cleanPdfText(resortName.toUpperCase()), textStartX2, y + 5);

    // Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LEAVE SANCTION SLIP & RESUMPTION PASS • PART 2: EMPLOYEE COPY', textStartX2, y + 9.5);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Ref ID: ${leave.id}  |  Issue Date: ${new Date().toISOString().split('T')[0]}  |  Retain for Personal Records`, textStartX2, y + 13.5);

    // Status Badge Part 2
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth - margin - 26, y + 3.5, 22, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(leave.status.toUpperCase(), pageWidth - margin - 15, y + 8.5, { align: 'center' });

    y += 17.5;

    // 1. Staff Information
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('1. STAFF INFORMATION & IDENTIFICATION', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 13, 'D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text('Staff ID:', col1X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empCode, col1X + 15, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Employee Name:', col2X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empName, col2X + 23, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Department:', col3X, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empDept, col3X + 19, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Designation:', col1X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empDesig, col1X + 18, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Emergency Phone:', col2X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(empPhone, col2X + 26, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Leave Contact:', col3X, y + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(contactLoc.length > 25 ? contactLoc.substring(0, 23) + '..' : contactLoc, col3X + 21, y + 9.5);

    y += 15;

    // 2. Approved Leave Schedule & Resumption Pass
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('2. SANCTIONED LEAVE PERIOD & DUTY RESUMPTION PASS', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 16, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Sanctioned Leave:', col1X, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${leave.leaveType} (${leave.days} Calendar Day[s])`, col1X + 26, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('From Date:', col2X + 10, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.fromDate, col2X + 26, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('To Date:', col3X, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leave.toDate, col3X + 13, y + 4.5);

    // Resumption Highlight Box
    doc.setFillColor(254, 243, 199); // Amber-100 highlight
    doc.rect(margin + 2, y + 8, contentWidth - 4, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text(`MANDATORY DUTY RESUMPTION DATE: ${resumptionDate} (Morning Shift)`, margin + 4, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const relieverShort = (leave.relieverName || 'Assigned Senior').substring(0, 20);
    doc.text(`Reliever Covering Station: ${relieverShort}`, margin + contentWidth - 65, y + 12.5);

    y += 18;

    // 3. Balance & Terms
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('3. REMAINING BALANCE & COMPLIANCE RULES', margin + 3, y + 3.2);

    y += 4.5;
    doc.rect(margin, y, contentWidth, 14, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`Remaining Balance — Annual: ${annualRemain}d  |  Casual: ${casualRemain}d  |  Medical: ${medicalRemain}d`, col1X, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('• Staff must report for duty promptly on resumption date. Unauthorized overstaying will trigger administrative absence deduction.', col1X, y + 8);
    doc.text('• Retain this stamped copy as official proof of authorized leave for Biometric & Payroll attendance audit.', col1X, y + 11.5);

    y += 16;

    // 4. Dual Sign-off & Stamp
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.5, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('4. RECEIPT ACKNOWLEDGMENT & ISSUING VALIDATION', margin + 3, y + 3.2);

    y += 4.5;
    const halfBoxW = contentWidth / 2;
    const halfBoxH = 19;

    // Employee Acknowledgment
    doc.rect(margin, y, halfBoxW, halfBoxH, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Employee Acknowledgment & Undertaking', margin + 3, y + 3.5);
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 3, y + 12, margin + halfBoxW - 3, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    doc.text(`${empName} (Staff Signature)`, margin + 3, y + 15);
    doc.setTextColor(100, 116, 139);
    doc.text('I confirm receipt of this approved leave pass and commit to resume on schedule.', margin + 3, y + 18);

    // HR Directorate Stamp
    doc.rect(margin + halfBoxW, y, halfBoxW, halfBoxH, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('HR Directorate Seal & Sanction Officer', margin + halfBoxW + 3, y + 3.5);
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + halfBoxW + 3, y + 12, margin + contentWidth - 3, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    doc.text(leave.reviewedBy || 'HR Directorate Executive Seal', margin + halfBoxW + 3, y + 15);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL STAMP & VERIFIED SIGN-OFF', margin + halfBoxW + 3, y + 18);

    y += halfBoxH + 3;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`LESync PMS HR Module • Two-Part Single A4 Leave Record • Integrity Code: ${leave.id} • Page 1 of 1`, pageWidth / 2, y + 2, { align: 'center' });

    // Download PDF directly
    const filename = `Leave_Form_${empCode}_${leave.id}.pdf`;
    triggerPdfDownload(doc, filename, {
      title: `Employee Leave Application - ${leave.employeeName || empCode}`,
      subject: `Official Employee Leave Form (${leave.leaveType}) - ${leave.fromDate} to ${leave.toDate}`,
      author: 'HR Division',
      creator: 'LESync PMS Human Resources & Payroll System',
      keywords: `Leave, HR, ${empCode}, ${leave.leaveType}, Sanction Slip`
    });
  },

  /**
   * Generates a complete Monthly HR Leave & Absence Register in high-quality PDF format (No CSV/Excel)
   */
  generateLeaveSummaryPDF(leaveRequests: LeaveRequest[]): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 14;

    const sysSettings = pmsService.getState()?.settings;
    const resortName = sysSettings?.resortName || 'Hotel & Resort PMS';
    const logoImg = sysSettings?.logoUrl;

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    // Property Logo
    renderPdfPropertyLogo(doc, margin + 4, y + 3, 24, 16, logoImg, resortName);
    const textStartX = margin + 33;

    // Property Name in Gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text(cleanPdfText(resortName.toUpperCase()), textStartX, y + 6.5);

    // Document Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HR LEAVE & ABSENCE AUDIT REGISTER', textStartX, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Official Executive Register • Total Records: ${leaveRequests.length} Applications • Certified Copy`, textStartX, y + 17.5);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-GB'), pageWidth - margin - 4, y + 17.5, { align: 'right' });

    y += 26;

    // Table Header
    const colWidths = [24, 45, 38, 38, 22, 22, 16, 35, 29];
    const headers = ['Ref ID', 'Employee Name', 'Department', 'Leave Type', 'From Date', 'To Date', 'Days', 'Handover Reliever', 'Status'];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let curX = margin;
    headers.forEach((h, idx) => {
      doc.text(h, curX + 2, y + 4.8);
      curX += colWidths[idx];
    });

    y += 7;

    // Table Rows
    leaveRequests.forEach((lv, i) => {
      if (y > 185) {
        doc.addPage();
        y = 14;
      }

      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.5, 'FD');
      doc.setDrawColor(226, 232, 240);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let x = margin;
      doc.text(lv.id, x + 2, y + 4.5);
      x += colWidths[0];

      doc.setFont('helvetica', 'bold');
      doc.text(lv.employeeName, x + 2, y + 4.5);
      x += colWidths[1];

      doc.setFont('helvetica', 'normal');
      doc.text(lv.department, x + 2, y + 4.5);
      x += colWidths[2];

      doc.text(lv.leaveType, x + 2, y + 4.5);
      x += colWidths[3];

      doc.text(lv.fromDate, x + 2, y + 4.5);
      x += colWidths[4];

      doc.text(lv.toDate, x + 2, y + 4.5);
      x += colWidths[5];

      doc.setFont('helvetica', 'bold');
      doc.text(`${lv.days}d`, x + 2, y + 4.5);
      x += colWidths[6];

      doc.setFont('helvetica', 'normal');
      doc.text(lv.relieverName || 'Duty Senior', x + 2, y + 4.5);
      x += colWidths[7];

      // Status pill color
      if (lv.status === 'Approved') {
        doc.setTextColor(16, 185, 129);
      } else if (lv.status === 'Rejected') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(217, 119, 6);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(lv.status, x + 2, y + 4.5);

      y += 6.5;
    });

    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('End of Certified HR Leave Report • LESync PMS Enterprise Administration', margin, y);

    triggerPdfDownload(doc, 'HR_Leave_Absence_Report.pdf', {
      title: 'Monthly Leave & Absence Register',
      subject: `HR Leave & Absence Audit Register (${leaveRequests.length} Records)`,
      author: resortName,
      creator: `${resortName} HR & Talent Management Division`,
      keywords: 'Leave, Absence, HR, Staff, Attendance, Report'
    });
  },

  /**
   * Generates a formal Attendance Audit PDF report (No CSV/Excel)
   */
  generateAttendanceReportPDF(records: AttendanceRecord[]): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 14;

    const sysSettings = pmsService.getState()?.settings;
    const resortName = sysSettings?.resortName || 'Hotel & Resort PMS';
    const logoImg = sysSettings?.logoUrl;

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    // Property Logo
    renderPdfPropertyLogo(doc, margin + 4, y + 3, 24, 16, logoImg, resortName);
    const textStartX = margin + 33;

    // Property Name in Gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text(cleanPdfText(resortName.toUpperCase()), textStartX, y + 6.5);

    // Document Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BIOMETRIC ATTENDANCE & SHIFT ROSTER REPORT', textStartX, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Certified Terminal Attendance Log • Cloud Synchronized Biometrics • Records: ${records.length}`, textStartX, y + 17.5);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7);
    doc.text('Date: ' + new Date().toLocaleDateString('en-GB'), pageWidth - margin - 4, y + 17.5, { align: 'right' });

    y += 26;

    const colWidths = [28, 48, 40, 48, 25, 25, 25, 30];
    const headers = ['Staff ID', 'Employee Name', 'Department', 'Assigned Shift', 'Punch In', 'Punch Out', 'Overtime', 'Status'];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let curX = margin;
    headers.forEach((h, idx) => {
      doc.text(h, curX + 2, y + 4.8);
      curX += colWidths[idx];
    });

    y += 7;

    records.forEach((att, i) => {
      if (y > 185) {
        doc.addPage();
        y = 14;
      }

      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.5, 'FD');
      doc.setDrawColor(226, 232, 240);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let x = margin;
      doc.text(att.employeeCode || 'EMP-1001', x + 2, y + 4.5);
      x += colWidths[0];

      doc.setFont('helvetica', 'bold');
      doc.text(att.name, x + 2, y + 4.5);
      x += colWidths[1];

      doc.setFont('helvetica', 'normal');
      doc.text(att.dept, x + 2, y + 4.5);
      x += colWidths[2];

      doc.text(att.shift, x + 2, y + 4.5);
      x += colWidths[3];

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(att.inTime, x + 2, y + 4.5);
      x += colWidths[4];

      doc.setTextColor(100, 116, 139);
      doc.text(att.outTime || '—', x + 2, y + 4.5);
      x += colWidths[5];

      doc.setTextColor(15, 23, 42);
      doc.text(att.overtimeHours ? `${att.overtimeHours} hrs` : '0.0 hrs', x + 2, y + 4.5);
      x += colWidths[6];

      if (att.status === 'On Time') {
        doc.setTextColor(16, 185, 129);
      } else if (att.status === 'Late' || att.status === 'Absent') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(217, 119, 6);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(att.status, x + 2, y + 4.5);

      y += 6.5;
    });

    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('End of Certified Attendance Audit • LESync PMS Enterprise Administration', margin, y);

    triggerPdfDownload(doc, 'HR_Biometric_Attendance_Report.pdf', {
      title: 'Daily Biometric Attendance & Shift Audit Report',
      subject: `Attendance Audit Log (${records.length} Records)`,
      author: resortName,
      creator: `${resortName} HR & Time/Attendance Division`,
      keywords: 'Attendance, Biometric, Shift, Audit, HR, LESync'
    });
  }
};
