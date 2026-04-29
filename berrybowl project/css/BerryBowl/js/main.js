const GOAL_LABELS = {
  "all": "All Goals",
  "weight-loss": "Weight Loss",
  "muscle-gain": "Muscle Gain",
  "balanced": "Balanced Diet",
  "weight-gain": "Healthy Weight Gain"
};

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNavigation();
  setCurrentYear();
  setupBmiCalculator();
  setupMealPlansPage();
  setupRecipesPage();
  setupContactForm();
});

function setupMobileNavigation() {
  const button = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector("#navLinks");

  if (!button || !navLinks) return;

  button.addEventListener("click", () => {
    navLinks.classList.toggle("open");

    const isOpen = navLinks.classList.contains("open");
    button.setAttribute("aria-expanded", isOpen.toString());
  });
}

function setCurrentYear() {
  const yearElements = document.querySelectorAll("#year");
  const currentYear = new Date().getFullYear();

  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });
}

function setupBmiCalculator() {
  const form = document.querySelector("#bmiForm");
  if (!form) return;

  const resultBox = document.querySelector("#bmiResult");
  const historyBox = document.querySelector("#bmiHistory");

  renderBmiHistory(historyBox);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const heightCm = Number(document.querySelector("#height").value);
    const weightKg = Number(document.querySelector("#weight").value);

    if (!heightCm || !weightKg || heightCm < 80 || weightKg < 20) {
      resultBox.className = "result-box obese";
      resultBox.innerHTML = `
        <h3>Invalid input</h3>
        <p>Please enter a realistic height and weight.</p>
      `;
      return;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const roundedBmi = bmi.toFixed(1);
    const category = getBmiCategory(bmi);

    localStorage.setItem("berryRecommendedGoal", category.goal);

    const entry = {
      bmi: roundedBmi,
      category: category.title,
      date: new Date().toLocaleString()
    };

    const history = getStoredArray("berryBmiHistory");
    history.unshift(entry);
    localStorage.setItem("berryBmiHistory", JSON.stringify(history.slice(0, 5)));

    resultBox.className = `result-box ${category.className}`;
    resultBox.innerHTML = `
      <h3>Your BMI is ${roundedBmi}</h3>
      <p><strong>Category:</strong> ${category.title}</p>
      <p>${category.advice}</p>
      <div class="result-actions">
        <a href="meals.html" class="btn primary-btn btn-small">
          View ${GOAL_LABELS[category.goal]} Meals
        </a>
      </div>
    `;

    renderBmiHistory(historyBox);
  });
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) {
    return {
      title: "Underweight",
      className: "underweight",
      goal: "weight-gain",
      advice:
        "Your BMI is below the normal range. BerryBowl recommends healthy weight gain meals with nutrient-dense calories, protein, whole grains, and healthy fats."
    };
  }

  if (bmi >= 18.5 && bmi < 25) {
    return {
      title: "Normal",
      className: "normal",
      goal: "balanced",
      advice:
        "Your BMI is within the normal range. A balanced diet can help you maintain energy, health, and good nutrition habits."
    };
  }

  if (bmi >= 25 && bmi < 30) {
    return {
      title: "Overweight",
      className: "overweight",
      goal: "weight-loss",
      advice:
        "Your BMI is above the normal range. BerryBowl recommends weight loss meal plans with lean protein, vegetables, and controlled calories."
    };
  }

  return {
    title: "Obese",
    className: "obese",
    goal: "weight-loss",
    advice:
      "Your BMI is in the obese range. Healthy weight management can be helpful. Consider speaking with a healthcare professional for personal advice."
  };
}

function renderBmiHistory(container) {
  if (!container) return;

  const history = getStoredArray("berryBmiHistory");

  if (history.length === 0) {
    container.innerHTML = `<p class="muted">No BMI history yet.</p>`;
    return;
  }

  container.innerHTML = history
    .map(
      (item) => `
      <div class="history-item">
        <span><strong>${escapeHTML(item.bmi)}</strong> - ${escapeHTML(item.category)}</span>
        <span>${escapeHTML(item.date)}</span>
      </div>
    `
    )
    .join("");
}

