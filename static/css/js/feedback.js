document.addEventListener("DOMContentLoaded", () => {
  // Feedback Type Change
  const feedbackType = document.getElementById("feedback-type")
  const volunteerSelect = document.querySelector(".volunteer-select")
  const ratingGroup = document.querySelector(".rating-group")

  if (feedbackType && volunteerSelect && ratingGroup) {
    feedbackType.addEventListener("change", () => {
      if (feedbackType.value === "volunteer") {
        volunteerSelect.style.display = "block"
        ratingGroup.style.display = "block"
      } else {
        volunteerSelect.style.display = "none"
        ratingGroup.style.display = "none"
      }
    })
  }

  // Feedback Sort
  const feedbackSort = document.getElementById("feedback-sort")
  const feedbackCards = document.querySelectorAll(".feedback-card")

  if (feedbackSort && feedbackCards.length > 0) {
    feedbackSort.addEventListener("change", () => {
      const sortValue = feedbackSort.value
      const feedbackList = document.querySelector(".feedback-list")

      // Convert NodeList to Array for sorting
      const cardsArray = Array.from(feedbackCards)

      if (sortValue === "recent") {
        // Sort by date (most recent first)
        cardsArray.sort((a, b) => {
          const dateA = new Date(a.querySelector(".feedback-date").textContent)
          const dateB = new Date(b.querySelector(".feedback-date").textContent)
          return dateB - dateA
        })
      } else if (sortValue === "highest") {
        // Sort by rating (highest first)
        cardsArray.sort((a, b) => {
          const ratingA = Number.parseFloat(a.querySelector(".rating span").textContent)
          const ratingB = Number.parseFloat(b.querySelector(".rating span").textContent)
          return ratingB - ratingA
        })
      } else if (sortValue === "lowest") {
        // Sort by rating (lowest first)
        cardsArray.sort((a, b) => {
          const ratingA = Number.parseFloat(a.querySelector(".rating span").textContent)
          const ratingB = Number.parseFloat(b.querySelector(".rating span").textContent)
          return ratingA - ratingB
        })
      }

      // Remove existing cards
      feedbackCards.forEach((card) => card.remove())

      // Append sorted cards
      cardsArray.forEach((card) => {
        feedbackList.appendChild(card)
      })
    })
  }

  // Form Submission
  const feedbackForm = document.getElementById("feedback-form")

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
      // Let the server handle the form submission
      // Just do basic validation
      let isValid = true
      const requiredFields = feedbackForm.querySelectorAll("[required]")

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")
          event.preventDefault()
        } else {
          field.classList.remove("error")
        }
      })

      // Check if volunteer feedback is selected but no volunteer is selected
      if (feedbackType && feedbackType.value === "volunteer") {
        const volunteerField = document.getElementById("feedback-volunteer")
        if (volunteerField && !volunteerField.value) {
          isValid = false
          volunteerField.classList.add("error")
          event.preventDefault()
        }

        // Check if rating is selected
        const ratingFields = document.querySelectorAll('input[name="rating"]')
        let ratingSelected = false
        ratingFields.forEach((field) => {
          if (field.checked) {
            ratingSelected = true
          }
        })

        if (!ratingSelected) {
          isValid = false
          document.querySelector(".star-rating").classList.add("error")
          event.preventDefault()
          alert("Please select a rating")
        }
      }
    })
  }
})
