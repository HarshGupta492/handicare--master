import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded")
    return
  }

  // Tasks by Type Chart
  const tasksByTypeCanvas = document.getElementById("tasks-type-canvas")
  if (tasksByTypeCanvas) {
    new Chart(tasksByTypeCanvas, {
      type: "doughnut",
      data: {
        labels: ["Shopping", "Medical", "Housework", "Transportation", "Companionship"],
        datasets: [
          {
            data: [8, 5, 4, 6, 1],
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

  // Monthly Activity Chart
  const monthlyActivityCanvas = document.getElementById("monthly-activity-canvas")
  if (monthlyActivityCanvas) {
    new Chart(monthlyActivityCanvas, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Tasks Completed",
            data: [3, 5, 4, 6, 8, 4],
            backgroundColor: "#4e54c8",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    })
  }

  // Rating History Chart
  const ratingHistoryCanvas = document.getElementById("rating-history-canvas")
  if (ratingHistoryCanvas) {
    new Chart(ratingHistoryCanvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Average Rating",
            data: [4.2, 4.5, 4.3, 4.7, 4.5, 4.8],
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
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    })
  }
})
