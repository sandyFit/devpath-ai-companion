function switchThemeMode() {
    const toggleBtn = document.querySelector('.mode__toggle');
    const title = document.querySelector('h1')
    const body = document.body;

    toggleBtn.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-mode');
        title.classList.toggle('dark-mode');

        toggleBtn.innerHTML = isDark
            ? `<i class="fa-solid fa-sun"></i>`
            : `<i class="fa-solid fa-moon"></i>`;
    });
}
switchThemeMode();

function openAccordionContent() {
    const items = document.querySelectorAll('.accordion__item');

    items.forEach(item => {
        // this will call every btn in each item and each one should have an unique ID thus,
        // it's better to use class to avoid invalid multiple IDs.
        const accordionBtn = item.querySelector('.accordion__btn'); 

        accordionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            items.forEach(i => {
                i.classList.remove('active');
                const btn = i.querySelector('.accordion__btn');
                btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
        });

            // If this item iwas not already active,  activate it and change its icon
            if (!isActive) {
                item.classList.add('active');
                accordionBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
            }
        });
    });
}
openAccordionContent();
