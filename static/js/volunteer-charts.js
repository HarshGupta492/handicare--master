document.addEventListener('DOMContentLoaded', async function() {
    // Get chart canvases
    const tasksTypeCanvas = document.getElementById('tasks-type-canvas');
    const monthlyActivityCanvas = document.getElementById('monthly-activity-canvas');
    const ratingHistoryCanvas = document.getElementById('rating-history-canvas');
    
    // Get performance period select
    const performancePeriod = document.getElementById('performance-period');
    
    // Initialize charts
    let tasksTypeChart, monthlyActivityChart, ratingHistoryChart;
    
    // Load initial data
    await loadPerformanceData();
    
    // Add event listener for period change
    if (performancePeriod) {
        performancePeriod.addEventListener('change', loadPerformanceData);
    }
    
    async function loadPerformanceData() {
        try {
            console.log('Loading performance data...');
            const period = performancePeriod ? performancePeriod.value : 'month';
            const response = await fetch(`/api/volunteer/performance?period=${period}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            if (data.success) {
                updateStatistics(data.performance.stats);
                updateCharts(data.performance);
            } else {
                console.error('Error in response:', data.error);
            }
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    }
    
    function updateStatistics(stats) {
        try {
            // Update statistics cards
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = stats.totalTasks;
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = stats.completedTasks;
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = stats.averageRating.toFixed(1);
            document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = stats.hoursVolunteered;
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
    
    function updateCharts(data) {
        try {
            console.log('Updating charts with data:', data);
            
            // Tasks by Type Chart
            if (tasksTypeCanvas) {
                if (tasksTypeChart) {
                    tasksTypeChart.destroy();
                }
                
                const taskTypes = data.tasksByType.map(t => t.type);
                const taskCounts = data.tasksByType.map(t => t.count);
                
                console.log('Tasks by type data:', { types: taskTypes, counts: taskCounts });
                
                tasksTypeChart = new Chart(tasksTypeCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: taskTypes,
                        datasets: [{
                            data: taskCounts,
                            backgroundColor: [
                                '#4e54c8',
                                '#ff7e5f',
                                '#28a745',
                                '#17a2b8',
                                '#6c757d'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
            
            // Monthly Activity Chart
            if (monthlyActivityCanvas) {
                if (monthlyActivityChart) {
                    monthlyActivityChart.destroy();
                }
                
                const months = data.monthlyActivity.map(m => {
                    const [year, month] = m.month.split('-');
                    return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                }).reverse();
                
                const completedTasks = data.monthlyActivity.map(m => m.completed_tasks).reverse();
                
                console.log('Monthly activity data:', { months, completedTasks });
                
                monthlyActivityChart = new Chart(monthlyActivityCanvas, {
                    type: 'bar',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Tasks Completed',
                            data: completedTasks,
                            backgroundColor: '#4e54c8'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
            
            // Rating History Chart
            if (ratingHistoryCanvas) {
                if (ratingHistoryChart) {
                    ratingHistoryChart.destroy();
                }
                
                const months = data.ratingHistory.map(m => {
                    const [year, month] = m.month.split('-');
                    return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                }).reverse();
                
                const ratings = data.ratingHistory.map(m => m.average_rating).reverse();
                
                console.log('Rating history data:', { months, ratings });
                
                ratingHistoryChart = new Chart(ratingHistoryCanvas, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Average Rating',
                            data: ratings,
                            borderColor: '#ff7e5f',
                            backgroundColor: 'rgba(255, 126, 95, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                min: 0,
                                max: 5,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }
}); 