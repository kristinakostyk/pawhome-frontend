
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
