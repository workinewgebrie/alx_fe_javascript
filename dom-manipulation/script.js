let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");

// Save to Local Storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
  quoteDisplay.innerHTML = `"${quote.text}" — <strong>${quote.category}</strong>`;
}

// Add new quote
function createAddQuoteForm() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  updateCategoryOptions(categorySelect, category);
  updateCategoryOptions(categoryFilter, category);

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("New quote added!");
  filterQuotes();
  syncQuotes(); // Also POST to server
}

// Export quotes to JSON
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import quotes from file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        alert("Quotes imported successfully!");
        location.reload();
      } else {
        alert("Invalid file format.");
      }
    } catch (error) {
      alert("Error reading file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Populate both dropdowns
function populateCategories() {
  categorySelect.innerHTML = '<option value="all">All</option>';
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    updateCategoryOptions(categorySelect, cat);
    updateCategoryOptions(categoryFilter, cat);
  });

  const savedFilter = localStorage.getItem("lastCategoryFilter");
  if (savedFilter && [...categoryFilter.options].some(o => o.value === savedFilter)) {
    categoryFilter.value = savedFilter;
  }
}

// Add category to dropdown if missing
function updateCategoryOptions(selectElement, category) {
  const exists = [...selectElement.options].some(opt => opt.value.toLowerCase() === category.toLowerCase());
  if (!exists) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  }
}

// Filter quotes by category
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("lastCategoryFilter", selected);

  const filteredQuotes = selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);

  quoteDisplay.innerHTML = filteredQuotes.length === 0
    ? "No quotes found in this category."
    : filteredQuotes.map(q => `"${q.text}" — <strong>${q.category}</strong>`).join("<br><br>");
}

// Restore from session storage
function restoreLastQuote() {
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `"${q.text}" — <strong>${q.category}</strong>`;
  }
}

// ✅ Fetch quotes from server (GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) throw new Error('Fetch failed');
    const data = await response.json();

    const serverQuotes = data.map(post => ({
      text: post.title,
      category: 'Server'
    }));

    const existingTexts = new Set(quotes.map(q => q.text));
    let added = false;
    serverQuotes.forEach(q => {
      if (!existingTexts.has(q.text)) {
        quotes.push(q);
        added = true;
      }
    });

    if (added) {
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert('Quotes synced from server.');
    }
  } catch (error) {
    console.error('Server sync failed:', error);
  }
}

// ✅ POST new quotes to server
async function syncQuotes() {
  try {
    const latestQuote = quotes[quotes.length - 1];
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(latestQuote)
    });
    console.log("Quote synced to server:", latestQuote);
  } catch (err) {
    console.error("Failed to sync quote:", err);
  }
}

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);

// On page load
window.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  restoreLastQuote();
  filterQuotes();
  fetchQuotesFromServer();
});
