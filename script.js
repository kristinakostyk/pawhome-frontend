
const API_URL = "http://127.0.0.1:8000/api";

const animalsGrid = document.getElementById("animals-grid");
const statusMessage = document.getElementById("status-message");
const searchForm = document.getElementById("search-form");
const resetButton = document.getElementById("reset-button");

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

function createAnimalCard(animal) {
    const card = document.createElement("article");
    card.className = "animal-card";

    const media = document.createElement("div");
    media.className = "animal-media";

    const emoji = animal.species === "dog" ? "🐶" : "🐱";

    if (animal.photo_url &&
        !animal.photo_url.includes("example.com")) {
        const image = document.createElement("img");
        image.src = animal.photo_url;
        image.alt = animal.name;

        image.onerror = () => {
            media.replaceChildren(
                createElement("span", "animal-placeholder", emoji)
            );
        };

        media.appendChild(image);
    } else {
        media.appendChild(
            createElement("span", "animal-placeholder", emoji)
        );
    }

    const details = document.createElement("div");
    details.className = "animal-details";

    const name = createElement("h3", "", animal.name);
    const species = animal.species === "dog" ? "Собака" : "Кіт";

    const info = createElement(
        "p",
        "",
        `${species} • ${animal.breed} • ${animal.age_months} міс.`
    );

    const description = createElement(
        "p",
        "",
        animal.description || "Шукає люблячу родину."
    );

    const shelter = createElement(
        "p",
        "",
        `Притулок №${animal.shelter_id}`
    );

    const status = createElement(
        "span",
        "animal-status",
        animal.status === "available"
            ? "Шукає дім ♥"
            : "Знайшов дім"
    );

    details.append(name, info, description, shelter, status);
    card.append(media, details);

    return card;
}

