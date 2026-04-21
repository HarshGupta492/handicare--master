# HandiCare - Helpdesk for Handicapped People

HandiCare is a comprehensive web application designed to connect people with disabilities to volunteers who can provide assistance with various tasks. The platform facilitates help requests, volunteer matching, feedback, and emergency assistance.

## Features

- User registration and authentication (Users, Volunteers, Admins)
- User Dashboard for managing help requests and emergency contacts
- Volunteer Dashboard for accepting and managing assistance tasks
- Admin Panel for overseeing all platform activities
- Feedback system for rating and reviewing volunteers
- Emergency assistance page with quick access to emergency services
- Responsive design for all devices

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: Express-session with MySQL store
- **Password Security**: bcrypt.js for password hashing
- **Charts**: Chart.js for data visualization

## Installation and Setup

1. Clone the repository:
   \`\`\`
   git clone https://github.com/yourusername/handicare.git
   cd handicare
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Create a `.env` file in the root directory with the following variables:
   \`\`\`
   PORT=3000
   SESSION_SECRET=your_session_secret
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=handicare
   \`\`\`

4. Set up the database:
   \`\`\`
   npm run setup
   \`\`\`
   This will create the database, tables, and sample data.

5. Start the server:
   \`\`\`
   npm start
   \`\`\`

6. Access the application at `http://localhost:3000`

## Default Accounts

After running the setup script, the following accounts will be available:

### Admin
- Email: admin@handicare.org
- Password: admin123

### User
- Email: john.doe@example.com
- Password: password123

### Volunteer
- Email: sarah.j@example.com
- Password: password123

## Project Structure

- `server.js` - Main application file
- `db_setup.js` - Database setup script
- `static/` - Static assets (CSS, JavaScript, images)
- `templates/` - HTML templates
- `database.sql` - SQL schema

## License

This project is licensed under the MIT License - see the LICENSE file for details.
