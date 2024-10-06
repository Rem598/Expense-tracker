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
            const response = await fetch('http://localhost:4000/summary');  
    
            console.log('Response headers:', response.headers.get('content-type'));  // Debug response headers
            console.log('Response status:', response.status);  // Debug response status
    
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
    
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const categorySummary = await response.json();
                updateCategorySummaryDOM(categorySummary);
            } else {
                throw new Error('Expected JSON, but got something else.');
            }
    
        
    

            // Check if the summary is empty
            if (categorySummary.length === 0) {
                categoryList.innerHTML = '<li>No expenses found.</li>';
                return;
            }

            // Update the DOM with the fetched data
            updateCategorySummaryDOM(categorySummary);
        } catch (error) {
            console.error('Error fetching category summary:', error);
        }
    }

    fetchCategorySummary(); // Fetch and display category summary on page load
});
