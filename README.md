<<<<<<< HEAD
# Advocate Assist - Case Management System

A complete, workable legal case management helper application for advocates in India. This system helps advocates manage multiple cases, track hearing dates, maintain case history, and receive automated notifications for upcoming hearings.

## Features

### Core Functionality
- **User Authentication**: Secure login and registration system
- **Case Management**: Add, edit, delete, and view cases with complete information
- **Case History Tracking**: Maintain chronological timeline of all case events
- **Hearing Date Alerts**: Automated notifications for upcoming hearings (1, 3, and 7 days before)
- **Search & Filter**: Quick search by case number, client name, court name, and filter by status/date
- **Dashboard Overview**: Quick stats and upcoming hearings panel

### Key Features for Indian Legal System
- **IPC/BNS Section Support**: Track both IPC (Indian Penal Code) and BNS (Bharatiya Nyaya Sanhita) sections
- **Case Status Tracking**: Active, Postponed, and Closed status management
- **Indian Date Format**: Dates displayed in DD/MM/YYYY format
- **Court and Judge Information**: Comprehensive court case details

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- LocalStorage support (available in all modern browsers)
- Notification API support (for browser notifications)

### Installation

1. **Download or Clone the Project**
   ```bash
   # If using git
   git clone <repository-url>
   cd legalmanger
   ```

2. **No Build Process Required**
   - This is a pure HTML/CSS/JavaScript application
   - No npm install or build steps needed
   - Simply open the files in a browser

3. **Open the Application**
   - Option 1: Open `index.html` directly in your browser
   - Option 2: Use a local web server for better experience:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Python 2
     python -m SimpleHTTPServer 8000
     
     # Using Node.js (http-server package)
     npx http-server
     ```
     Then navigate to `http://localhost:8000` in your browser

### Demo Credentials

**Default Demo User:**
- Username: `admin`
- Password: `password123`

You can also register a new account using the registration form on the login page.

## Usage Guide

### Login/Registration

1. Open `index.html` in your browser
2. Use the demo credentials or click "Register here" to create a new account
3. Fill in the registration form (username, email, password)
4. After registration or login, you'll be redirected to the dashboard

### Adding a Case

1. Click the **"+ Add New Case"** button on the dashboard
2. Fill in the case information:
   - **Case Number** (required): Unique case identifier
   - **Case Title** (required): Brief title of the case
   - **Client Name** (required): Name of the client
   - **Court Name** (required): Name of the court
   - **Judge Name**: Name of the presiding judge
   - **Case Type**: Select from Criminal, Civil, Family, Corporate, Property, or Other
   - **IPC Section**: Old IPC section (e.g., IPC 302)
   - **BNS Section**: New BNS section (e.g., BNS 101)
   - **Status**: Active, Postponed, or Closed
   - **Next Hearing Date** (required): Date of next hearing
   - **Next Hearing Time**: Time of hearing (optional)
   - **Description**: Case details and notes
3. Click **"Save Case"** to add the case

### Viewing Cases

- All cases are displayed as cards on the dashboard
- Cards show:
  - Case number and title
  - Client name
  - Court name
  - Next hearing date
  - Status badge
  - Urgency indicators (color-coded borders)
- Click on any case card to view full details

### Editing a Case

1. Click the **"Edit"** button on a case card, or
2. Open case details and click **"Edit Case"**
3. Modify any fields
4. Click **"Save Case"** to update

### Adding Case History

1. Open a case detail page
2. Scroll to the **"Case History"** section
3. Click **"+ Add History Entry"**
4. Fill in:
   - **Event Date**: Date of the event
   - **Event Type**: Hearing, Filing, Order, Postponement, etc.
   - **Hearing Date**: If applicable
   - **Updated Status**: If status changed
   - **Description**: Details of the event
5. Click **"Add Entry"**

### Search and Filter

**Search:**
- Type in the search box to find cases by:
  - Case number
  - Case title
  - Client name
  - Court name

