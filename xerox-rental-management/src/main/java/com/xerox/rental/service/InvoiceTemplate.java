package com.xerox.rental.service;

public class InvoiceTemplate {

    public static String generate(String invoiceNo,
                                  String planName,
                                  double amount,
                                  String startDate,
                                  String endDate) {

        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<style>");
        html.append("body { font-family: Arial; padding:20px; background:#f5f5f5; }");
        html.append(".box { background:white; padding:20px; border-radius:12px;");
        html.append("max-width:600px; margin:auto; box-shadow:0 4px 20px rgba(0,0,0,0.15); }");
        html.append("h2 { color:#007bff; }");
        html.append(".title { font-size:16px; font-weight:bold; margin-top:20px; }");
        html.append("table { width:100%; margin-top:10px; }");
        html.append("td { padding:8px; }");
        html.append(".amount { color:#28a745; font-size:22px; font-weight:bold; }");
        html.append("</style>");
        html.append("</head>");

        html.append("<body>");
        html.append("<div class='box'>");

        html.append("<h2>Subscription Invoice</h2>");
        html.append("<p><b>Invoice No:</b> ").append(invoiceNo).append("</p>");

        html.append("<p class='title'>Plan Details</p>");
        html.append("<table>");
        html.append("<tr><td>Plan:</td><td align='right'>").append(planName).append("</td></tr>");
        html.append("<tr><td>Start Date:</td><td align='right'>").append(startDate).append("</td></tr>");
        html.append("<tr><td>End Date:</td><td align='right'>").append(endDate).append("</td></tr>");
        html.append("</table>");

        html.append("<p class='title'>Amount</p>");
        html.append("<p class='amount'>₹ ").append(String.format("%.2f", amount)).append("</p>");

        html.append("<p style='color:#666;font-size:13px;margin-top:20px;'>");
        html.append("Thank you for choosing our service.");
        html.append("</p>");

        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }
}
