document.addEventListener('DOMContentLoaded', () => {
    const categoryList = document.getElementById('category-summary');

    async function fetchCategorySummary() {
        try {
            const response = await fetch('http://localhost:4000/category-summary'); 
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            const transactions= await response.json();

            const categorySummary = {};

            transactions.forEach(transaction => {
                if (transaction.type === 'Expense') {
                    if (!categorySummary[transaction.category]) {
                        categorySummary[transaction.category] = 0;
                    }
                    categorySummary[transaction.category] += parseFloat(transaction.amount);
                }
            });

            

            // Check if the category summary is empty
            if (Object.keys(categorySummary).length === 0) {
                categoryList.innerHTML = '<li>No expenses found.</li>';
                return;
            }
            
            categoryList.innerHTML = ''; // Clear existing summary
            Object.keys(categorySummary).forEach(category => {
                const listItem = document.createElement('li');
                listItem.textContent = `${category}: $${categorySummary[category].toFixed(2)}`;
                categoryList.appendChild(listItem);
            });
            
        } catch (error) {
            console.error('Error fetching category summary:', error);
        }
    }

    fetchCategorySummary(); // Fetch and display category summary on page load
});
