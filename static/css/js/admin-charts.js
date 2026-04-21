import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded")
    return
  }

  // User Growth Chart
  const userGrowthCanvas = document.getElementById("user-growth-canvas")
  if (userGrowthCanvas) {
    new Chart(userGrowthCanvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Users",
            data: [120, 150, 180, 200, 230, 248],
            borderColor: "#4e54c8",
            backgroundColor: "rgba(78, 84, 200, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Volunteers",
            data: [40, 50, 60, 70, 80, 86],
            borderColor: "#ff7e5f",
            backgroundColor: "rgba(255, 126, 95, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  }

  // Request Types Chart
  const requestTypesCanvas = document.getElementById("request-types-canvas")
  if (requestTypesCanvas) {
    new Chart(requestTypesCanvas, {
      type: "pie",
      data: {
        labels: ["Shopping", "Medical", "Housework", "Transportation", "Companionship"],
        datasets: [
          {
            data: [45, 30, 25, 40, 16],
            backgroundColor: ["#4e54c8", "#ff7e5f", "#28a745", "#17a2b8", "#6c757d"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }
})
