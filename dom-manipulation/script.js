let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");  // Dropdown for filtering

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
  quoteDisplay.innerHTML = `"${quote.text}" — <strong>${quote.category}</strong>`;
}

function createAddQuoteForm() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  // Update categorySelect dropdown if new
  const exists = [...categorySelect.options].some(opt => opt.value.toLowerCase() === category.toLowerCase());
  if (!exists) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  }

  // Update categoryFilter dropdown if new
  const existsFilter = [...categoryFilter.options].some(opt => opt.value.toLowerCase() === category.toLowerCase());
  if (!existsFilter) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  }

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("New quote added!");
  filterQuotes();  // Refresh displayed quotes after adding
}

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

function populateCategories() {
  // Populate categorySelect dropdown
  categorySelect.innerHTML = '<option value="all">All</option>';
  // Populate categoryFilter dropdown
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option1 = document.createElement("option");
    option1.value = cat;
    option1.textContent = cat;
    categorySelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = cat;
    option2.textContent = cat;
    categoryFilter.appendChild(option2);
  });

  // Restore last selected filter
  const savedFilter = localStorage.getItem("lastCategoryFilter");
  if (savedFilter && [...categoryFilter.options].some(o => o.value === savedFilter)) {
    categoryFilter.value = savedFilter;
  }
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("lastCategoryFilter", selected);

  let filteredQuotes = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes found in this category.";
    return;
  }

  quoteDisplay.innerHTML = filteredQuotes
    .map(q => `"${q.text}" — <strong>${q.category}</strong>`)
    .join("<br><br>");
}

function restoreLastQuote() {
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `"${q.text}" — <strong>${q.category}</strong>`;
  }
}

// New function: Simulate fetching quotes from a server (mock sync)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();

    const serverQuotes = data.map(post => ({
      text: post.title,
      category: 'Server'
    }));

    const existingTexts = new Set(quotes.map(q => q.text));
    let newQuotesAdded = false;
    serverQuotes.forEach(q => {
      if (!existingTexts.has(q.text)) {
        quotes.push(q);
        newQuotesAdded = true;
      }
    });

    if (newQuotesAdded) {
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert('Quotes synced from server.');
    }
  } catch (error) {
    console.error('Failed to fetch quotes from server:', error);
  }
}

newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuotes);

window.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  restoreLastQuote();
  filterQuotes();
  fetchQuotesFromServer();  // Sync with server on load
});
