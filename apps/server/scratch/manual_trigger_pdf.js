const PDFDocument = require('pdfkit');

async function triggerManualWithPDF() {
    const botToken = '8370741817:AAGhEOrUzJ_2yDSVUBPozciGYBGlDPoAIfI';
    const chatId = '-1003704974022';

    const order = {
        code: 'FINAL-FIX-003',
        customer: { firstName: 'Shanmuga', lastName: 'Priya', phoneNumber: '8124413309' },
        shippingAddress: {
            streetLine1: 'NO 82 KAMARAJ NAGAR MAIN ROAD AVADI',
            city: 'CHENNAI',
            province: 'TAMIL NADU',
            postalCode: '600071'
        }
    };

    console.log('Generating PDF (No Overlap Fix)...');
    const pdfBuffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            size: [400, 260], 
            margin: 0,
            autoFirstPage: true
        });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Border and divider
        doc.lineWidth(1);
        doc.rect(10, 10, 380, 240).stroke();
        doc.moveTo(140, 10).lineTo(140, 250).stroke();

        // ---- LEFT SIDE: FROM ----
        // Use lineBreak:false + small font so nothing wraps
        doc.fontSize(8).font('Helvetica-Bold').text('From:', 18, 22, { lineBreak: false });

        doc.fontSize(7.5).font('Helvetica');
        doc.text('Sugabramar Handmade', 18, 36, { lineBreak: false });  // Line 1
        doc.text('Leaf and Flower Design', 18, 48, { lineBreak: false }); // Line 2
        doc.text('Srivilliputhur-626 125', 18, 70, { lineBreak: false });
        doc.text('Phone: 9150424548', 18, 82, { lineBreak: false });

        // ---- RIGHT SIDE: TO ----
        const leftCol = 150;
        const rightWidth = 230;

        doc.fontSize(10).font('Helvetica-Bold').text('TO:', leftCol, 22, { lineBreak: false });
        
        const customerName = `${order.customer.firstName} ${order.customer.lastName}`.toUpperCase();
        doc.fontSize(11).font('Helvetica-Bold').text(customerName, leftCol, 38, { width: rightWidth, lineBreak: false });
        
        doc.fontSize(9).font('Helvetica');
        let y = 58;
        const lines = [
            order.shippingAddress.streetLine1,
            order.shippingAddress.city,
            order.shippingAddress.province,
            `Pincode: ${order.shippingAddress.postalCode}`,
            `Mobile: ${order.customer.phoneNumber}`
        ];
        for (const line of lines) {
            doc.text(line, leftCol, y, { width: rightWidth, lineBreak: false });
            y += 14;
        }

        // REF at bottom right
        doc.fontSize(11).font('Helvetica-Bold').text(`REF: ${order.code}`, 195, 232, { width: 185, align: 'right', lineBreak: false });

        doc.end();
    });

    console.log('Sending to Telegram...');
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', '📦 No Overlap Fix');
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('document', blob, `Label-NoOverlap.pdf`);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    console.log(data);
}

triggerManualWithPDF();
