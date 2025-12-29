// travel_recommendation.js
// Task 6/7/8/9 (+ optional Task 10):
// - Fetches travel_recommendation_api.json using fetch()
// - console.log()s the loaded data to verify access
// - Accepts keyword variations (beach/beaches, temple/temples, case-insensitive)
// - Matches countries by name and shows their cities
// - Shows results ONLY after clicking Search
// - Clear/Reset button clears results
// - OPTIONAL Task 10: shows local time for recommended places (timeZone from JSON or fallback map)

const DATA_URL = "./travel_recommendation_api.json";

let travelData = null; // holds fetched JSON

// Optional: fallback map place-name -> IANA time zone (used if JSON item has no timeZone field)
const TIMEZONE_MAP = {
  "new york": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "london": "Europe/London",
  "paris": "Europe/Paris",
  "tokyo": "Asia/Tokyo",
  "dubai": "Asia/Dubai",
  "sydney": "Australia/Sydney",
  "karachi": "Asia/Karachi"
};

// ---------- Helpers ----------
function $(id) {
  return document.getElementById(id);
}

// ---------- Fetch JSON ----------
async function loadTravelData() {
  try {
    const res = await fetch(DATA_URL);

    if (!res.ok) {
      throw new Error(`Failed to fetch JSON. Status: ${res.status}`);
    }

    travelData = await res.json();

    // ✅ REQUIRED: check output while developing
    console.log("Travel data loaded successfully:", travelData);
  } catch (err) {
    console.error("Error loading travel data:", err);
  }
}

// ---------- Normalize/flatten data for searching ----------
function flattenAllData(data) {
  const all = [];

  // temples
  if (Array.isArray(data?.temples)) all.push(...data.temples);

  // beaches
  if (Array.isArray(data?.beaches)) all.push(...data.beaches);

  // countries -> cities
  if (Array.isArray(data?.countries)) {
    data.countries.forEach((country) => {
      if (Array.isArray(country?.cities)) {
        all.push(...country.cities);
      }
    });
  }

  return all;
}

// ---------- OPTIONAL Task 10: Country/City local time ----------
function getTimeZoneForItem(item) {
  // 1) Prefer JSON field if provided
  if (item && item.timeZone) return item.timeZone;

  // 2) Fallback to TIMEZONE_MAP using item name
  const name = (item?.name || "").trim().toLowerCase();
  return TIMEZONE_MAP[name] || null;
}

function getCurrentTimeInTimeZone(timeZone) {
  try {
    const options = {
      timeZone,
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    };
    return new Date().toLocaleTimeString("en-US", options);
  } catch (e) {
    // Invalid time zones can throw a RangeError
    console.warn("Invalid timeZone:", timeZone);
    return null;
  }
}

function updateAllClocks() {
  // Updates any clock elements currently shown in results
  const clocks = document.querySelectorAll("[data-timezone]");
  clocks.forEach((el) => {
    const tz = el.getAttribute("data-timezone");
    const t = getCurrentTimeInTimeZone(tz);
    if (t) el.textContent = `Local time: ${t}`;
  });
}

// ---------- UI rendering ----------
function clearResults() {
  const results = $("results");
  if (results) results.innerHTML = "";
}

function showMessage(message) {
  const results = $("results");
  if (!results) return;

  results.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = message;
  results.appendChild(p);
}

function createResultCard(item) {
  const card = document.createElement("div");
  card.className = "result-card";

  const img = document.createElement("img");
  img.src = item.imageUrl; // Ensure your JSON points to your own images
  img.alt = item.name || "Recommendation image";

  const title = document.createElement("h3");
  title.textContent = item.name || "Unnamed place";

  const desc = document.createElement("p");
  desc.textContent = item.description || "";

  // OPTIONAL: add local time if we have a time zone
  const timeZone = getTimeZoneForItem(item);
  let timeEl = null;

  if (timeZone) {
    timeEl = document.createElement("p");
    timeEl.setAttribute("data-timezone", timeZone);

    const t = getCurrentTimeInTimeZone(timeZone);
    timeEl.textContent = t ? `Local time: ${t}` : "Local time: unavailable";
  }

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(desc);
  if (timeEl) card.appendChild(timeEl);

  return card;
}

function renderResults(items) {
  const results = $("results");
  if (!results) return;

  results.innerHTML = "";

  if (!items || items.length === 0) {
    showMessage("No results found. Try a different keyword.");
    return;
  }

  items.forEach((item) => results.appendChild(createResultCard(item)));
}

// ---------- Search logic (Task 7/8) ----------
function findResultsByKeyword(keyword, data) {
  const q = keyword.trim().toLowerCase();

  // Accept variations: beach/beaches and temple/temples
  if (q === "beach" || q === "beaches") return data.beaches || [];
  if (q === "temple" || q === "temples") return data.temples || [];

  // Country match -> show that country's cities
  if (Array.isArray(data.countries)) {
    const country = data.countries.find((c) =>
      (c.name || "").toLowerCase().includes(q)
    );
    if (country && Array.isArray(country.cities)) {
      return country.cities;
    }
  }

  // Optional fallback: search across everything by name/description
  const all = flattenAllData(data);
  return all.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}

function handleSearch() {
  // If user is on About/Contact "page", jump to Home to show results
  const hash = window.location.hash || "#home";
  if (hash !== "#home") window.location.hash = "#home";

  if (!travelData) {
    showMessage("Data is still loading... please try again.");
    return;
  }

  const keywordInput = $("keywordInput");
  if (!keywordInput) return;

  const keyword = keywordInput.value.trim();
  if (!keyword) {
    showMessage("Please enter a keyword (example: beach, temple, Japan).");
    return;
  }

  const results = findResultsByKeyword(keyword, travelData);
  renderResults(results);
}

function handleReset() {
  const keywordInput = $("keywordInput");
  if (keywordInput) keywordInput.value = "";
  clearResults();
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  // Load JSON first (and log it)
  await loadTravelData();

  // Wire up Home navbar controls (these IDs must exist in your HTML)
  const searchBtn = $("searchBtn");
  const resetBtn = $("resetBtn");
  const keywordInput = $("keywordInput");

  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (resetBtn) resetBtn.addEventListener("click", handleReset);

  // Allow pressing Enter in the search input to search
  if (keywordInput) {
    keywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    });
  }

  // OPTIONAL Task 10: update clocks every second (only for cards that have data-timezone)
  setInterval(updateAllClocks, 1000);
});
