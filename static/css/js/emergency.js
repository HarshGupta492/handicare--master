document.addEventListener("DOMContentLoaded", () => {
  // Emergency Call Buttons
  const callButtons = document.querySelectorAll(".emergency-card .btn")

  if (callButtons.length > 0) {
    callButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const service = button.previousElementSibling.previousElementSibling.textContent
        const number = button.previousElementSibling.textContent

        // In a real application, this would use the Web Telephony API if available
        alert(`Calling ${service} at ${number}...`)

        // Simulate a call
        console.log(`Emergency call to ${service} at ${number}`)
      })
    })
  }

  // Get Current Location
  const getLocationBtn = document.getElementById("get-location-btn")
  const locationInput = document.getElementById("emergency-location")

  if (getLocationBtn && locationInput) {
    getLocationBtn.addEventListener("click", () => {
      if (navigator.geolocation) {
        getLocationBtn.textContent = "Getting location..."
        getLocationBtn.disabled = true

        navigator.geolocation.getCurrentPosition(
          (position) => {
            // In a real application, this would use a reverse geocoding service
            // to convert coordinates to an address
            const lat = position.coords.latitude
            const lng = position.coords.longitude

            locationInput.value = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`

            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location'
            getLocationBtn.disabled = false
          },
          (error) => {
            console.error("Error getting location:", error)
            alert("Unable to get your location. Please enter it manually.")

            getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location'
            getLocationBtn.disabled = false
          },
        )
      } else {
        alert("Geolocation is not supported by your browser. Please enter your location manually.")
      }
    })
  }

  // Emergency Message Form
  const emergencyMessageForm = document.getElementById("emergency-message-form")

  if (emergencyMessageForm) {
    emergencyMessageForm.addEventListener("submit", (event) => {
      event.preventDefault()

      // Basic validation
      let isValid = true
      const message = document.getElementById("emergency-message")
      const location = document.getElementById("emergency-location")

      if (!message.value.trim()) {
        isValid = false
        message.classList.add("error")
      } else {
        message.classList.remove("error")
      }

      if (!location.value.trim()) {
        isValid = false
        location.classList.add("error")
      } else {
        location.classList.remove("error")
      }

      // If form is valid, submit it
      if (isValid) {
        // In a real application, this would send the emergency message to contacts
        console.log("Emergency message:", {
          message: message.value,
          location: location.value,
        })

        // Simulate successful submission
        alert("Emergency message sent to all your emergency contacts!")

        // Reset form
        emergencyMessageForm.reset()
      }
    })
  }
})
