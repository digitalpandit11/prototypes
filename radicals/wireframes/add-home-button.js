const fs = require('fs');
const path = require('path');

// Files to update (excluding already updated ones)
const filesToUpdate = [
    'student-booking.html',
    'student-checkout.html',
    'student-courses.html',
    'student-sessions.html',
    'student-recordings.html',
    'admin-dashboard.html',
    'admin-students.html',
    'admin-mentors.html',
    'admin-payments.html',
    'admin-meet-settings.html',
    'mentor-dashboard.html',
    'mentor-availability.html',
    'mentor-sessions.html',
    'corporate-dashboard.html'
];

// CSS for header pages
const headerLeftCSS = `        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .home-icon {
            color: white;
            font-size: 1.8em;
            text-decoration: none;
            transition: all 0.3s;
            display: flex;
            align-items: center;
        }
        .home-icon:hover {
            transform: scale(1.2);
        }
`;

filesToUpdate.forEach(filename => {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already updated
    if (content.includes('home-icon') || content.includes('🏠')) {
        console.log(`✓ ${filename} - Already updated`);
        return;
    }

    // Add CSS after .header definition
    const headerStylePattern = /(\s+\.header h1 {\s+font-size: 1\.[0-9]em;\s+})/;
    if (headerStylePattern.test(content)) {
        content = content.replace(headerStylePattern, `${headerLeftCSS}$1`);
    }

    // Update header HTML structure
    const headerPattern = /<div class="header">\s+<h1>([^<]+)<\/h1>/;
    if (headerPattern.test(content)) {
        content = content.replace(
            headerPattern,
            `<div class="header">
        <div class="header-left">
            <a href="index.html" class="home-icon" title="Back to Home">🏠</a>
            <h1>$1</h1>
        </div>`
        );

        // Also need to wrap user-info properly - find the next <div class="user-info">
        // and make sure the closing div for header-left is before it
        content = content.replace(
            /(<div class="header-left">[\s\S]*?<\/h1>\s+<\/div>)\s+<div class="user-info">/,
            '$1\n        <div class="user-info">'
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${filename} - Updated successfully`);
});

console.log('\n✨ All files updated!');