**Filter by Status:**
- Select from dropdown: All, Active, Postponed, or Closed

**Filter by Date:**
- Today: Cases with hearings today
- Next 7 Days: Cases with hearings in the next week
- Next 30 Days: Cases with hearings in the next month

### Notifications

**Browser Notifications:**
1. When you first visit the dashboard, your browser will ask for notification permission
2. Click **"Allow"** to enable notifications
3. You'll receive notifications for hearings:
   - 7 days before
   - 3 days before
   - 1 day before (tomorrow)
   - On the day of the hearing

**Visual Alerts:**
- **Alert Banner**: Appears at the top of dashboard for urgent hearings
- **Upcoming Hearings Panel**: Shows cases with hearings in next 7 days
- **Color-Coded Cards**: 
  - Red border: Urgent (1 day or less)
  - Yellow border: Soon (2-3 days)
  - Blue border: Normal (4+ days)

### Statistics Dashboard

The sidebar shows:
- **Total Cases**: All cases in the system
- **Active Cases**: Cases with "Active" status
- **Postponed Cases**: Cases with "Postponed" status

## Data Storage

### LocalStorage
- All data is stored in browser's localStorage
- Each user's data is isolated
- Data persists between browser sessions
- **Important**: Data is stored locally on your device only

### Backup and Export
- Currently, data export functionality is available in the code
- Future version will include export/import feature in the UI

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

**Note**: Browser notifications require HTTPS in production, but work on localhost for development.

## File Structure

```
legalmanger/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── case-detail.html        # Individual case view
├── css/
│   ├── style.css          # Global styles
│   ├── login.css          # Login page styles
│   └── dashboard.css      # Dashboard styles
├── js/
│   ├── utils.js           # Utility functions
│   ├── storage.js         # localStorage management
│   ├── auth.js            # Authentication system
│   ├── cases.js           # Case management
│   ├── notifications.js   # Browser notifications
│   └── alerts.js          # Alert system
└── README.md              # This file
```

## Future Enhancements

### Planned Features
- **AI Assistant Integration**: Help with BNS vs IPC confusion and legal queries
- **Email Notifications**: Send email alerts for upcoming hearings
- **Calendar View**: Visual calendar of all hearings
- **PDF Export**: Export case details and history to PDF
- **Backend Integration**: Cloud storage and multi-device sync
- **SMS Notifications**: SMS alerts for urgent hearings
- **Document Management**: Attach and manage case documents
- **Client Portal**: Allow clients to view case status

### AI Assistant Integration Points
The codebase includes marked sections where AI assistant can be integrated:
- Case description analysis
- IPC/BNS section lookup and comparison
- Legal document generation
- Case timeline analysis
- Hearing preparation reminders

## Troubleshooting

### Notifications Not Working
- Ensure you've granted notification permission
- Check browser notification settings
- Try refreshing the page

### Data Not Saving
- Check browser localStorage quota (usually 5-10MB)
- Delete old/unused cases
- Try clearing browser cache and reloading

### Page Not Loading
- Ensure all files are in the correct directory structure
- Check browser console for errors (F12)
- Try a different browser

### Login Issues
- Use the demo credentials: admin / password123
- Clear browser localStorage and try again
- Register a new account if needed

## Security Notes

**Important for Production:**
- This is a demo/development version
- Passwords are stored in plain text (NOT secure for production)
- For production use, implement:
  - Password hashing (bcrypt, etc.)
  - HTTPS encryption
  - Backend authentication
  - Database instead of localStorage
  - Session management
  - CSRF protection

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure all files are present and correctly linked

## License

This project is provided as-is for demonstration purposes.

## Version

**Current Version**: 1.0.0
**Last Updated**: 2024

---

**Note**: This application is designed to help advocates manage their cases more efficiently. Always verify important case information independently and use this as a supplementary tool, not a replacement for proper case management practices.

=======
# advocates-assist
>>>>>>> e3b860fe62aef4554f36d1af19ddfebf1c6015ad
