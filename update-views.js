const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.ejs'));

for (const file of files) {
    const filePath = path.join(viewsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove CDNs
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
        if (line.includes('cdn.tailwindcss.com') ||
            line.includes('fonts.googleapis.com') ||
            line.includes('unpkg.com/lucide') ||
            line.includes('jspdf.umd.min.js') ||
            line.includes('jspdf.plugin.autotable.min.js') ||
            line.includes('xlsx.full.min.js')) {
            return false;
        }
        return true;
    });
    content = filteredLines.join('\n');
    
    // Inject head
    if (!content.includes('partials/head') && content.includes('</head>')) {
        content = content.replace('</head>', "  <%- include('partials/head') %>\n</head>");
    }
    
    // Inject footer
    if (!content.includes('partials/footer') && content.includes('</body>')) {
        content = content.replace('</body>', "  <%- include('partials/footer') %>\n</body>");
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
}