async function loadAnimals() {
    statusMessage.textContent = "Завантаження тваринок...";
    animalsGrid.replaceChildren();

    const params = new URLSearchParams();

    const search = document.getElementById("search").value.trim();
    const species = document.getElementById("species").value;
    const city = document.getElementById("city").value.trim();

    if (search) params.append("search", search);
    if (species) params.append("species", species);
    if (city) params.append("city", city);

    try {
        const url = `${API_URL}/animals?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Помилка отримання даних");
        }

        const data = await response.json();
        const animals = data.animals;

        if (!Array.isArray(animals)) {
            throw new Error("Неправильний формат відповіді API");
        }

        if (animals.length === 0) {
            statusMessage.textContent =
                "За вашим запитом тваринок не знайдено 🐾";
            return;
        }

        statusMessage.textContent =
            `Знайдено тваринок: ${animals.length}`;

        animals.forEach((animal) => {
            animalsGrid.appendChild(createAnimalCard(animal));
        });
    } catch (error) {
        console.error(error);
        statusMessage.textContent =
            "Не вдалося завантажити тваринок. " +
            "Перевірте, чи запущений Django-сервер.";
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadAnimals();
});

resetButton.addEventListener("click", () => {
    searchForm.reset();
    loadAnimals();
});

loadAnimals();

// ---------- Реєстрація та JWT-авторизація ----------

const ACCESS_KEY = "pawhome_access";
const REFRESH_KEY = "pawhome_refresh";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const registerMessage = document.getElementById("register-message");
const loginMessage = document.getElementById("login-message");
const profileMessage = document.getElementById("profile-message");
const authFeedback = document.getElementById("auth-feedback");

const navLogin = document.getElementById("nav-login");
const navRegister = document.getElementById("nav-register");
const navProfile = document.getElementById("nav-profile");
const navUsername = document.getElementById("nav-username");
const navLogout = document.getElementById("nav-logout");

let currentUser = null;
let redirectAfterLogin = null;
let refreshInProgress = null;
let routeCounter = 0;

function hasTokens() {
    return Boolean(localStorage.getItem(ACCESS_KEY) && localStorage.getItem(REFRESH_KEY));
}

function updateAuthNavigation() {
    const signedIn = hasTokens();
    navLogin.hidden = signedIn;
    navRegister.hidden = signedIn;
    navProfile.hidden = !signedIn;
    navUsername.hidden = !signedIn;
    navLogout.hidden = !signedIn;
    navUsername.textContent = signedIn
        ? (currentUser?.first_name || currentUser?.username || "Користувач")
        : "";
}

function clearAuth() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    currentUser = null;
    updateAuthNavigation();
}

function showMessage(element, text = "", error = false) {
    element.textContent = text;
    element.classList.toggle("error", error);
}

function showAuthFeedback(text = "", error = false) {
    showMessage(authFeedback, text, error);
    authFeedback.hidden = !text;
}

function errorMessage(data, fallback) {
    if (data && data.details && typeof data.details === "object") {
        const fields = Object.entries(data.details);
        if (fields.length) {
            return fields.map(([field, messages]) => {
                const value = Array.isArray(messages) ? messages.join(", ") : String(messages);
                return `${field}: ${value}`;
            }).join("\n");
        }
    }
    return data?.detail || data?.error || fallback;
}

async function jsonRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(errorMessage(data, `Помилка запиту (${response.status})`));
        error.status = response.status;
        throw error;
    }
    return data;
}

async function refreshAccessToken() {
    if (refreshInProgress) return refreshInProgress;

    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
        clearAuth();
        throw new Error("Потрібно увійти в акаунт.");
    }

    refreshInProgress = (async () => {
        try {
            const data = await jsonRequest(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });
            if (!data?.access) throw new Error("Сервер не повернув новий access token.");
            localStorage.setItem(ACCESS_KEY, data.access);
            if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
            return data.access;
        } catch (error) {
            if (error.status === 400 || error.status === 401) clearAuth();
            throw error;
        }
    })();

    try {
        return await refreshInProgress;
    } finally {
        refreshInProgress = null;
    }
}

async function authorizedRequest(path, options = {}) {
    let access = localStorage.getItem(ACCESS_KEY);
    if (!access) access = await refreshAccessToken();

    function send(token) {
        return fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        });
    }

    let response = await send(access);
    if (response.status === 401) {
        access = await refreshAccessToken();
        response = await send(access);
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(errorMessage(data, `Помилка запиту (${response.status})`));
        error.status = response.status;
        throw error;
    }
    return data;
}

async function getProfile() {
    const profile = await authorizedRequest("/auth/me");
    currentUser = profile;
    updateAuthNavigation();
    return profile;
}

function displayProfile(profile) {
    document.getElementById("profile-username").textContent = profile.username || "—";
    document.getElementById("profile-first-name").textContent = profile.first_name || "—";
    document.getElementById("profile-last-name").textContent = profile.last_name || "—";
    document.getElementById("profile-email").textContent = profile.email || "—";
}

// Сторінки на основі #login, #register, #profile без стороннього роутера.
async function showPage() {
    const routeId = ++routeCounter;
    const hash = window.location.hash;
    const page = ["#login", "#register", "#profile"].includes(hash)
        ? hash.slice(1)
        : "public";

    if (page === "profile" && !hasTokens()) {
        redirectAfterLogin = "#profile";
        showMessage(loginMessage, "Для перегляду кабінету потрібно увійти.");
        window.location.hash = "#login";
        return;
    }

    if ((page === "login" || page === "register") && hasTokens()) {
        window.location.hash = "#profile";
        return;
    }

    for (const section of [".hero", ".catalog-section", ".about-section"]) {
        document.querySelector(section).hidden = page !== "public";
    }
    for (const name of ["register", "login", "profile"]) {
        document.getElementById(name).hidden = page !== name;
    }

    if (page !== "public") window.scrollTo(0, 0);

    if (page === "profile") {
        showMessage(profileMessage, "Завантаження профілю...");
        try {
            const profile = await getProfile();
            if (routeId !== routeCounter) return;
            displayProfile(profile);
            showMessage(profileMessage);
        } catch (error) {
            if (routeId !== routeCounter) return;
            if (!hasTokens() || error.status === 401) {
                clearAuth();
                redirectAfterLogin = "#profile";
                showMessage(loginMessage, "Сеанс завершився. Увійди знову.", true);
                window.location.hash = "#login";
            } else {
                showMessage(profileMessage, error.message, true);
            }
        }
    } else if (page === "public" && (hash === "#catalog" || hash === "#about")) {
        requestAnimationFrame(() => {
            document.getElementById(hash.slice(1))?.scrollIntoView();
        });
    }
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(registerMessage);

    const form = new FormData(registerForm);
    const values = {
        username: String(form.get("username") || "").trim(),
        first_name: String(form.get("first_name") || "").trim(),
        last_name: String(form.get("last_name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        password_confirmation: String(form.get("password_confirmation") || ""),
    };

    if (values.password !== values.password_confirmation) {
        showMessage(registerMessage, "Паролі не збігаються.", true);
        return;
    }

    const button = registerForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        await jsonRequest(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });
        registerForm.reset();
        document.getElementById("login-username").value = values.username;
        showMessage(loginMessage, "Реєстрація успішна! Тепер увійди.");
        window.location.hash = "#login";
    } catch (error) {
        showMessage(registerMessage, error.message, true);
    } finally {
        button.disabled = false;
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(loginMessage);

    const username = document.getElementById("login-username").value.trim();
    const passwordInput = document.getElementById("login-password");
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
        const tokens = await jsonRequest(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: passwordInput.value }),
        });
        if (!tokens?.access || !tokens?.refresh) {
            throw new Error("Сервер не повернув JWT-токени.");
        }
        localStorage.setItem(ACCESS_KEY, tokens.access);
        localStorage.setItem(REFRESH_KEY, tokens.refresh);
        passwordInput.value = "";
        currentUser = { username };
        updateAuthNavigation();

        const destination = redirectAfterLogin || "#profile";
        redirectAfterLogin = null;
        if (window.location.hash === destination) {
            await showPage();
        } else {
            window.location.hash = destination;
        }
    } catch (error) {
        showMessage(loginMessage, error.message, true);
    } finally {
        button.disabled = false;
    }
});

navLogout.addEventListener("click", async () => {
    navLogout.disabled = true;
    let serverLogoutFailed = false;
    try {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
            await authorizedRequest("/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });
        }
    } catch (error) {
        console.error("Помилка відкликання refresh token:", error);
        serverLogoutFailed = true;
    } finally {
        clearAuth();
        redirectAfterLogin = null;
        navLogout.disabled = false;
        window.location.hash = "#catalog";
        showAuthFeedback(
            serverLogoutFailed
                ? "Локальний вихід виконано, але сервер не підтвердив відкликання refresh token."
                : "Ти успішно вийшла з акаунта.",
            serverLogoutFailed
        );
    }
});

window.addEventListener("hashchange", () => { void showPage(); });
updateAuthNavigation();
void showPage();

// Показуємо ім'я користувача в меню навіть після перезавантаження сторінки.
if (hasTokens() && window.location.hash !== "#profile") {
    void getProfile().catch((error) => {
        console.error("Не вдалося завантажити профіль:", error);
    });
}
