document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const authTabs = document.querySelectorAll(".auth-tab")
  const authForms = document.querySelectorAll(".auth-form")

  if (authTabs.length > 0) {
    authTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-target")

        // Update active tab
        authTabs.forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")

        // Show target form
        authForms.forEach((form) => {
          if (form.id === target) {
            form.classList.add("active")
          } else {
            form.classList.remove("active")
          }
        })
      })
    })

    // Check URL parameters for pre-selecting tabs
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get("type")

    if (type) {
      const targetTab =
        document.querySelector(`.auth-tab[data-target="${type}-register"]`) ||
        document.querySelector(`.auth-tab[data-target="${type}-login"]`)

      if (targetTab) {
        targetTab.click()
      }
    }
  }

  // Password Toggle Visibility
  const toggleButtons = document.querySelectorAll(".toggle-password")

  if (toggleButtons.length > 0) {
    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.previousElementSibling
        const icon = button.querySelector("i")

        if (input.type === "password") {
          input.type = "text"
          icon.classList.remove("fa-eye")
          icon.classList.add("fa-eye-slash")
        } else {
          input.type = "password"
          icon.classList.remove("fa-eye-slash")
          icon.classList.add("fa-eye")
        }
      })
    })
  }

  // Password Strength Meter
  const passwordInputs = document.querySelectorAll('input[type="password"][id$="password"]:not([id*="confirm"])')

  if (passwordInputs.length > 0) {
    passwordInputs.forEach((input) => {
      const form = input.closest("form")
      if (!form) return

      const strengthMeter = form.querySelector(".strength-meter-fill")
      const strengthText = form.querySelector(".strength-text span")

      if (strengthMeter && strengthText) {
        input.addEventListener("input", () => {
          const password = input.value
          let strength = 0
          let status = "Weak"

          if (password.length >= 8) strength += 1
          if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1
          if (password.match(/\d/)) strength += 1
          if (password.match(/[^a-zA-Z\d]/)) strength += 1

          strengthMeter.setAttribute("data-strength", strength)

          switch (strength) {
            case 0:
              status = "Weak"
              break
            case 1:
              status = "Fair"
              break
            case 2:
              status = "Good"
              break
            case 3:
              status = "Strong"
              break
            case 4:
              status = "Very Strong"
              break
          }

          strengthText.textContent = status
        })
      }
    })
  }

  // Form Validation
  const loginForm =
    document.getElementById("user-login") ||
    document.getElementById("volunteer-login") ||
    document.getElementById("admin-login")
  const registerForm = document.getElementById("user-register") || document.getElementById("volunteer-register")

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      // Let the server handle validation for login
      // This is just to set the role in a hidden field
      const roleMatch = loginForm.id.match(/(user|volunteer|admin)-login/)
      if (roleMatch) {
        const role = roleMatch[1]

        // Check if hidden role field exists, if not create it
        let roleField = loginForm.querySelector('input[name="role"]')
        if (!roleField) {
          roleField = document.createElement("input")
          roleField.type = "hidden"
          roleField.name = "role"
          loginForm.appendChild(roleField)
        }

        roleField.value = role
      }
    })
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault()

      // Basic validation
      let isValid = true
      const requiredFields = registerForm.querySelectorAll("[required]")

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")

          // Add error message if it doesn't exist
          let errorMsg = field.nextElementSibling
          if (!errorMsg || !errorMsg.classList.contains("error-message")) {
            errorMsg = document.createElement("div")
            errorMsg.classList.add("error-message")
            errorMsg.textContent = "This field is required"
            field.parentNode.insertBefore(errorMsg, field.nextSibling)
          }
        } else {
          field.classList.remove("error")

          // Remove error message if it exists
          const errorMsg = field.nextElementSibling
          if (errorMsg && errorMsg.classList.contains("error-message")) {
            errorMsg.remove()
          }
        }
      })

      // Password confirmation validation
      const password = registerForm.querySelector('input[type="password"][id$="password"]:not([id*="confirm"])')
      const confirmPassword = registerForm.querySelector('input[type="password"][id*="confirm"]')

      if (password && confirmPassword && password.value !== confirmPassword.value) {
        isValid = false
        confirmPassword.classList.add("error")

        // Add error message if it doesn't exist
        let errorMsg = confirmPassword.nextElementSibling
        if (!errorMsg || !errorMsg.classList.contains("error-message")) {
          errorMsg = document.createElement("div")
          errorMsg.classList.add("error-message")
          errorMsg.textContent = "Passwords do not match"
          confirmPassword.parentNode.insertBefore(errorMsg, confirmPassword.nextSibling)
        }
      }

      // Set role in hidden field
      const roleMatch = registerForm.id.match(/(user|volunteer)-register/)
      if (roleMatch) {
        const role = roleMatch[1]

        // Check if hidden role field exists, if not create it
        let roleField = registerForm.querySelector('input[name="role"]')
        if (!roleField) {
          roleField = document.createElement("input")
          roleField.type = "hidden"
          roleField.name = "role"
          registerForm.appendChild(roleField)
        }

        roleField.value = role
      }

      // If form is valid, submit it
      if (isValid) {
        registerForm.submit()
      }
    })
  }
})
