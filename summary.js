document.addEventListener('DOMContentLoaded', () => {
    const categoryList = document.getElementById('summary');

    // Function to update the DOM with the category summary
    function updateCategorySummaryDOM(categorySummary) {
        categoryList.innerHTML = ''; // Clear existing summary
        categorySummary.forEach(category => {
            const listItem = document.createElement('li');
            listItem.textContent = `${category.category}: $${category.total}`;
            categoryList.appendChild(listItem);
        });
    }

    // Fetch the category summary from the server
    async function fetchCategorySummary() {
        try {
            const response = await fetch('http://localhost:4000/category-summary'); // <-- Make sure this matches your backend route

            console.log('Response headers:', response.headers.get('content-type'));  // Debug
            console.log('Response status:', response.status);  // Debug

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Expected JSON, but got something else.');
            }

            const categorySummary = await response.json();

            // Handle empty result
            if (categorySummary.length === 0) {
                categoryList.innerHTML = '<li>No expenses found.</li>';
                return;
            }

            // Update the DOM
            updateCategorySummaryDOM(categorySummary);
        } catch (error) {
            console.error('Error fetching category summary:', error);
            categoryList.innerHTML = `<li>Error loading summary.</li>`;
        }
    }

    fetchCategorySummary(); // Initial load
});
