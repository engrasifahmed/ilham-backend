const fs = require('fs');
const path = require('path');

const dir = 'public/student';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const linkToInsert = `
                <li class="sidebar-item">
                    <a href="ielts-mock.html" class="sidebar-link">
                        <span>Mock Tests</span>
                    </a>
                </li>`;

const targetAnchor = `<a href="ielts-results.html" class="sidebar-link">`;

files.forEach(file => {
    // Skip if it's dashboard or mock itself (already have it)
    if (file === 'dashboard.html' || file === 'ielts-mock.html') return;

    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already present
    if (content.includes('ielts-mock.html')) {
        console.log(`Skipping ${file} - already has mock link`);
        return;
    }

    // Insert before "Results" link
    if (content.includes(targetAnchor)) {
        // Find the parent <li> of the target anchor to insert BEFORE key items
        // The structure is:
        // <li class="sidebar-item">
        //    <a href="ielts-results.html" ...>

        // Let's insert it before the <li class="sidebar-item"> that contains ielts-results.
        // We can search for the line containing ielts-results and go back up to <li>?
        // Or simpler: replace standard block if consistent.

        // Ideally we want it between Courses and Results.
        // Let's search for "ielts-courses.html" block closing </li> and append after it.

        const courseLinkEnd = '</a>\n                </li>';
        const courseLinkSearch = 'href="ielts-courses.html"';

        // Safer Approach: Replace the specific sequence for Courses Item closing and append Mock Item
        // Regex to match the courses list item closing tag
        // <li class="sidebar-item">\n...href="ielts-courses.html"...\n...</li>

        // Let's try simple replacement of the Results LI start.
        // We'll Insert Mock LI right before Results LI.

        const resultsLiStart = `<li class="sidebar-item">\n                    <a href="ielts-results.html"`;

        if (content.indexOf(resultsLiStart) !== -1) {
            const replacement = linkToInsert + '\n                ' + resultsLiStart;
            const newContent = content.replace(resultsLiStart, replacement.trim());
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${file}`);
        } else {
            // Try looser match for spacing
            const regex = /(<li class="sidebar-item">\s*<a href="ielts-results.html")/i;
            if (regex.test(content)) {
                const newContent = content.replace(regex, `${linkToInsert}\n                $1`);
                fs.writeFileSync(filePath, newContent);
                console.log(`Updated ${file} (Regex)`);
            } else {
                console.log(`Could not find insertion point in ${file}`);
            }
        }
    } else {
        console.log(`Skipping ${file} - no sidebar found or different structure`);
    }
});
