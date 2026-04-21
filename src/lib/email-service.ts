import nodemailer from "nodemailer";
import Settings from "@/models/Settings";
import { decryptPassword } from "@/lib/encryption";
import { getEmailTemplate } from "@/lib/email-template";

/**
 * Get email configuration with fallback to environment variables
 * (exact ref repo pattern from config/sendmail.js)
 */
async function getEmailConfig() {
  try {
    const dbConfig = await Settings.findOne();

    if (
      dbConfig?.smtp?.host &&
      dbConfig?.smtp?.user &&
      dbConfig?.smtp?.password
    ) {
      // Decrypt password from DB (exact ref repo pattern)
      const decryptedPassword = decryptPassword(dbConfig.smtp.password);

      return {
        host: dbConfig.smtp.host,
        port: parseInt(String(dbConfig.smtp.port)) || 587,
        auth: {
          user: dbConfig.smtp.user,
          pass: decryptedPassword,
        },
        from: dbConfig.contactEmail || dbConfig.smtp.user,
        secure: parseInt(String(dbConfig.smtp.port)) === 465,
        tls: {
          rejectUnauthorized: false,
        },
      };
    } else {
      // Fallback to environment variables (exact ref repo pattern)
      return {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        },
        from: process.env.SMTP_USER,
        secure: Number(process.env.SMTP_PORT) === 465,
        tls: {
          rejectUnauthorized: false,
        },
      };
    }
  } catch (error) {
    console.error("❌ Error getting email configuration:", error);
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
      from: process.env.SMTP_USER,
      secure: Number(process.env.SMTP_PORT) === 465,
      tls: {
        rejectUnauthorized: false,
      },
    };
  }
}

/**
 * Send order confirmation email with invoice attachment
 */
export const sendOrderConfirmationEmail = async (
  order: any,
  invoicePDFBuffer: Buffer | Uint8Array | null,
) => {
  try {
    // Get email configuration (exact ref repo pattern)
    const emailConfig = await getEmailConfig();

    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn(
        "SMTP configuration missing (checked DB and ENV). Skipping email.",
      );
      return { success: false, message: "SMTP config missing" };
    }

    const transporter = nodemailer.createTransport(emailConfig as any);

    // Get company settings
    const settings = await Settings.findOne();
    const companyName = settings?.shopName || "Sai Nandhini Tasty World";
    const companyEmail = settings?.contactEmail || emailConfig.auth.user;

    const { html, subject } = getEmailTemplate(order, settings);

    // Send email with invoice attachment
    const mailOptions = {
      from: `"${companyName}" <${companyEmail}>`,
      to: order.shippingAddress?.email,
      bcc: companyEmail, // Send copy to admin
      subject:
        subject ||
        `Order Confirmation – #${order._id.toString().slice(-6).toUpperCase()}`,
      html,
      attachments: invoicePDFBuffer
        ? [
            {
              filename: `Invoice-${order._id.toString().slice(-6).toUpperCase()}.pdf`,
              content: Buffer.from(invoicePDFBuffer),
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Order confirmation email sent to ${order.shippingAddress?.email}:`,
      info.messageId,
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    // Do not throw, return failure status so payment flow isn't interrupted
    return { success: false, error: error };
  }
};

/**
 * Send order status update email
 */
export const sendStatusUpdateEmail = async (order: any) => {
  try {
    const emailConfig = await getEmailConfig();

    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn("SMTP configuration missing. Skipping status update email.");
      return { success: false, message: "SMTP config missing" };
    }

    const transporter = nodemailer.createTransport(emailConfig as any);
    const settings = await Settings.findOne();
    const companyName = settings?.shopName || "Sai Nandhini Tasty World";
    const companyEmail = settings?.contactEmail || emailConfig.auth.user;

    let statusMessage = "The status of your order has been updated.";
    if (order.status === "Processing") {
      statusMessage = "We are currently processing your order.";
    } else if (order.status === "Shipping" || order.status === "Shipped") {
      statusMessage = `Your order has been shipped!${order.awbNumber ? ` Tracking Number: <strong>${order.awbNumber}</strong>` : ""}`;
    } else if (order.status === "Delivered") {
      statusMessage =
        "Your order has been delivered successfully. Thank you for shopping with us!";
    }

    const { html, subject } = getEmailTemplate(order, settings, {
      statusMessage,
    });

    const mailOptions = {
      from: `"${companyName}" <${companyEmail}>`,
      to: order.shippingAddress?.email,
      subject:
        subject ||
        `Order Update – #${order._id.toString().slice(-6).toUpperCase()} is now ${order.status}`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Order status update email sent to ${order.shippingAddress?.email}:`,
      info.messageId,
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send order status email:", error);
    return { success: false, error: error };
  }
};

/**
 * Send new order notification explicitly to the admin
 */
export const sendAdminNewOrderEmail = async (order: any, invoicePDFBuffer: Buffer | Uint8Array | null) => {
  try {
    const emailConfig = await getEmailConfig();

    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      return { success: false, message: "SMTP config missing" };
    }

    const transporter = nodemailer.createTransport(emailConfig as any);
    const settings = await Settings.findOne();
    const companyEmail = settings?.contactEmail || emailConfig.auth.user;

    const itemsHtml = order.orderItems.map((item: any) => 
      `<li>${item.qty}x ${item.name} ${item.uom ? `(${item.uom})` : ''} - ₹${item.price}</li>`
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #234d1b;">New Order Received!</h2>
        <p>A new order has been confirmed from <strong>${order.shippingAddress?.fullName}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">#${order._id.toString().slice(-6).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #234d1b; font-weight: bold;">₹${order.totalPrice}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${order.shippingAddress?.email}</td>
          </tr>
        </table>

        <h3 style="margin-top: 20px; color: #234d1b;">Order Items</h3>
        <ul>${itemsHtml}</ul>

        <p style="margin-top: 30px; padding: 15px; background: #fff5e6; border-radius: 8px;">
          Log in to the Admin Dashboard to process this order and update its status.
        </p>
      </div>
    `;

    const mailOptions = {
      from: emailConfig.from || emailConfig.auth.user,
      to: companyEmail, // Admin email
      subject: `🚨 Action Required: New Order #${order._id.toString().slice(-6).toUpperCase()}`,
      html,
      attachments: invoicePDFBuffer ? [
        {
          filename: `Invoice-${order._id.toString().slice(-6).toUpperCase()}.pdf`,
          content: Buffer.from(invoicePDFBuffer),
          contentType: "application/pdf",
        },
      ] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("New order admin notification sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send admin order email:", error);
    return { success: false, error: error };
  }
};
