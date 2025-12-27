package com.xerox.rental.service;

import org.springframework.stereotype.Service;
import com.xerox.rental.entity.CompanySettings;
import com.xerox.rental.entity.Invoice;

@Service
public class EmailTemplateService {

    public String buildInvoiceEmail(Invoice invoice, CompanySettings settings) {

    	String logoUrl = (settings != null && settings.getCompanyLogoUrl() != null && !settings.getCompanyLogoUrl().isEmpty())
    	        ? settings.getCompanyLogoUrl()
    	        : null;  // no placeholder

        StringBuilder html = new StringBuilder();

        html.append("<html>");
        html.append("<body style='font-family:Arial; background:#f4f4f4; padding:25px;'>");

        html.append("<table width='100%' style='max-width:600px; margin:auto; background:white;");
        html.append("border-radius:12px; box-shadow:0 4px 14px rgba(0,0,0,0.12);'>");

        // LOGO
        html.append("<tr><td style='text-align:center; padding:25px 15px 10px;'>");
        html.append("<img src='").append(logoUrl).append("' ");
        html.append("style='max-width:160px; height:auto;' alt='Company Logo'/>");
        html.append("</td></tr>");

        // HEADER
        html.append("<tr><td style='padding:0 30px 20px;'>");
        html.append("<h2 style='color:#333;'>Invoice Generated</h2>");
        html.append("<p style='font-size:15px; color:#666;'>Your invoice is ready. Below are the details:</p>");

        // INVOICE DETAILS TABLE
        html.append("<table width='100%' style='margin-top:15px;'>");

        html.append("<tr>");
        html.append("<td style='color:#777; padding:6px 0;'>Invoice Number:</td>");
        html.append("<td style='font-weight:bold; color:#222;'>")
                .append(invoice.getInvoiceNumber()).append("</td>");
        html.append("</tr>");

        html.append("<tr>");
        html.append("<td style='color:#777; padding:6px 0;'>Customer:</td>");
        html.append("<td style='font-weight:bold; color:#222;'>")
                .append(invoice.getRental().getName()).append("</td>");
        html.append("</tr>");

        html.append("<tr>");
        html.append("<td style='color:#777; padding:6px 0;'>Total Amount:</td>");
        html.append("<td style='font-weight:bold; color:#222;'>₹")
                .append(invoice.getTotalAmount()).append("</td>");
        html.append("</tr>");

        html.append("</table>");

        // FOOTER
        html.append("<p style='margin-top:20px; color:#555;'>");
        html.append("The PDF version of your invoice is attached to this email.");
        html.append("</p>");

        html.append("<p style='margin-top:25px; color:#444; font-size:14px;'>");
        html.append("Regards,<br><strong>Rental Management Team</strong>");
        html.append("</p>");

        html.append("</td></tr>");

        html.append("<tr><td style='text-align:center; background:#f0f0f0; padding:12px; ");
        html.append("border-radius:0 0 12px 12px; font-size:12px; color:#888;'>");
        html.append("© ").append(java.time.Year.now()).append(" Rental Management • All rights reserved");
        html.append("</td></tr>");

        html.append("</table>");
        html.append("</body></html>");

        return html.toString();
    }
}
