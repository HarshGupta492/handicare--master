document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navigation Toggle
  const hamburger = document.querySelector(".hamburger")
  const navLinks = document.querySelector(".nav-links")

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active")
      hamburger.classList.toggle("active")
    })
  }

  // Testimonial Slider
  const testimonials = document.querySelectorAll(".testimonial")
  const dots = document.querySelectorAll(".dot")
  const prevBtn = document.querySelector(".prev-btn")
  const nextBtn = document.querySelector(".next-btn")

  if (testimonials.length > 0) {
    let currentSlide = 0

    // Hide all testimonials except the first one
    testimonials.forEach((testimonial, index) => {
      if (index !== 0) {
        testimonial.style.display = "none"
      }
    })

    // Function to show a specific slide
    function showSlide(n) {
      testimonials.forEach((testimonial) => {
        testimonial.style.display = "none"
      })

      dots.forEach((dot) => {
        dot.classList.remove("active")
      })

      testimonials[n].style.display = "block"
      dots[n].classList.add("active")
    }

    // Event listeners for dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index
        showSlide(currentSlide)
      })
    })

    // Event listeners for prev/next buttons
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentSlide = (currentSlide - 1 + testimonials.length) % testimonials.length
        showSlide(currentSlide)
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentSlide = (currentSlide + 1) % testimonials.length
        showSlide(currentSlide)
      })
    }

    // Auto slide every 5 seconds
    setInterval(() => {
      currentSlide = (currentSlide + 1) % testimonials.length
      showSlide(currentSlide)
    }, 5000)
  }
})
