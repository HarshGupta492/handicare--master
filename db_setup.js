const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "harsh",
  multipleStatements: true,
}

async function setupDatabase() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig)

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "handicare"}`)

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || "handicare"}`)

    // Disable foreign key checks before dropping tables
    await connection.query("SET FOREIGN_KEY_CHECKS = 0")

    // Drop existing tables in correct dependency order
    await connection.query("DROP TABLE IF EXISTS transactions")
    await connection.query("DROP TABLE IF EXISTS feedback")
    await connection.query("DROP TABLE IF EXISTS emergency_contacts")
    await connection.query("DROP TABLE IF EXISTS help_requests")
    await connection.query("DROP TABLE IF EXISTS helprequests")
    await connection.query("DROP TABLE IF EXISTS general_feedback")
    await connection.query("DROP TABLE IF EXISTS admins")
    await connection.query("DROP TABLE IF EXISTS volunteers")
    await connection.query("DROP TABLE IF EXISTS users")

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1")

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        disability VARCHAR(100),
        role ENUM('user', 'admin', 'volunteer') DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create volunteers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        skills TEXT,
        availability TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create help_requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS help_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        volunteer_id INT,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        is_urgent BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending',
        payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        start_time DATETIME NULL,
        end_time DATETIME NULL,
        updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL
      )
    `)

    // Create emergency_contacts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create feedback table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        volunteer_id INT NOT NULL,
        request_id INT,
        name VARCHAR(100),
        email VARCHAR(100),
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES help_requests(id) ON DELETE SET NULL
      )
    `)

    // Create general_feedback table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS general_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        volunteer_id INT NOT NULL,
        request_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50) NOT NULL,
        transaction_ref VARCHAR(100),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES help_requests(id) ON DELETE CASCADE
      )
    `)

    // Create default admin account
    const adminExists = await connection.query("SELECT * FROM admins WHERE email = ?", ["admin@handicare.org"])

    if (adminExists[0].length === 0) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      await connection.query("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)", [
        "Admin User",
        "admin@handicare.org",
        hashedPassword,
      ])

      console.log("Default admin account created:")
      console.log("Email: admin@handicare.org")
      console.log("Password: admin123")
    }

    // Create sample data
    const usersExist = await connection.query("SELECT * FROM users LIMIT 1")

    if (usersExist[0].length === 0) {
      // Create sample users
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("password123", salt)

      await connection.query(`
        INSERT INTO users (name, email, phone, password, address, disability, role) VALUES
        ('John Doe', 'john.doe@example.com', '(555) 123-4567', '${hashedPassword}', '123 Main St, Anytown, ST 12345', 'Mobility Impairment', 'user'),
        ('Emily Johnson', 'emily.j@example.com', '(555) 987-6543', '${hashedPassword}', '456 Oak St, Anytown, ST 12345', 'Visual Impairment', 'user'),
        ('Robert Smith', 'robert.s@example.com', '(555) 456-7890', '${hashedPassword}', '789 Pine St, Anytown, ST 12345', 'Hearing Impairment', 'user')
      `)

      // Create sample volunteers
      await connection.query(`
        INSERT INTO volunteers (name, email, phone, password, address, skills, availability) VALUES
        ('Sarah Johnson', 'sarah.j@example.com', '(555) 234-5678', '${hashedPassword}', '101 Elm St, Anytown, ST 12345', 'driving,shopping,companionship', 'weekday-morning,weekday-evening,weekend-morning'),
        ('Michael Brown', 'michael.b@example.com', '(555) 876-5432', '${hashedPassword}', '202 Maple St, Anytown, ST 12345', 'housework,medical,companionship', 'weekday-afternoon,weekend-afternoon,weekend-evening'),
        ('Emily Davis', 'emily.d@example.com', '(555) 345-6789', '${hashedPassword}', '303 Birch St, Anytown, ST 12345', 'medical,transportation,companionship', 'weekday-morning,weekday-afternoon,weekend-morning')
      `)

      // Create sample help requests
      await connection.query(`
        INSERT INTO help_requests (user_id, volunteer_id, title, type, date, time, duration, location, description, is_urgent, status, created_at, completed_at) VALUES
        (1, 2, 'Grocery Shopping Assistance', 'shopping', '2023-05-15', '10:00:00', 2, '123 Main St, Anytown', 'Need help with weekly grocery shopping. I have mobility issues and cannot carry heavy items.', 0, 'pending', NOW() - INTERVAL 2 DAY, NULL),
        (1, 1, 'Doctor\\'s Appointment', 'medical', '2023-05-20', '14:00:00', 2, '456 Health Ave, Anytown', 'Need transportation to and from doctor\\'s appointment. I use a wheelchair.', 0, 'accepted', NOW() - INTERVAL 3 DAY, NULL),
        (1, 2, 'Home Cleaning Help', 'housework', '2023-05-10', '13:00:00', 2, '123 Main St, Anytown', 'Needed help with cleaning my apartment. I have limited mobility in my arms.', 0, 'completed', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
        (2, 1, 'Reading Assistance', 'companionship', '2023-05-18', '15:00:00', 2, '456 Oak St, Anytown', 'Need someone to read mail and help with some paperwork. I have visual impairment.', 1, 'pending', NOW() - INTERVAL 1 DAY, NULL),
        (3, 3, 'Grocery Shopping', 'shopping', '2023-04-28', '10:00:00', 2, '789 Pine St, Anytown', 'Need help with grocery shopping. I have hearing impairment.', 0, 'completed', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY)
      `)

      // Create sample emergency contacts
      await connection.query(`
        INSERT INTO emergency_contacts (user_id, name, relationship, phone, email) VALUES
        (1, 'Mary Smith', 'Sister', '(555) 123-4567', 'mary.smith@example.com'),
        (1, 'Dr. James Wilson', 'Doctor', '(555) 987-6543', 'dr.wilson@example.com'),
        (2, 'David Johnson', 'Brother', '(555) 234-5678', 'david.j@example.com'),
        (3, 'Lisa Smith', 'Daughter', '(555) 876-5432', 'lisa.s@example.com')
      `)

      // Create sample feedback
      await connection.query(`
        INSERT INTO feedback (user_id, volunteer_id, request_id, rating, comment, is_public, created_at) VALUES
        (1, 2, 3, 5, 'Michael was extremely helpful and thorough. He was respectful of my space and made sure to ask before moving anything. Would definitely request his help again!', 1, NOW() - INTERVAL 5 DAY),
        (2, 1, 5, 4, 'Sarah was very helpful with my grocery shopping. She got most items on my list but missed a few. Overall a good experience.', 1, NOW() - INTERVAL 9 DAY),
        (3, 3, 5, 5, 'Emily was punctual and very kind. She helped me with my doctor\\'s appointment and made sure I was comfortable throughout the process.', 1, NOW() - INTERVAL 8 DAY)
      `)

      console.log("Sample data created successfully")
    }

    console.log("Database setup completed successfully")

  } catch (err) {
    console.error("Error setting up database:", err)
    throw err
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log("Database setup completed successfully")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Failed to set up database:", err)
    process.exit(1)
  })
