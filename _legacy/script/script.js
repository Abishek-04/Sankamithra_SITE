const hamburgerBtn = document.getElementById("hamburgerBtn");
const navLinksWrapper = document.getElementById("navLinksWrapper");

function showMenu() {
  navLinksWrapper.classList.toggle("show");
}

const categoriesDiv = document.querySelector(".categories");
const productsDiv = document.getElementById("products");




let productsData = [];

async function Productsdata() {
  const response = await fetch(
    "https://e-com.incrix.com/Sankamithra%20Products/Factory.json"
  );
  productsData = await response.json();
  generateCategories();

  console.log(productsData);
}
uniqueCategories = []
function generateCategories() {
  categoriesDiv.innerHTML = "";
  const uniqueCategories = [...new Set(productsData.map(p => p.category))]
  console.log("LIST " + uniqueCategories);

  uniqueCategories.forEach((cat, index) => {
    const category = document.createElement("div");
    category.classList.add("category");
    if (index === 0) category.classList.add("active");
    category.setAttribute("data-category", cat);
    category.innerHTML = cat;
    categoriesDiv.appendChild(category);


    category.addEventListener("click", () => {
      document.querySelector(".category.active").classList.remove("active");
      category.classList.add("active");

      loadProducts(cat.toLowerCase())

    });



  });
  if (uniqueCategories.length > 0) {
    loadProducts(uniqueCategories[0].toLowerCase());
  }
}



function loadProducts(category) {
  productsDiv.innerHTML = "";

  // filter matching category
  const filtered = productsData.filter((p) => {
    // ensure both sides are lowercase
    return p.category.toLowerCase() === category;
  });

  if (filtered.length === 0) {
    productsDiv.innerHTML = "<p>No products found.</p>";
    return;
  }

  filtered.forEach((p) => {
    productsDiv.innerHTML += `
     <div class="product-card" style="
      background-image: url('https://e-com.incrix.com/Sankamithra%20Products/${p.images[0]}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;"
       onclick="window.location.href='products.html?id=${p.id}'"
  >
      
      <div class="product-top">
        <span class="badge">${p.category}</span>
        <button class="arrow-btn">
          <img src="images/arrow-up-right_2.png" alt="Arrow Icon" >
        </button>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        
      </div>
    </div>
    `;
  });
}

document.getElementById("scrollLeft").addEventListener("click", () => {
  document.querySelector(".categories")
    .scrollBy({ left: -400, behavior: "smooth" });
});
document.getElementById("scrollRight").addEventListener("click", () => {
  document.querySelector(".categories")
    .scrollBy({ left: 400, behavior: "smooth" });
});

window.onload = (e) => {
  Productsdata();
};


// video









// banner

const copyright = document.getElementById("copyright");

copyright.innerHTML = "©" + new Date().getFullYear() + "— Copyright";


const play = document.getElementById("play");
const poster = document.querySelector(".poster");
const iframe = document.getElementById("iframe");

play.addEventListener("click", () => {
  poster.style.display = "none";
  iframe.style.display = "block";
})



//review

const reviews = [
  {
    img: "images/reviewcard_img1.png",
    name: "RAMESH K., CHENNAI",
    text: "The quality, the safety, the sparkle – Sankamithra never disappoints! Our Diwali was unforgettable."
  },
  {
    img: "images/reviewcard_img1.png",
    name: "PRIYA S., MADURAI",
    text: "Amazing fireworks collection! My kids loved the variety and we felt safe using them."
  },
  {
    img: "images/reviewcard_img1.png",
    name: "ARUN M., COIMBATORE",
    text: "Great packaging, quick delivery, and superb performance of the crackers."
  },
  {
    img: "images/reviewcard_img1.png",
    name: "KAVYA R., SALEM",
    text: "Affordable prices and top-notch quality. Highly recommend Sankamithra fireworks."
  }
];


const imgEl = document.querySelector("#review-img");
const nameEl = document.querySelector("#review-name");
const quateEl = document.querySelector("#review-quote");
const countEl = document.getElementById("review-count");

let currentIndex = 0;

document.getElementById("next-btn").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % reviews.length;
  updateReview();
});

document.getElementById("prev-btn").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
  updateReview();
});

function updateReview() {
  imgEl.src = reviews[currentIndex].img;
  nameEl.textContent = reviews[currentIndex].name;
  quateEl.textContent = reviews[currentIndex].text;
  countEl.innerHTML = `${String(currentIndex + 1).padStart(2, '0')} <span class="total"> / ${String(reviews.length).padStart(2, '0')} </span>`;
}

