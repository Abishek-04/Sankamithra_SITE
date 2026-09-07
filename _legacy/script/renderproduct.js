// Current image index
let Index = 0;
let product = null;
const imageBaseURL = "https://e-com.incrix.com/Sankamithra%20Products/";

// Load product details
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  const response = await fetch("https://e-com.incrix.com/Sankamithra%20Products/Factory.json");
  const products = await response.json();

  product = products.find(p => p.id == productId);

  if (product) {
    renderProductDetail(product);
    console.log("Product:", product);
  } else {
    document.getElementById("Products-Con").innerHTML = "<p>Product not found.</p>";
  }
}

loadProductDetail();

// Render product HTML
function renderProductDetail(product) {
  const container = document.getElementById("Products-Con");

  const thumbnailsHTML = product.images.map((img, i) => `
    <img src="${imageBaseURL + img}" 
         alt="${product.name}" 
         class="thumbnail ${i === 0 ? "active" : ""}" 
         onclick="changeImage(${i})"/>
  `).join("");

  const descriptionList = product.shortDescription
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => `<li>${line.trim()}</li>`)
    .join("");

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-left">
        <div class="main-image-wrapper">
          <div class="image">
            <img id="main-image" src="${imageBaseURL + product.images[Index]}" alt="${product.name}" class="main-image"/>
            <button class="expand-btn" onclick="openLightboxFromMainImage()">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
          </div>
        </div>
        <div class="thumbnail-row">${thumbnailsHTML}</div>
      </div>
      <div class="product-right">
        <p class="sku-label">SKU: ${product.sku}</p>
        <h2 class="product-title">${product.name}</h2>
        <p class="in-stock">✔ IN STOCK</p>
        <ul class="product-description">${descriptionList}</ul>
      </div>
    </div>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
      <span class="close" onclick="closeLightbox()">&times;</span>
      <img class="lightbox-content" id="lightbox-img"/>
    </div>
  `;

  // Initialize zoom
  initZoom();
}

// Change main image with slide + zoom reset
window.changeImage = function(index) {
  if (!product || index === Index) return;

  const mainImage = document.getElementById("main-image");
  const thumbnails = document.querySelectorAll(".thumbnail");

  // Fade out
  mainImage.style.opacity = 0;

  mainImage.addEventListener("transitionend", function handler() {
    // Load new image in memory
    const newSrc = imageBaseURL + product.images[index];
    const tempImg = new Image();
    
    tempImg.src = newSrc;

    tempImg.onload = () => {
      mainImage.src = newSrc;

      // Fade in
      mainImage.style.opacity = 1;

      // Reset zoom
      mainImage.style.transform = "scale(1)";
      mainImage.style.transformOrigin = "center center";

      // Re-init zoom
      initZoom();
    };

    mainImage.removeEventListener("transitionend", handler);
  });

  // Update thumbnails
  thumbnails.forEach(t => t.classList.remove("active"));
  thumbnails[index].classList.add("active");

  Index = index;
};



  
 
// Zoom on hover
function initZoom() {
  const mainImage = document.getElementById("main-image");
  const wrapper = document.querySelector(".image");

  if (!mainImage || !wrapper) return;

  let zoomScale = 2;

  // Remove old handlers
  wrapper.onmousemove = null;
  wrapper.onmouseleave = null;

  wrapper.onmousemove = (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mainImage.style.transformOrigin = `${x}% ${y}%`;
    mainImage.style.transform = `scale(${zoomScale})`;
  };

  wrapper.onmouseleave = () => {
    mainImage.style.transformOrigin = "center center";
    mainImage.style.transform = "scale(1)";
  };
}

// Lightbox
window.openLightbox = function(src) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  lightbox.style.display = "flex";
  lightboxImg.src = src;
};

window.closeLightbox = function() {
  document.getElementById("lightbox").style.display = "none";
};

window.openLightboxFromMainImage = function() {
  const mainImg = document.getElementById("main-image");
  if (mainImg) openLightbox(mainImg.src);
};



// var zoom= 2;

// window.onload=()=>{
//   magnify("main-image",zoom);
//    document.querySelectorAll(".thumbnail").forEach((thumb) => {
//     thumb.addEventListener("click", () => {
      
//        updateGlass(thumb.src); // update on click
//     });
//   });
// }
// var img,glass,w,h;
// function magnify(imgId,zoom){
  
//   img=document.getElementById(imgId)
//   glass=document.createElement("DIV");
//   glass.classList.add("img-magnifier-glass");

//   img.parentElement.insertBefore(glass,img);


//    w=glass.offsetWidth/2;
//    h=glass.offsetHeight/2;

//    glass.style.display="none";

//    img.addEventListener("mouseenter",()=>{
//     glass.style.display="block";
//    })
//    img.addEventListener("mouseleave",()=>{
//     glass.style.display="none";
//    })


//   glass.addEventListener("mousemove",moveMagnifier);
//   img.addEventListener("mousemove",moveMagnifier);
  
  

// }


// function updateGlass(newSrc, zoom) {
//   glass.style.backgroundImage = "url('" + newSrc + "')";
//   glass.style.backgroundRepeat = "no-repeat";
//   glass.style.backgroundSize =
//      (img.Width * zoom) + "px " + (img.Height * zoom) + "px";
// }

// function moveMagnifier(e){
//   var pos,x,y;
//   e.preventDefault();

//   pos=getCursor(e);
//   x=pos.x;
//   y=pos.y;

//   if(x>img.width - (w/zoom)){x=img.width-(w/zoom);}
//   if(x<w/zoom){x=w/zoom;}
//   if(y>img.height - (h/zoom)){y=img.height-(h/zoom);}
//   if(y<h/zoom){y=h/zoom;}

//   glass.style.left=(x-w)+"px";
//   glass.style.top=(y-h)+"px";
  
// glass.style.backgroundPosition="-"+((x*zoom)-w)+"px -"+((y*zoom)-h)+"px"; 
// }




// function getCursor(e){
//   var a,x=0,y=0;

//   e=e || window.event;
//   a=img.getBoundingClientRect();

//   x=e.pageX - a.left;
//   y=e.pageY - a.top;

//   x=x - window.pageXOffset;
//   y=y - window.pageYOffset;
//   console.log(x,y)
//   return{x:x,y:y};
// }