# Xerox Rental Management System

A comprehensive web-based application for managing Xerox machine rentals, built with React frontend and Spring Boot backend with MySQL database.

## Features

### Core Functionality
- **User Management**: Admin, Owner, and Rental user roles with role-based access control
- **Machine Inventory**: Complete machine lifecycle management with real-time status tracking
- **Rental Requests**: Streamlined rental request and approval workflow
- **Contract Management**: Digital contract creation and management
- **Invoice Generation**: Automated invoice generation with GST calculation
- **Support Tickets**: Integrated ticketing system for customer support

### Advanced Features
- **IoT Dashboard**: Real-time machine health monitoring and analytics
- **Predictive Analytics**: AI-powered maintenance predictions and demand forecasting
- **Smart Inventory**: Automated supply level monitoring and reorder alerts
- **Advanced Reporting**: Comprehensive business intelligence and analytics
- **Workflow Automation**: Customizable business process automation
- **Email Notifications**: Automated email alerts and notifications
- **Audit Logging**: Complete activity tracking and compliance reporting

### Technical Features
- **Responsive Design**: Mobile-first design with Material-UI components
- **Real-time Updates**: Live data synchronization and notifications
- **Security**: JWT authentication, role-based authorization, and data encryption
- **Performance**: Optimized database queries and caching
- **Scalability**: Microservices-ready architecture with Docker support

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **Recharts** for data visualization
- **Vite** for build tooling
- **Tailwind CSS** for utility styling

### Backend
- **Spring Boot 3.2** with Java 17
- **Spring Security** for authentication and authorization
- **Spring Data JPA** with Hibernate
- **MySQL 8.0** database
- **Spring Mail** for email services
- **Maven** for dependency management

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Nginx** for reverse proxy and static file serving
- **MySQL** for data persistence
- **JWT** for stateless authentication

## Quick Start

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd xerox-rental-management
```

2. **Setup Database**
```bash
mysql -u root -p
CREATE DATABASE xerox_rental_db;
CREATE USER 'xerox_user'@'localhost' IDENTIFIED BY 'xerox_password';
GRANT ALL PRIVILEGES ON xerox_rental_db.* TO 'xerox_user'@'localhost';
FLUSH PRIVILEGES;
exit

# Import schema
mysql -u xerox_user -p xerox_rental_db < database/schema.sql
```

3. **Backend Setup**
```bash
cd backend
# Update application.properties with your database credentials
mvn clean install
mvn spring-boot:run
```

4. **Frontend Setup**
```bash
# In project root
npm install
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

### Default Login Credentials
- **Admin**: admin@xerox.com / password
- **Owner**: owner@xerox.com / password
- **Rental**: rental@xerox.com / password

## Production Deployment

### Docker Deployment (Recommended)

1. **Using Docker Compose**
```bash
cd deployment
docker-compose up -d
```

This will start:
- MySQL database on port 3306
- Spring Boot backend on port 8080
- React frontend on port 80

### Manual Deployment

1. **Run the production setup script** (Ubuntu/Debian)
```bash
sudo chmod +x deployment/production-setup.sh
sudo ./deployment/production-setup.sh
```

2. **Deploy application files**
```bash
# Backend
cd backend
mvn clean package -DskipTests
sudo cp target/*.jar /opt/xerox-rental/xerox-rental.jar

# Frontend
npm run build
sudo cp -r dist/* /opt/xerox-rental/frontend/

# Database
mysql -u xerox_user -p xerox_rental_db < database/schema.sql
```

3. **Start services**
```bash
sudo systemctl start xerox-rental
sudo systemctl start nginx
```

### Environment Configuration

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=3307
DB_NAME=xerox_rental_db
DB_USER=xerox_us
DB_PASSWORD=your_secure_password
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080/api
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Machine Management
- `GET /api/machines` - Get all machines
- `POST /api/machines` - Create machine
- `PUT /api/machines/{id}` - Update machine
- `DELETE /api/machines/{id}` - Delete machine

### Invoice Management
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/{id}/pay` - Mark invoice as paid

### Additional Endpoints
- Rental Requests: `/api/rental-requests`
- Contracts: `/api/contracts`
- Tickets: `/api/tickets`
- Reports: `/api/reports`
- Notifications: `/api/notifications`

## Database Schema

The application uses a comprehensive MySQL schema with the following main tables:
- `users` - User accounts and profiles
- `machines` - Machine inventory and details
- `invoices` - Billing and payment records
- `rental_requests` - Rental application workflow
- `contracts` - Rental agreements
- `tickets` - Support and maintenance tickets
- `machine_health` - IoT sensor data and health metrics
- `maintenance_schedules` - Preventive maintenance planning
- `notifications` - System notifications
- `audit_logs` - Activity tracking and compliance

## Security Features

- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Password hashing with BCrypt
- **API Security**: CORS configuration and request validation
- **Audit Trail**: Comprehensive activity logging
- **Input Validation**: Server-side validation for all inputs

## Monitoring and Maintenance

### Health Checks
- Application health: `/actuator/health`
- Database connectivity monitoring
- Real-time system metrics

### Logging
- Application logs: `/var/log/xerox-rental/`
- Database logs: MySQL error logs
- Web server logs: Nginx access/error logs

### Backup Strategy
- Database: Automated daily backups
- Application files: Version-controlled deployment
- Configuration: Environment-specific configs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## Roadmap

### Upcoming Features
- Mobile application (React Native)
- Advanced AI/ML analytics
- Integration with external ERP systems
- Multi-tenant architecture
- Advanced workflow automation
- Real-time chat support
- Advanced reporting dashboard
- API rate limiting and throttling

### Performance Improvements
- Redis caching layer
- Database query optimization
- CDN integration for static assets
- Microservices architecture migration