let coll = document.getElementsByClassName("nav-collapsible")
let i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    console.log("click")
    this.classList.toggle("active")
    let content = this.nextElementSibling
    if (content.style.display === "block") {
      content.style.display = "none"
    } else {
      content.style.display = "block"
    }
  })
}