function setupMealPlansPage() {
  const grid = document.querySelector("#mealGrid");
  if (!grid || !window.BERRY_DATA) return;

  const goalFilter = document.querySelector("#goalFilter");
  const searchInput = document.querySelector("#mealSearch");
  const mealPlans = window.BERRY_DATA.mealPlans;

  const savedGoal = localStorage.getItem("berryRecommendedGoal");

  if (savedGoal && goalFilter.querySelector(`option[value="${savedGoal}"]`)) {
    goalFilter.value = savedGoal;
  }

  function renderMeals() {
    const selectedGoal = goalFilter.value;
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredMeals = mealPlans.filter((plan) => {
      const matchesGoal = selectedGoal === "all" || plan.goal === selectedGoal;

      const searchableText = [
        plan.title,
        plan.goal,
        GOAL_LABELS[plan.goal],
        plan.description,
        plan.calories,
        ...Object.values(plan.meals),
        ...plan.tips
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);

      return matchesGoal && matchesSearch;
    });

    if (filteredMeals.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>No meal plans found</h3>
          <p>Try another search word or choose a different goal.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredMeals.map(renderMealCard).join("");
  }

  goalFilter.addEventListener("change", renderMeals);
  searchInput.addEventListener("input", renderMeals);

  renderMeals();
}

function renderMealCard(plan) {
  const mealsHTML = Object.entries(plan.meals)
    .map(
      ([mealName, mealValue]) => `
      <li>
        <strong>${capitalize(mealName)}:</strong>
        ${escapeHTML(mealValue)}
      </li>
    `
    )
    .join("");

  const tipsHTML = plan.tips
    .map((tip) => `<span>${escapeHTML(tip)}</span>`)
    .join("");

  return `
    <article class="meal-card">
      <div class="card-top">
        <span class="badge ${plan.goal}">${GOAL_LABELS[plan.goal]}</span>
        <span class="calories">${plan.calories} kcal/day</span>
      </div>

      <h3>${escapeHTML(plan.title)}</h3>
      <p>${escapeHTML(plan.description)}</p>

      <ul class="meal-list">
        ${mealsHTML}
      </ul>

      <div class="tip-row">
        ${tipsHTML}
      </div>
    </article>
  `;
}

function setupRecipesPage() {
  const grid = document.querySelector("#recipeGrid");
  if (!grid || !window.BERRY_DATA) return;

  const goalFilter = document.querySelector("#recipeGoalFilter");
  const searchInput = document.querySelector("#recipeSearch");
  const recipes = window.BERRY_DATA.recipes;

  const savedGoal = localStorage.getItem("berryRecommendedGoal");

  if (savedGoal && goalFilter.querySelector(`option[value="${savedGoal}"]`)) {
    goalFilter.value = savedGoal;
  }

  function renderRecipes() {
    const selectedGoal = goalFilter.value;
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredRecipes = recipes.filter((recipe) => {
      const matchesGoal = selectedGoal === "all" || recipe.goal === selectedGoal;

      const searchableText = [
        recipe.title,
        recipe.goal,
        GOAL_LABELS[recipe.goal],
        recipe.calories,
        recipe.protein,
        recipe.time,
        ...recipe.ingredients,
        recipe.steps
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);

      return matchesGoal && matchesSearch;
    });

    if (filteredRecipes.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>No recipes found</h3>
          <p>Try another search word or choose a different goal.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredRecipes.map(renderRecipeCard).join("");
  }

  goalFilter.addEventListener("change", renderRecipes);
  searchInput.addEventListener("input", renderRecipes);

  renderRecipes();
}

function renderRecipeCard(recipe) {
  const ingredientsHTML = recipe.ingredients
    .map((ingredient) => `<li>${escapeHTML(ingredient)}</li>`)
    .join("");

  return `
    <article class="recipe-card">
      <div class="recipe-icon">${escapeHTML(recipe.icon)}</div>

      <div class="card-top">
        <span class="badge ${recipe.goal}">${GOAL_LABELS[recipe.goal]}</span>
      </div>

      <h3>${escapeHTML(recipe.title)}</h3>

      <div class="recipe-meta">
        <span>${recipe.calories} kcal</span>
        <span>${recipe.protein}g protein</span>
        <span>${escapeHTML(recipe.time)}</span>
      </div>

      <h4>Ingredients</h4>
      <ul class="ingredient-list">
        ${ingredientsHTML}
      </ul>

      <p><strong>Steps:</strong> ${escapeHTML(recipe.steps)}</p>
    </article>
  `;
}

function setupContactForm() {
  const form = document.querySelector("#contactForm");
  if (!form) return;

  const status = document.querySelector("#contactStatus");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#contactName").value.trim();
    const email = document.querySelector("#contactEmail").value.trim();
    const message = document.querySelector("#contactMessage").value.trim();

    if (name.length < 2) {
      showContactStatus(status, "Please enter your full name.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showContactStatus(status, "Please enter a valid email address.", "error");
      return;
    }

    if (message.length < 10) {
      showContactStatus(status, "Message must be at least 10 characters.", "error");
      return;
    }

    const contactMessages = getStoredArray("berryContactMessages");

    contactMessages.unshift({
      name,
      email,
      message,
      date: new Date().toLocaleString()
    });

    localStorage.setItem(
      "berryContactMessages",
      JSON.stringify(contactMessages.slice(0, 20))
    );

    form.reset();
    showContactStatus(status, "Your message was saved successfully!", "success");
  });
}

function showContactStatus(element, message, type) {
  element.textContent = message;
  element.className = `form-status ${type}`;
}

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function getStoredArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return map[character];
  });
}