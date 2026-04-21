document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabLinks = document.querySelectorAll(".dashboard-nav a")
  const tabContents = document.querySelectorAll(".dashboard-tab")

  if (tabLinks.length > 0) {
    tabLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()

        const target = link.getAttribute("data-tab")

        // Update active tab link
        tabLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")

        // Show target tab content
        tabContents.forEach((content) => {
          if (content.id === target) {
            content.classList.add("active")
          } else {
            content.classList.remove("active")
          }
        })
      })
    })
  }

  // Request Filtering
  const statusFilter = document.getElementById("status-filter")
  const dateFilter = document.getElementById("date-filter")
  const requestSearch = document.getElementById("request-search")
  const requestCards = document.querySelectorAll(".request-card")

  function filterRequests() {
    const statusValue = statusFilter ? statusFilter.value : "all"
    const dateValue = dateFilter ? dateFilter.value : "all"
    const searchValue = requestSearch ? requestSearch.value.toLowerCase() : ""

    requestCards.forEach((card) => {
      let showCard = true

      // Filter by status
      if (statusValue !== "all") {
        const cardStatus = card.getAttribute("data-status")
        if (cardStatus !== statusValue) {
          showCard = false
        }
      }

      // Filter by search term
      if (searchValue && showCard) {
        const cardText = card.textContent.toLowerCase()
        if (!cardText.includes(searchValue)) {
          showCard = false
        }
      }

      // Show or hide card
      card.style.display = showCard ? "block" : "none"
    })
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterRequests)
  }

  if (dateFilter) {
    dateFilter.addEventListener("change", filterRequests)
  }

  if (requestSearch) {
    requestSearch.addEventListener("input", filterRequests)
  }

  // New Request Modal
  const newRequestBtn = document.getElementById("new-request-btn")
  const requestModal = document.getElementById("request-modal")
  const closeModalBtns = document.querySelectorAll(".close-modal")

  if (newRequestBtn && requestModal) {
    newRequestBtn.addEventListener("click", () => {
      requestModal.classList.add("active")
    })

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        requestModal.classList.remove("active")
      })
    })

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === requestModal) {
        requestModal.classList.remove("active")
      }
    })
  }

  // Form Submission for New Request
  const newRequestForm = document.getElementById("new-request-form")
  if (newRequestForm) {
    newRequestForm.addEventListener("submit", async (event) => {
      event.preventDefault()

      // Basic validation
      let isValid = true
      const requiredFields = newRequestForm.querySelectorAll("[required]")

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")
        } else {
          field.classList.remove("error")
        }
      })

      // If form is valid, submit it
      if (isValid) {
        try {
          const formData = new FormData(newRequestForm)
          const requestData = {
            title: formData.get("title"),
            type: formData.get("type"),
            date: formData.get("date"),
            time: formData.get("time"),
            duration: formData.get("duration"),
            location: formData.get("location"),
            description: formData.get("description"),
            is_urgent: formData.get("urgent") ? true : false,
          }

          const response = await fetch("/api/help_requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          })

          const result = await response.json()

          if (result.success) {
            alert("Help request submitted successfully!")

            // Close modal
            requestModal.classList.remove("active")

            // Reset form
            newRequestForm.reset()

            // Reload page to show new request
            window.location.reload()
          } else {
            alert("Error submitting request: " + result.error)
          }
        } catch (error) {
          console.error("Error:", error)
          alert("An error occurred. Please try again.")
        }
      }
    })
  }

  // Accept Request Button
  const acceptRequestBtns = document.querySelectorAll(".request-actions .btn-primary")
  if (acceptRequestBtns.length > 0) {
    acceptRequestBtns.forEach((btn) => {
      if (btn.textContent.includes("Accept Request")) {
        btn.addEventListener("click", async () => {
          const requestCard = btn.closest(".request-card")
          const requestId = requestCard.getAttribute("data-id")

          if (confirm("Are you sure you want to accept this request?")) {
            try {
              const response = await fetch(`/api/help_requests/${requestId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "accepted",
                }),
              })

              const result = await response.json()

              if (result.success) {
                alert("Request accepted successfully!")
                window.location.reload()
              } else {
                alert("Error accepting request: " + result.error)
              }
            } catch (error) {
              console.error("Error:", error)
              alert("An error occurred. Please try again.")
            }
          }
        })
      }
    })
  }

  // Mark Complete Button
  const markCompleteBtns = document.querySelectorAll(".request-actions .btn-success")
  if (markCompleteBtns.length > 0) {
    markCompleteBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const requestCard = btn.closest(".request-card")
        const requestId = requestCard.getAttribute("data-id")

        if (confirm("Are you sure you want to mark this request as complete?")) {
          try {
            const response = await fetch(`/api/help_requests/${requestId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "completed",
              }),
            })

            const result = await response.json()

            if (result.success) {
              alert("Request marked as complete!")
              window.location.reload()
            } else {
              alert("Error updating request: " + result.error)
            }
          } catch (error) {
            console.error("Error:", error)
            alert("An error occurred. Please try again.")
          }
        }
      })
    })
  }

  // Cancel Request Button
  const cancelRequestBtns = document.querySelectorAll(".request-actions .btn-danger")
  if (cancelRequestBtns.length > 0) {
    cancelRequestBtns.forEach((btn) => {
      if (btn.textContent.includes("Cancel")) {
        btn.addEventListener("click", async () => {
          const requestCard = btn.closest(".request-card")
          const requestId = requestCard.getAttribute("data-id")

          if (confirm("Are you sure you want to cancel this request?")) {
            try {
              const response = await fetch(`/api/help_requests/${requestId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "cancelled",
                }),
              })

              const result = await response.json()

              if (result.success) {
                alert("Request cancelled successfully!")
                window.location.reload()
              } else {
                alert("Error cancelling request: " + result.error)
              }
            } catch (error) {
              console.error("Error:", error)
              alert("An error occurred. Please try again.")
            }
          }
        })
      }
    })
  }

  // Add Emergency Contact
  const addContactBtn = document.getElementById("add-contact-btn")
  if (addContactBtn) {
    addContactBtn.addEventListener("click", () => {
      const name = prompt("Contact Name:")
      if (!name) return

      const relationship = prompt("Relationship:")
      if (!relationship) return

      const phone = prompt("Phone Number:")
      if (!phone) return

      const email = prompt("Email (optional):")

      // Send to server
      fetch("/api/emergency_contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          relationship,
          phone,
          email,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Contact added successfully!")
            window.location.reload()
          } else {
            alert("Error adding contact: " + data.error)
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          alert("An error occurred. Please try again.")
        })
    })
  }

  // Delete Emergency Contact
  const deleteContactBtns = document.querySelectorAll(".contact-actions .btn-danger")
  if (deleteContactBtns.length > 0) {
    deleteContactBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const contactCard = btn.closest(".contact-card")
        const contactId = contactCard.getAttribute("data-id")

        if (confirm("Are you sure you want to delete this contact?")) {
          try {
            const response = await fetch(`/api/emergency_contacts/${contactId}`, {
              method: "DELETE",
            })

            const result = await response.json()

            if (result.success) {
              alert("Contact deleted successfully!")
              contactCard.remove()
            } else {
              alert("Error deleting contact: " + result.error)
            }
          } catch (error) {
            console.error("Error:", error)
            alert("An error occurred. Please try again.")
          }
        }
      })
    })
  }

  // Profile Form Submission
  const profileForm = document.getElementById("profile-form")
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault()

      // Basic validation
      let isValid = true
      const requiredFields = profileForm.querySelectorAll("[required]")

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")
        } else {
          field.classList.remove("error")
        }
      })

      // Password confirmation validation
      const newPassword = document.getElementById("profile-new-password")
      const confirmPassword = document.getElementById("profile-confirm-password")

      if (newPassword && confirmPassword && newPassword.value && newPassword.value !== confirmPassword.value) {
        isValid = false
        confirmPassword.classList.add("error")
        alert("Passwords do not match")
      }

      // If form is valid, submit it
      if (isValid) {
        alert("Profile updated successfully!")
      }
    })
  }
})
