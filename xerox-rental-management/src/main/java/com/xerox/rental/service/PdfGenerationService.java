package com.xerox.rental.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.itextpdf.text.BadElementException;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.List;
import com.itextpdf.text.ListItem;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.xerox.rental.entity.Invoice;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.entity.User;

@Service
public class PdfGenerationService {

    @Autowired
    private CompanySettingsService companySettingsService; // reserved for future use

    // Slightly larger fonts but still compact for single-page
    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, new BaseColor(0, 51, 102));
    private static final Font HEADING_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.BLACK);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.BLACK);
    private static final Font SMALL_FONT = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, new BaseColor(100, 100, 100));
    private static final Font BOLD_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.BLACK);
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    // Convert stored path like "/uploads/company/abc.png" to API URL
    private static final String IMAGE_API_PREFIX = "http://localhost:8080/api/company-settings/image/";

    public byte[] generateInvoicePdf(Invoice invoice, Machine machine, User rental, User owner) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4, 28, 28, 28, 38);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        document.addTitle("Tax Invoice - " + (invoice != null ? invoice.getInvoiceNumber() : ""));
        document.addAuthor(owner != null && owner.getName() != null ? owner.getName() : "Xerox Rental");
        document.addCreator("Xerox Rental Management System");
        document.addSubject("Tax Invoice");

        document.open();

        // Header layout B: Logo left, TAX INVOICE centered
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1f, 1f, 1f});
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        // Left cell: Logo
        PdfPCell leftLogoCell = new PdfPCell();
        leftLogoCell.setBorder(Rectangle.NO_BORDER);
        leftLogoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        leftLogoCell.setPadding(4);

        if (invoice != null && invoice.getCompanyLogoUrl() != null && !invoice.getCompanyLogoUrl().isEmpty()) {
            try {
                Image logo = loadImageFromUrl(convertToPublicImageUrl(invoice.getCompanyLogoUrl()));
                if (logo != null) {
                    // Slightly larger logo than previous
                    logo.scaleToFit(140, 60);
                    leftLogoCell.addElement(logo);
                }
            } catch (Exception e) {
                System.err.println("Error loading logo: " + e.getMessage());
            }
        }
        headerTable.addCell(leftLogoCell);

        // Center cell: TAX INVOICE (centered)
        PdfPCell centerTitleCell = new PdfPCell();
        centerTitleCell.setBorder(Rectangle.NO_BORDER);
        centerTitleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerTitleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        centerTitleCell.setPadding(4);

        Paragraph title = new Paragraph("TAX INVOICE", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        centerTitleCell.addElement(title);

        headerTable.addCell(centerTitleCell);

        // Right cell: small placeholder (keeps title centered)
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(4);
        headerTable.addCell(rightCell);

        document.add(headerTable);

        // Company details centered below header
        Paragraph companyDetails = new Paragraph();
        companyDetails.setAlignment(Element.ALIGN_CENTER);
        String companyName = owner != null && owner.getName() != null ? owner.getName() : "";
        if (!companyName.isEmpty()) {
            companyDetails.add(new Chunk(companyName + "\n", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD)));
        }
        String addressLine = (owner != null && owner.getAddress() != null) ? owner.getAddress() : "";
        if (!addressLine.isEmpty()) {
            companyDetails.add(new Chunk(addressLine + "\n", SMALL_FONT));
        }
        String contactLine = "";
        if (owner != null && owner.getContactNumber() != null) contactLine += "Phone: " + owner.getContactNumber() + "  ";
        if (owner != null && owner.getEmail() != null) contactLine += "Email: " + owner.getEmail() + "  ";
        if (owner != null && owner.getGstNumber() != null) contactLine += "GSTIN: " + owner.getGstNumber();
        if (!contactLine.trim().isEmpty()) {
            companyDetails.add(new Chunk(contactLine + "\n", SMALL_FONT));
        }
        document.add(companyDetails);

        // Small separator
        LineSeparator headerSep = new LineSeparator();
        headerSep.setLineColor(new BaseColor(200, 200, 200));
        document.add(new Chunk(headerSep));

        // Invoice Information (2-columns)
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1f, 1f});
        infoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        PdfPCell leftInfoCell = new PdfPCell();
        leftInfoCell.setBorder(Rectangle.NO_BORDER);
        leftInfoCell.setPadding(4);

        Paragraph invoiceInfo = new Paragraph();
        invoiceInfo.add(new Chunk("Invoice Number: ", BOLD_FONT));
        invoiceInfo.add(new Chunk(invoice != null && invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() + "\n" : "-\n", NORMAL_FONT));
        if (invoice != null && invoice.getCreatedAt() != null) {
            invoiceInfo.add(new Chunk("Invoice Date: ", BOLD_FONT));
            invoiceInfo.add(new Chunk(invoice.getCreatedAt().format(DATE_FORMAT) + "\n", NORMAL_FONT));
        }
        if (invoice != null && invoice.getDueDate() != null) {
            invoiceInfo.add(new Chunk("Due Date: ", BOLD_FONT));
            invoiceInfo.add(new Chunk(invoice.getDueDate().format(DATE_FORMAT) + "\n", NORMAL_FONT));
        }
        if (invoice != null && invoice.getClassification() != null && !invoice.getClassification().isEmpty()) {
            invoiceInfo.add(new Chunk("Type: ", BOLD_FONT));
            invoiceInfo.add(new Chunk(invoice.getClassification() + "\n", NORMAL_FONT));
        }
        leftInfoCell.addElement(invoiceInfo);
        infoTable.addCell(leftInfoCell);

        PdfPCell rightInfoCell = new PdfPCell();
        rightInfoCell.setBorder(Rectangle.NO_BORDER);
        rightInfoCell.setPadding(4);
        rightInfoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        if (invoice != null && invoice.getStatus() != null && "PAID".equals(invoice.getStatus().toString()) && invoice.getPaidDate() != null) {
            Paragraph paymentInfo = new Paragraph();
            paymentInfo.add(new Chunk("Payment Date: ", BOLD_FONT));
            paymentInfo.add(new Chunk(invoice.getPaidDate().format(DATE_FORMAT) + "\n", NORMAL_FONT));
            if (invoice.getPaymentMode() != null) {
                paymentInfo.add(new Chunk("Payment Mode: ", BOLD_FONT));
                paymentInfo.add(new Chunk(invoice.getPaymentMode().toString() + "\n", NORMAL_FONT));
            }
            paymentInfo.setAlignment(Element.ALIGN_RIGHT);
            rightInfoCell.addElement(paymentInfo);
        }
        infoTable.addCell(rightInfoCell);

        document.add(infoTable);

        // Bill From / Bill To
        PdfPTable billTable = new PdfPTable(2);
        billTable.setWidthPercentage(100);
        billTable.setWidths(new float[]{1f, 1f});
        billTable.setSpacingBefore(6);
        billTable.setSpacingAfter(4);

        PdfPCell fromCell = new PdfPCell();
        fromCell.setBorder(Rectangle.BOX);
        fromCell.setBorderColor(new BaseColor(200, 200, 200));
        fromCell.setPadding(6);
        fromCell.setBackgroundColor(new BaseColor(250, 250, 250));

        Paragraph fromPara = new Paragraph();
        fromPara.add(new Chunk("BILL FROM\n", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 51, 102))));
        fromPara.add(new Chunk("\n" + (owner != null && owner.getName() != null ? owner.getName() : "-") + "\n", BOLD_FONT));
        if (owner != null && owner.getAddress() != null && !owner.getAddress().isEmpty()) {
            fromPara.add(new Chunk(owner.getAddress() + "\n", SMALL_FONT));
        }
        if (owner != null && owner.getContactNumber() != null) {
            fromPara.add(new Chunk("Phone: " + owner.getContactNumber() + "\n", SMALL_FONT));
        }
        if (owner != null && owner.getEmail() != null) {
            fromPara.add(new Chunk("Email: " + owner.getEmail() + "\n", SMALL_FONT));
        }
        if (owner != null && owner.getGstNumber() != null && !owner.getGstNumber().isEmpty()) {
            fromPara.add(new Chunk("GSTIN: " + owner.getGstNumber(), SMALL_FONT));
        }
        fromCell.addElement(fromPara);
        billTable.addCell(fromCell);

        PdfPCell toCell = new PdfPCell();
        toCell.setBorder(Rectangle.BOX);
        toCell.setBorderColor(new BaseColor(200, 200, 200));
        toCell.setPadding(6);
        toCell.setBackgroundColor(new BaseColor(250, 250, 250));

        Paragraph toPara = new Paragraph();
        toPara.add(new Chunk("BILL TO\n", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 51, 102))));
        toPara.add(new Chunk("\n" + (rental != null && rental.getName() != null ? rental.getName() : "-") + "\n", BOLD_FONT));
        if (rental != null && rental.getAddress() != null && !rental.getAddress().isEmpty()) {
            toPara.add(new Chunk(rental.getAddress() + "\n", SMALL_FONT));
        }
        if (rental != null && rental.getContactNumber() != null) {
            toPara.add(new Chunk("Phone: " + rental.getContactNumber() + "\n", SMALL_FONT));
        }
        if (rental != null && rental.getEmail() != null) {
            toPara.add(new Chunk("Email: " + rental.getEmail() + "\n", SMALL_FONT));
        }
        if (rental != null && rental.getGstNumber() != null && !rental.getGstNumber().isEmpty()) {
            toPara.add(new Chunk("GSTIN: " + rental.getGstNumber(), SMALL_FONT));
        }
        toCell.addElement(toPara);
        billTable.addCell(toCell);

        document.add(billTable);

        // Machine details
        PdfPTable machineTable = new PdfPTable(1);
        machineTable.setWidthPercentage(100);
        machineTable.setSpacingBefore(4);
        machineTable.setSpacingAfter(4);

        PdfPCell machineCell = new PdfPCell();
        machineCell.setBorder(Rectangle.BOX);
        machineCell.setBorderColor(new BaseColor(200, 200, 200));
        machineCell.setPadding(6);
        machineCell.setBackgroundColor(new BaseColor(240, 248, 255));

        Paragraph machinePara = new Paragraph();
        machinePara.add(new Chunk("EQUIPMENT DETAILS\n", new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, new BaseColor(0, 51, 102))));
        machinePara.add(new Chunk("\n", NORMAL_FONT));
        machinePara.add(new Chunk("Equipment Name: ", BOLD_FONT));
        machinePara.add(new Chunk(machine != null && machine.getName() != null ? machine.getName() + "\n" : "-\n", NORMAL_FONT));
        machinePara.add(new Chunk("Model: ", BOLD_FONT));
        machinePara.add(new Chunk(machine != null && machine.getModel() != null ? machine.getModel() + "\n" : "-\n", NORMAL_FONT));
        machinePara.add(new Chunk("Serial Number: ", BOLD_FONT));
        machinePara.add(new Chunk(machine != null && machine.getSerialNumber() != null ? machine.getSerialNumber() : "-", NORMAL_FONT));
        machineCell.addElement(machinePara);
        machineTable.addCell(machineCell);

        document.add(machineTable);

        // Usage details
        if (invoice != null && (invoice.getStartingReading() != null || invoice.getTotalCopies() != null)) {
            PdfPTable usageTable = new PdfPTable(4);
            usageTable.setWidthPercentage(100);
            usageTable.setWidths(new float[]{1f, 1f, 1f, 1f});
            usageTable.setSpacingBefore(4);
            usageTable.setSpacingAfter(4);

            BaseColor headerBg = new BaseColor(0, 51, 102);
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.WHITE);

            usageTable.addCell(createStyledHeaderCell("Starting Reading", headerFont, headerBg));
            usageTable.addCell(createStyledHeaderCell("Closing Reading", headerFont, headerBg));
            usageTable.addCell(createStyledHeaderCell("Total Copies", headerFont, headerBg));
            usageTable.addCell(createStyledHeaderCell("Billable Copies", headerFont, headerBg));

            usageTable.addCell(createStyledDataCell(invoice.getStartingReading() != null ? String.format("%,d", invoice.getStartingReading()) : "-"));
            usageTable.addCell(createStyledDataCell(invoice.getClosingReading() != null ? String.format("%,d", invoice.getClosingReading()) : "-"));
            usageTable.addCell(createStyledDataCell(invoice.getTotalCopies() != null ? String.format("%,d", invoice.getTotalCopies()) : "-"));
            usageTable.addCell(createStyledDataCell(invoice.getBillableCopies() != null ? String.format("%,d", invoice.getBillableCopies()) : "-"));

            document.add(usageTable);
        }

        // Amount breakdown (right aligned)
        PdfPTable amountTable = new PdfPTable(2);
        amountTable.setWidthPercentage(65);
        amountTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        amountTable.setWidths(new float[]{3f, 1.5f});
        amountTable.setSpacingBefore(4);

        BaseColor lightGray = new BaseColor(245, 245, 245);

        if (invoice != null && invoice.getMonthlyRent() != null && invoice.getMonthlyRent() > 0) {
            amountTable.addCell(createAmountLabelCell("Monthly Rental"));
            amountTable.addCell(createAmountValueCell("₹ " + CURRENCY_FORMAT.format(invoice.getMonthlyRent())));
        }

        if (invoice != null && invoice.getCopyRatio() != null && invoice.getBillableCopies() != null && invoice.getBillableCopies() > 0) {
            String copyDesc = String.format("Copy Charges (%,d copies × ₹%.2f)", invoice.getBillableCopies(), invoice.getCopyRatio());
            amountTable.addCell(createAmountLabelCell(copyDesc));
            amountTable.addCell(createAmountValueCell("₹ " + CURRENCY_FORMAT.format(invoice.getBillableCopies() * invoice.getCopyRatio())));
        }

        amountTable.addCell(createAmountLabelCell("Subtotal"));
        amountTable.addCell(createAmountValueCell("₹ " + CURRENCY_FORMAT.format(invoice != null && invoice.getAmount() != null ? invoice.getAmount() : 0.0)));

        amountTable.addCell(createAmountLabelCell("GST @ 18%"));
        amountTable.addCell(createAmountValueCell("₹ " + CURRENCY_FORMAT.format(invoice != null && invoice.getGstAmount() != null ? invoice.getGstAmount() : 0.0)));

        PdfPCell totalLabelCell = createAmountLabelCell("TOTAL AMOUNT");
        totalLabelCell.setBackgroundColor(lightGray);
        totalLabelCell.setBorder(Rectangle.BOX);
        totalLabelCell.setBorderColor(new BaseColor(200, 200, 200));
        totalLabelCell.setPadding(6);
        Font totalLabelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.BLACK);
        totalLabelCell.setPhrase(new Phrase("TOTAL AMOUNT", totalLabelFont));
        amountTable.addCell(totalLabelCell);

        PdfPCell totalValueCell = createAmountValueCell("₹ " + CURRENCY_FORMAT.format(invoice != null && invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0));
        totalValueCell.setBackgroundColor(lightGray);
        totalValueCell.setBorder(Rectangle.BOX);
        totalValueCell.setBorderColor(new BaseColor(200, 200, 200));
        totalValueCell.setPadding(6);
        Font totalValueFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, new BaseColor(0, 51, 102));
        totalValueCell.setPhrase(new Phrase("₹ " + CURRENCY_FORMAT.format(invoice != null && invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0), totalValueFont));
        amountTable.addCell(totalValueCell);

        document.add(amountTable);

        // Payment details
        if (owner != null && (owner.getBankAccountNumber() != null || owner.getUpiId() != null)) {
            Paragraph bankHeading = new Paragraph("PAYMENT DETAILS", new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, new BaseColor(0, 51, 102)));
            bankHeading.setSpacingBefore(6);
            document.add(bankHeading);

            Paragraph bankDetails = new Paragraph();
            if (owner.getBankName() != null) {
                bankDetails.add(new Chunk("Bank Name: ", BOLD_FONT));
                bankDetails.add(new Chunk(owner.getBankName() + "\n", NORMAL_FONT));
            }
            if (owner.getBankAccountHolderName() != null) {
                bankDetails.add(new Chunk("Account Holder: ", BOLD_FONT));
                bankDetails.add(new Chunk(owner.getBankAccountHolderName() + "\n", NORMAL_FONT));
            }
            if (owner.getBankIfscCode() != null) {
                bankDetails.add(new Chunk("IFSC Code: ", BOLD_FONT));
                bankDetails.add(new Chunk(owner.getBankIfscCode() + "\n", NORMAL_FONT));
            }
            if (owner.getUpiId() != null) {
                bankDetails.add(new Chunk("UPI ID: ", BOLD_FONT));
                bankDetails.add(new Chunk(owner.getUpiId() + "\n", NORMAL_FONT));
            }
            document.add(bankDetails);
        }

        // Terms
        Paragraph terms = new Paragraph("Terms & Conditions:", new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.BLACK));
        terms.setSpacingBefore(6);
        document.add(terms);

        Paragraph termsContent = new Paragraph(
                "1. Payment is due within the specified due date.\n" +
                        "2. Late payments may incur additional charges.\n" +
                        "3. All disputes subject to local jurisdiction only.",
                new Font(Font.FontFamily.HELVETICA, 7, Font.NORMAL, new BaseColor(80, 80, 80))
        );
        document.add(termsContent);

        // Signature & Stamp
        PdfPTable signatureTable = new PdfPTable(2);
        signatureTable.setWidthPercentage(100);
        signatureTable.setWidths(new float[]{1f, 1f});
        signatureTable.setSpacingBefore(8);

        PdfPCell stampCell = new PdfPCell();
        stampCell.setBorder(Rectangle.NO_BORDER);
        stampCell.setPadding(4);
        stampCell.setVerticalAlignment(Element.ALIGN_BOTTOM);

        if (invoice != null && invoice.getStampImageUrl() != null && !invoice.getStampImageUrl().isEmpty()) {
            try {
                Image stamp = loadImageFromUrl(convertToPublicImageUrl(invoice.getStampImageUrl()));
                if (stamp != null) {
                    stamp.scaleToFit(80, 50);
                    stamp.setAlignment(Element.ALIGN_LEFT);
                    stampCell.addElement(stamp);
                }
            } catch (Exception e) {
                System.err.println("Error loading stamp: " + e.getMessage());
            }
        }
        Paragraph stampLabel = new Paragraph("Company Seal", SMALL_FONT);
        stampLabel.setAlignment(Element.ALIGN_LEFT);
        stampCell.addElement(stampLabel);
        signatureTable.addCell(stampCell);

        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBorder(Rectangle.NO_BORDER);
        signatureCell.setPadding(4);
        signatureCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        signatureCell.setVerticalAlignment(Element.ALIGN_BOTTOM);

        if (invoice != null && invoice.getSignatureImageUrl() != null && !invoice.getSignatureImageUrl().isEmpty()) {
            try {
                Image signature = loadImageFromUrl(convertToPublicImageUrl(invoice.getSignatureImageUrl()));
                if (signature != null) {
                    signature.scaleToFit(100, 40);
                    signature.setAlignment(Element.ALIGN_RIGHT);
                    signatureCell.addElement(signature);
                }
            } catch (Exception e) {
                System.err.println("Error loading signature: " + e.getMessage());
            }
        }
        Paragraph sigLine = new Paragraph("_________________________\nAuthorized Signatory", SMALL_FONT);
        sigLine.setAlignment(Element.ALIGN_RIGHT);
        signatureCell.addElement(sigLine);
        signatureTable.addCell(signatureCell);

        document.add(signatureTable);

        // Footer
        LineSeparator footerLine = new LineSeparator();
        footerLine.setLineColor(new BaseColor(200, 200, 200));
        document.add(new Chunk(footerLine));

        Paragraph footer = new Paragraph(
                "This is a computer-generated invoice and does not require a physical signature.\n" +
                        "For queries, please contact: " + (owner != null && owner.getEmail() != null ? owner.getEmail() : (owner != null ? owner.getContactNumber() : "")),
                new Font(Font.FontFamily.HELVETICA, 7, Font.ITALIC, new BaseColor(120, 120, 120))
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(4);
        document.add(footer);

        document.close();
        writer.close();

        return outputStream.toByteArray();
    }

    /**
     * Convert stored image path (e.g. "/uploads/company/xxx.png" or "uploads/company/xxx.png")
     * to public API endpoint: http://localhost:8080/api/company-settings/image/{fileName}
     */
    private String convertToPublicImageUrl(String url) {
        if (url == null || url.isEmpty()) return url;
        // If it's already the API URL, return as-is
        if (url.contains("/api/company-settings/image")) return url;

        try {
            String fileName = url.substring(url.lastIndexOf("/") + 1);
            return IMAGE_API_PREFIX + fileName;
        } catch (Exception e) {
            return url;
        }
    }

    private Image loadImageFromUrl(String imageUrl) throws IOException, BadElementException {
        if (imageUrl == null || imageUrl.isEmpty()) return null;
        try {
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.connect();

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                try (InputStream inputStream = connection.getInputStream()) {
                    BufferedImage bufferedImage = ImageIO.read(inputStream);
                    if (bufferedImage != null) {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        ImageIO.write(bufferedImage, "png", baos);
                        return Image.getInstance(baos.toByteArray());
                    }
                }
            } else {
                System.err.println("Failed to load image from URL: " + imageUrl + " (HTTP " + responseCode + ")");
            }
        } catch (Exception e) {
            System.err.println("Error loading image from URL: " + imageUrl);
            e.printStackTrace();
        }
        return null;
    }

    private PdfPCell createStyledHeaderCell(String text, Font font, BaseColor bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BaseColor.WHITE);
        return cell;
    }

    private PdfPCell createStyledDataCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(220, 220, 220));
        return cell;
    }

    private PdfPCell createAmountLabelCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(4);
        return cell;
    }

    private PdfPCell createAmountValueCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, BOLD_FONT));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(4);
        return cell;
    }

    // --------------------
    // Subscription PDF (tightened similar style)
    // --------------------
    public byte[] generateSubscriptionInvoicePdf(Subscription subscription) throws DocumentException, IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 32, 32, 36, 36);
        PdfWriter.getInstance(document, baos);
        document.open();

        User owner = subscription.getUser();
        SubscriptionPlan plan = subscription.getPlan();

        Paragraph title = new Paragraph("SUBSCRIPTION INVOICE", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(8);
        document.add(title);

        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1f, 1f});

        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setPadding(4);

        Paragraph invoicePara = new Paragraph();
        invoicePara.add(new Chunk("Invoice Number: ", BOLD_FONT));
        invoicePara.add(new Chunk((subscription.getInvoiceNumber() != null ? subscription.getInvoiceNumber() : "N/A") + "\n", NORMAL_FONT));
        invoicePara.add(new Chunk("Date: ", BOLD_FONT));
        String dateStr = subscription.getPaymentVerifiedAt() != null ? subscription.getPaymentVerifiedAt().toLocalDate().toString() : subscription.getCreatedAt().toLocalDate().toString();
        invoicePara.add(new Chunk(dateStr, NORMAL_FONT));
        invoiceCell.addElement(invoicePara);
        headerTable.addCell(invoiceCell);

        PdfPCell statusCell = new PdfPCell();
        statusCell.setBorder(Rectangle.NO_BORDER);
        statusCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        statusCell.setPadding(4);
        Paragraph statusPara = new Paragraph();
        statusPara.add(new Chunk("Status: ", BOLD_FONT));
        statusPara.add(new Chunk(subscription.getStatus().name() + "\n", NORMAL_FONT));
        statusPara.add(new Chunk("Payment Method: ", BOLD_FONT));
        statusPara.add(new Chunk(subscription.getPaymentMethod(), NORMAL_FONT));
        statusCell.addElement(statusPara);
        headerTable.addCell(statusCell);

        document.add(headerTable);

        PdfPTable customerTable = new PdfPTable(1);
        customerTable.setWidthPercentage(100);
        customerTable.setSpacingBefore(6);
        customerTable.setSpacingAfter(8);

        PdfPCell customerCell = new PdfPCell();
        customerCell.setBorder(Rectangle.BOX);
        customerCell.setBorderColor(new BaseColor(200, 200, 200));
        customerCell.setPadding(8);
        customerCell.setBackgroundColor(new BaseColor(248, 249, 250));

        Paragraph customerPara = new Paragraph();
        customerPara.add(new Chunk("BILLED TO\n", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 51, 102))));
        customerPara.add(new Chunk("\n", NORMAL_FONT));
        customerPara.add(new Chunk(owner != null && owner.getName() != null ? owner.getName() + "\n" : "-\n", BOLD_FONT));
        if (owner != null && owner.getEmail() != null) {
            customerPara.add(new Chunk("Email: " + owner.getEmail() + "\n", NORMAL_FONT));
        }
        if (owner != null && owner.getContactNumber() != null) {
            customerPara.add(new Chunk("Phone: " + owner.getContactNumber() + "\n", NORMAL_FONT));
        }
        if (owner != null && owner.getGstNumber() != null) {
            customerPara.add(new Chunk("GST Number: " + owner.getGstNumber() + "\n", NORMAL_FONT));
        }
        if (owner != null && owner.getAddress() != null) {
            customerPara.add(new Chunk("Address: " + owner.getAddress(), NORMAL_FONT));
        }
        customerCell.addElement(customerPara);
        customerTable.addCell(customerCell);
        document.add(customerTable);

        PdfPTable detailsTable = new PdfPTable(4);
        detailsTable.setWidthPercentage(100);
        detailsTable.setWidths(new float[]{2.5f, 1f, 1f, 1.5f});
        detailsTable.setSpacingBefore(6);
        detailsTable.setSpacingAfter(8);

        BaseColor headerBg = new BaseColor(0, 51, 102);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BaseColor.WHITE);

        addTableHeader(detailsTable, "Plan Description", headerBg, headerFont);
        addTableHeader(detailsTable, "Billing Cycle", headerBg, headerFont);
        addTableHeader(detailsTable, "Duration", headerBg, headerFont);
        addTableHeader(detailsTable, "Amount", headerBg, headerFont);

        addTableCell(detailsTable, plan != null ? plan.getName() + "\n" + (plan.getDescription() != null ? plan.getDescription() : "") : "-");
        addTableCell(detailsTable, subscription.getBillingCycle().name());

        String duration = subscription.getBillingCycle() == Subscription.BillingCycle.MONTHLY ? "1 Month" : "1 Year";
        addTableCell(detailsTable, duration);
        addTableCell(detailsTable, String.format("₹%.2f", subscription.getAmountPaid()));

        document.add(detailsTable);

        Paragraph featureTitle = new Paragraph("Plan Features:", BOLD_FONT);
        featureTitle.setSpacingBefore(6);
        document.add(featureTitle);

        List featureList = new List(List.UNORDERED);
        if (plan != null) {
            if (plan.getMachineLimit() == null) {
                featureList.add(new ListItem("Unlimited machines", NORMAL_FONT));
            } else {
                featureList.add(new ListItem("Up to " + plan.getMachineLimit() + " machines", NORMAL_FONT));
            }
        }
        featureList.add(new ListItem("24/7 Support", NORMAL_FONT));
        featureList.add(new ListItem("Advanced Analytics", NORMAL_FONT));
        featureList.add(new ListItem("Invoice Management", NORMAL_FONT));
        featureList.add(new ListItem("Contract Management", NORMAL_FONT));
        document.add(featureList);

        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setWidthPercentage(50);
        totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.setWidths(new float[]{1f, 1f});
        totalTable.setSpacingBefore(6);

        addTotalRow(totalTable, "Subtotal:", String.format("₹%.2f", subscription.getAmountPaid()));

        double gstAmount = subscription.getAmountPaid() * 0.18;
        double totalWithGst = subscription.getAmountPaid() + gstAmount;

        addTotalRow(totalTable, "GST (18%):", String.format("₹%.2f", gstAmount));

        PdfPCell labelCell = new PdfPCell(new Phrase("Total Amount:", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD)));
        labelCell.setBorder(Rectangle.TOP);
        labelCell.setBorderColor(BaseColor.BLACK);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(6);
        totalTable.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(String.format("₹%.2f", totalWithGst),
                new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(0, 102, 51))));
        valueCell.setBorder(Rectangle.TOP);
        valueCell.setBorderColor(BaseColor.BLACK);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(6);
        totalTable.addCell(valueCell);

        document.add(totalTable);

        Paragraph paymentTitle = new Paragraph("Payment Details:", BOLD_FONT);
        paymentTitle.setSpacingBefore(8);
        document.add(paymentTitle);

        Paragraph paymentDetails = new Paragraph();
        paymentDetails.add(new Chunk("Transaction ID: ", BOLD_FONT));
        paymentDetails.add(new Chunk((subscription.getTransactionId() != null ? subscription.getTransactionId() : "N/A") + "\n", NORMAL_FONT));
        paymentDetails.add(new Chunk("Payment Date: ", BOLD_FONT));
        String paymentDate = subscription.getPaymentVerifiedAt() != null ? subscription.getPaymentVerifiedAt().toLocalDate().toString() : subscription.getCreatedAt().toLocalDate().toString();
        paymentDetails.add(new Chunk(paymentDate + "\n", NORMAL_FONT));
        paymentDetails.add(new Chunk("Subscription Period: ", BOLD_FONT));
        paymentDetails.add(new Chunk(subscription.getStartDate().toLocalDate() + " to " + subscription.getEndDate().toLocalDate(), NORMAL_FONT));
        document.add(paymentDetails);

        Paragraph footer = new Paragraph("Thank you for your business!", NORMAL_FONT);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(8);
        document.add(footer);

        Paragraph contact = new Paragraph("For any queries, please contact support@xeroxrental.com",
                new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY));
        contact.setAlignment(Element.ALIGN_CENTER);
        document.add(contact);

        document.close();
        return baos.toByteArray();
    }

    private void addTotalRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, NORMAL_FONT));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(4);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, BOLD_FONT));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(4);
        table.addCell(valueCell);
    }

    private void addTableHeader(PdfPTable table, String text, BaseColor bgColor, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        cell.setBorderColor(BaseColor.WHITE);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorderColor(new BaseColor(200, 200, 200));
        table.addCell(cell);
    }
    
}
