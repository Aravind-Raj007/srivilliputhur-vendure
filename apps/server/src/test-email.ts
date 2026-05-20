import { createTransport } from 'nodemailer';
import path from 'path';
import 'dotenv/config';

async function sendTestOrderEmail() {
    const transporter = createTransport({
        host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Mock HTML version of your template (since we can't run MJML in a simple script easily)
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <div style="text-align: center; padding: 20px; background: #D4A574; color: white;">
            <h1 style="margin: 0;">SugaBramar</h1>
            <p style="margin: 0;">Order Confirmation</p>
        </div>
        <div style="padding: 20px;">
            <p>Dear Valued Customer,</p>
            <p>Thank you for your order! This is a test of your <b>Order Confirmation</b> template system.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #999;">Order Code</p>
                <p style="margin: 0; font-weight: bold; font-size: 18px;">TEST-12345-ABC</p>
            </div>

            <h3>Order Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0;">1 x Handmade Flower Garland</td>
                    <td style="text-align: right;">₹999.00</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; font-weight: bold;">Total:</td>
                    <td style="text-align: right; font-weight: bold;">₹999.00</td>
                </tr>
            </table>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions, contact us at orders@sugabramar.com
            </p>
        </div>
    </div>
    `;

    console.log('Sending test template email to:', process.env.EMAIL_USER);

    try {
        const info = await transporter.sendMail({
            from: `"SugaBramar Orders" <${process.env.EMAIL_USER}>`,
            to: 'kingar0071@gmail.com', // Updated recipient
            subject: 'SugaBramar - Order Confirmation (Test)',
            html: html,
        });
        console.log('✅ Success! Test email sent to kingar0071@gmail.com. ID:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send:', error);
    }
}

sendTestOrderEmail();
