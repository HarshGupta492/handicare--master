document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabLinks = document.querySelectorAll(".admin-nav a")
  const tabContents = document.querySelectorAll(".admin-tab")

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

  // User Search
  const userSearch = document.getElementById("user-search")
  const userRows = document.querySelectorAll("#users table tbody tr")

  if (userSearch && userRows.length > 0) {
    userSearch.addEventListener("input", () => {
      const searchTerm = userSearch.value.toLowerCase()

      userRows.forEach((row) => {
        const text = row.textContent.toLowerCase()
        if (text.includes(searchTerm)) {
          row.style.display = ""
        } else {
          row.style.display = "none"
        }
      })
    })
  }

  // Dashboard Period Filter
  const dashboardPeriod = document.getElementById("dashboard-period")

  if (dashboardPeriod) {
    dashboardPeriod.addEventListener("change", async () => {
      const period = dashboardPeriod.value

      try {
        const response = await fetch(`/api/admin/dashboard?period=${period}`)
        const data = await response.json()

        if (data.success) {
          // Update dashboard stats
          document.querySelector("#user-count .stat-number").textContent = data.userCount
          document.querySelector("#volunteer-count .stat-number").textContent = data.volunteerCount
          document.querySelector("#request-count .stat-number").textContent = data.requestCount
          document.querySelector("#completed-count .stat-number").textContent = data.completedCount

          // Update charts
          // This would be handled by the chart library in a real application
          console.log("Dashboard data updated for period:", period)
        } else {
          alert("Error updating dashboard: " + data.error)
        }
      } catch (error) {
        console.error("Error:", error)
        alert("An error occurred while updating the dashboard.")
      }
    })
  }

  // Action Buttons
  const actionButtons = document.querySelectorAll(".action-buttons button")

  if (actionButtons.length > 0) {
    actionButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault()

        const action = button.querySelector("i").className
        const row = button.closest("tr")
        const id = row.querySelector("td:first-child").textContent
        const table = row.closest("table").id.replace("-table", "")

        if (action.includes("fa-eye")) {
          // View details
          try {
            const response = await fetch(`/api/admin/${table}/${id}`)
            const data = await response.json()

            if (data.success) {
              // Display details in a modal
              alert(`Details for ${table} ID ${id}:\n\n${JSON.stringify(data.item, null, 2)}`)
            } else {
              alert(`Error fetching details: ${data.error}`)
            }
          } catch (error) {
            console.error("Error:", error)
            alert("An error occurred while fetching details.")
          }
        } else if (action.includes("fa-edit")) {
          // Edit record
          try {
            const response = await fetch(`/api/admin/${table}/${id}`)
            const data = await response.json()

            if (data.success) {
              // In a real application, this would open a modal with a form
              alert(`Edit ${table} ID ${id}:\n\n${JSON.stringify(data.item, null, 2)}`)
            } else {
              alert(`Error fetching record: ${data.error}`)
            }
          } catch (error) {
            console.error("Error:", error)
            alert("An error occurred while fetching the record.")
          }
        } else if (action.includes("fa-trash")) {
          // Delete record
          if (confirm(`Are you sure you want to delete ${table} with ID ${id}?`)) {
            try {
              const response = await fetch(`/api/admin/${table}/${id}`, {
                method: "DELETE",
              })
              const data = await response.json()

              if (data.success) {
                alert(`${table.charAt(0).toUpperCase() + table.slice(1)} with ID ${id} deleted successfully.`)
                row.remove()
              } else {
                alert(`Error deleting record: ${data.error}`)
              }
            } catch (error) {
              console.error("Error:", error)
              alert("An error occurred while deleting the record.")
            }
          }
        }
      })
    })
  }
})
