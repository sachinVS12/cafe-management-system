const getReceiptHTML = (payment, order, companyDetails) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        /* Include your receipt styling here */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
        }
        /* Add more styles as needed */
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Receipt content -->
        <div class="header">
          <h2>${companyDetails.name}</h2>
          <p>${companyDetails.address}</p>
          <p>Phone: ${companyDetails.phone} | Email: ${companyDetails.email}</p>
        </div>
        
        <h3 style="text-align: center;">PAYMENT RECEIPT</h3>
        
        <div class="details">
          <p><strong>Receipt No:</strong> ${payment.receiptNumber}</p>
          <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${order.user.name}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: right;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 10px;">${item.product.name}</td>
                <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;">₹${order.totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>GST (5%):</strong></td>
              <td style="padding: 10px; text-align: right;">₹${(order.totalAmount * 0.05).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>₹${(order.totalAmount * 1.05).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="payment-info" style="margin: 20px 0; padding: 10px; background: #f9f9f9;">
          <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
          <p><strong>Transaction ID:</strong> ${payment.transactionId || "N/A"}</p>
          <p><strong>Payment Status:</strong> ${payment.paymentStatus}</p>
        </div>
        
        <div class="footer" style="text-align: center; margin-top: 30px;">
          <p>Thank you for your business!</p>
          <p>${companyDetails.footerMessage || "Please keep this receipt for future reference"}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getReceiptHTML;
