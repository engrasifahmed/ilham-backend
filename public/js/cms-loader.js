document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/public/content');
        if (!response.ok) throw new Error("Failed to fetch CMS content");

        const content = await response.json();

        // Populate elements
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            const key = el.getAttribute('data-cms-key');
            if (content[key]) {
                // If it's an input/textarea (unlikely in public view, but possible)
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = content[key];
                } else if (el.tagName === 'IMG') {
                    // Maybe content is URL?
                    el.src = content[key];
                } else {
                    // Text/HTML
                    // Check if content contains HTML tags, if so use innerHTML, else textContent for safety
                    // For now, we assume simple text unless configured otherwise.
                    // But "content_value" is TEXT type.
                    // Let's allow HTML for flexibility (e.g. bolding).
                    el.innerHTML = content[key];
                }
            }
        });

    } catch (error) {
        console.error("CMS Loader Error:", error);
    }
});
