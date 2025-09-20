# Apartment Management System (AMS)

A modern, mobile-first apartment management system built with Next.js, TypeScript, Tailwind CSS, and MySQL. This system enables property administrators and building managers to efficiently manage apartments, tenants, and notifications.

## 🏢 Overview

The Apartment Management System is designed specifically for mobile devices while providing an excellent experience across all platforms. It supports two user roles:

- **Admin**: System administrator with full access to manage building managers and all system data
- **Building Manager**: Responsible for managing specific buildings and their apartments

## ✨ Features

### Core Functionality
- **User Management**: Admin can create, update, and manage building manager accounts
- **Building Management**: Add and manage multiple buildings with assigned managers
- **Apartment Registration**: Complete apartment management with tenant information
- **Notification System**: Send notifications about rent, maintenance, and general updates
- **Mobile-First Design**: Optimized for mobile devices with responsive design

### User Experience
- **Progressive Web App (PWA)**: Install as an app on mobile devices
- **Online/Offline Status**: Visual indication of connection status
- **Touch-Optimized Interface**: Large touch targets and mobile-friendly interactions
- **Real-time Notifications**: Toast notifications for user feedback

### Security
- **Role-Based Access Control**: Secure authentication with role-specific permissions
- **Password Hashing**: Secure bcrypt password encryption
- **Session Management**: NextAuth.js for secure session handling
- **Input Validation**: Client and server-side validation

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (mobile-first approach)
- **Database**: MySQL with mysql2
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📱 Mobile-First Design

This application is built with a mobile-first approach:
- All components are designed for mobile screens (320px+) first
- Desktop users see an app download banner
- Touch-optimized interface with large buttons (44px minimum)
- Responsive design with careful use of breakpoints
- PWA capabilities for app-like experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apartment-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create MySQL database
   mysql -u root -p < database.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example file and update with your settings
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=apartment_management_system
   DB_USER=your_username
   DB_PASSWORD=your_password
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Default admin login: `username: admin`, `password: admin`

## 👥 User Roles & Permissions

### Admin User
- **Username**: `admin` (predefined)
- **Password**: `admin` (change in production)
- **Permissions**:
  - Create, update, delete building manager accounts
  - View all buildings and apartments
  - Manage system-wide settings
  - Send notifications to all buildings

### Building Manager
- **Creation**: Created by admin users
- **Permissions**:
  - Manage assigned buildings
  - Add/update apartments in their buildings
  - Manage tenant information
  - Send notifications to their tenants

## 🏗 Database Schema

The system uses a MySQL database with the following main tables:

- **users**: Admin and building manager accounts
- **buildings**: Building information with assigned managers
- **apartments**: Apartment details, rent, and tenant information
- **notifications**: System notifications and alerts
- **rent_payments**: Payment tracking and history
- **maintenance_requests**: Maintenance and repair requests

See `database.sql` for the complete schema with sample data.

## 📱 PWA Features

The application includes Progressive Web App capabilities:

- **Manifest**: App manifest for installation
- **Icons**: Multiple icon sizes for different devices
- **Install Banner**: Prompts desktop users to install the mobile app
- **Offline Detection**: Shows online/offline status
- **Mobile Optimization**: Touch-friendly interface

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── admin/           # Admin dashboard and pages
│   ├── manager/         # Manager dashboard and pages
│   ├── api/             # API routes
│   └── components/      # Shared components
├── lib/
│   ├── db.ts           # Database connection
│   ├── auth.ts         # Authentication config
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
```

### Code Standards
- **Mobile-First**: All components designed for mobile first
- **TypeScript**: Strict typing throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **Component Architecture**: Reusable, accessible components
- **API Routes**: RESTful API design with proper error handling

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🚀 Deployment

### Environment Setup
1. Set up production MySQL database
2. Update environment variables for production
3. Change default admin password
4. Configure domain and SSL certificates

### Build and Deploy
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```env
DB_HOST=your-production-host
DB_USER=your-production-user
DB_PASSWORD=your-secure-password
NEXTAUTH_SECRET=your-very-secure-secret
NEXTAUTH_URL=https://your-domain.com
```

## 🔒 Security Considerations

- Change default admin credentials immediately
- Use strong, unique passwords for database and NextAuth secret
- Enable SSL/HTTPS in production
- Regularly update dependencies
- Monitor database access and logs
- Implement proper backup strategies

## 📝 API Documentation

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### User Management (Admin only)
- `GET /api/users/managers` - Get all building managers
- `POST /api/users/managers` - Create new building manager

### Building Management
- `GET /api/buildings` - Get buildings (filtered by role)
- `POST /api/buildings` - Create new building (Admin only)

### Apartment Management
- `GET /api/apartments` - Get apartments (filtered by role)
- `POST /api/apartments` - Create new apartment

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify MySQL is running
2. Check database credentials in `.env.local`
3. Ensure database exists and schema is imported
4. Check MySQL user permissions

### Authentication Issues
1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and local storage
4. Restart the development server

### Build Issues
1. Run `npm install` to ensure all dependencies are installed
2. Check for TypeScript errors with `npm run lint`
3. Verify environment variables are properly set
4. Clear Next.js cache: `rm -rf .next`

## 📞 Support

For technical support or questions about the Apartment Management System:

1. Check the troubleshooting section above
2. Review the project documentation and comments
3. Ensure you're using the latest version
4. Check for similar issues in the project repository

## 📄 License

This project is built for apartment management and property administration. Please review and comply with all applicable licenses for the dependencies used.

---

**Mobile-First Apartment Management System** - Built with Next.js, TypeScript, and MySQL for modern property management.

## ✅ Fixed Issues

### Login Page
- ✅ **Hamburger menu hidden** on login page
- ✅ **Text visibility fixed** in username/password fields
- ✅ **Authentication working** with correct bcrypt hash

### Database
- ✅ **Complete schema** with all tables and relationships
- ✅ **Correct password hashes** for admin and manager users
- ✅ **Sample data** included for testing