# PON Watcher React Frontend

A modern, responsive React frontend application for monitoring Optical Network Units (ONUs) in PON (Passive Optical Network) infrastructures. This application provides an intuitive interface for network administrators to monitor connection status, view optical parameters, and manage PON networks in real-time.

## Features

### Core Functionality
- **Real-time PON Monitoring**: Monitor ONU connections with automatic refresh
- **Interactive Dashboard**: Clean, tech-inspired interface with live status updates
- **Smart Search**: Real-time filtering with debounced search functionality
- **Status Categorization**: Visual separation of online/offline connections
- **Connection Transitions**: Animated transitions when ONUs change status

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Tech-themed UI**: Cyberpunk-inspired design with cyan/green color scheme
- **Loading States**: Smooth loading animations and status indicators
- **Error Handling**: Graceful error handling with user feedback
- **Accessibility**: Keyboard navigation and screen reader support

### Performance Features
- **Request Deduplication**: Prevents duplicate API calls
- **Debounced Search**: Optimized search with configurable delays
- **Request Cancellation**: Ability to cancel ongoing requests
- **Memory Management**: Automatic cleanup of old cached requests
- **Optimistic Updates**: Instant UI feedback for user actions

### Developer Features
- **Debug Panel**: Built-in debugging tools for development
- **Request Monitoring**: Track API calls and cache status
- **Performance Metrics**: Monitor request counts and timing
- **Development Tools**: Hot reload and modern development experience

## Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Modern JavaScript (ES6+)** - Latest JavaScript features

## Prerequisites

- Node.js 16.0 or higher
- npm 8.0 or higher (or yarn/pnpm equivalent)
- PON Watcher Go Backend running and accessible

## Installation

1. Clone the repository:
```bash
git clone https://github.com/raykavin/ponwatcher-react
cd ponwatcher-react
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API endpoint:
```javascript
// src/services/api.js
const API_BASE_URL = 'http://your-backend-url:3000/api/v1';
```

4. Start the development server:
```bash
npm run dev
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_REFRESH_INTERVAL=10000
VITE_SEARCH_DEBOUNCE=500
VITE_REQUEST_TIMEOUT=30000
```

### API Configuration

The application expects the backend API to be running at the configured endpoint. The default configuration in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://localhost:3000/api/v1';
```

## Usage

### Basic Workflow

1. **Form Page**: Enter PON parameters (OLT, Slot, Card)
2. **Status Page**: View real-time connection monitoring
3. **Search**: Filter connections by name or client
4. **Refresh**: Manual or automatic updates every 10 seconds

### Navigation

- **Home (/)**: Parameter input form
- **Status (/status)**: Real-time monitoring dashboard
- **Auto-redirect**: Redirects to home if accessed without parameters

### Form Parameters

- **OLT**: Select from predefined OLT IP addresses
- **SLOT**: PON slot number (required)
- **CARD/PON**: PON card number (required)
- **SHELF/CHASSIS**: Fixed values (NA) for compatibility

### Status Monitoring

The status page displays connections in two categories:

- **Online**: Active connections with optical parameters
- **Offline**: Inactive connections with basic information

### Search Functionality

- **Real-time filtering** of displayed connections
- **Client name and device name** search
- **Debounced search** to optimize performance
- **Remote search** capability via API

## API Integration

### Expected Backend Response

The frontend expects the following JSON structure from the backend:

```json
{
  "status": "OK",
  "data": {
    "online": {
      "onus": [
        {
          "client_name": "CLIENT-NAME",
          "device_name": "DEVICE-ID",
          "splitter_name": "SPLITTER-01",
          "splitter_port": "1",
          "rx_power": "-25.50",
          "tx_power": "2.50",
          "temperature": "45.2",
          "voltage": "3.3"
        }
      ],
      "total": 1
    },
    "offline": {
      "onus": [],
      "total": 0
    }
  }
}
```

### Request Format

API calls are made to:
```
GET /api/v1/pon-watcher?slot={slot}&card={card}&olt={olt}&s={search}
```

## Component Architecture

```
src/
├── components/
│   └── ConnectivityStatus/
│       ├── ConnectivityStatus.jsx    # Status card component
│       └── index.tsx                 # Component export
├── pages/
│   ├── FormPage.jsx                  # Parameter input form
│   └── StatusPage.jsx                # Main monitoring dashboard
├── services/
│   └── api.js                        # API service layer
└── App.jsx                           # Main application component
```

### Key Components

#### FormPage
- Parameter input form
- OLT selection dropdown
- Form validation
- Responsive design

#### StatusPage
- Real-time monitoring dashboard
- Connection categorization
- Search functionality
- Debug panel
- Auto-refresh mechanism

#### ConnectivityStatus
- Individual connection status card
- Transition animations
- Status-based styling
- Hover effects

#### API Service
- Request deduplication
- Debounced calls
- Request cancellation
- Cache management

## Styling & Theming

### Design System

The application uses a tech-inspired theme with:

- **Primary Colors**: Cyan (#22d3ee) and variations
- **Status Colors**: 
  - Online: Green (#84cc16)
  - Offline: Red (#ef4444)
  - Updating: Yellow (#eab308)
- **Background**: Dark gray tones (#111827, #1f2937, #374151)
- **Typography**: Monospace fonts for tech aesthetic

### Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

### Custom Animations

- **fadeOutUp**: Connection removal animation
- **fadeInDown**: New connection animation
- **Pulse**: Loading and updating states
- **Hover effects**: Interactive feedback

## Development

### Project Structure

```
ponwatcher-react/
├── public/
│   └── assets/
│       └── images/
│           ├── logo.svg
│           └── fiber-icon.svg
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Run tests
npm run test
```

### Development Server

The development server runs on `http://localhost:5173` by default and includes:

- **Hot Module Replacement (HMR)**
- **Fast refresh**
- **Error overlay**
- **Development tools**

## Build & Deployment

### Production Build

```bash
npm run build
```

### Environment Configuration

For production deployment, ensure:

1. **API endpoint** is correctly configured
2. **CORS** is properly set up on the backend
3. **HTTPS** is enabled for secure connections
4. **Environment variables** are properly set

## Performance Optimization

### Implemented Optimizations

- **Request deduplication** prevents duplicate API calls
- **Debounced search** reduces server load
- **Component memoization** with React.memo where appropriate
- **Lazy loading** for non-critical components
- **Optimized bundle** with Vite's tree shaking

### Best Practices

- **Minimal re-renders** through proper state management
- **Efficient list rendering** with proper keys
- **Image optimization** with appropriate formats
- **Cache management** for API responses

## Troubleshooting

### Common Issues

#### API Connection Problems
```
Error: Failed to fetch
```
- Check if the backend is running
- Verify API endpoint configuration
- Check CORS settings on backend
- Ensure network connectivity

#### Build Issues
```
Error: Cannot resolve module
```
- Delete `node_modules` and reinstall
- Clear npm/yarn cache
- Check Node.js version compatibility

#### Performance Issues
- Enable debug panel to monitor requests
- Check for memory leaks in browser dev tools
- Monitor network tab for excessive requests

### Debug Panel

Enable the debug panel in the status page to monitor:

- **Request count** and status
- **Cache utilization**
- **Pending timers**
- **Request history**
- **Performance metrics**

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes following the coding standards
4. Test your changes thoroughly
5. Commit with descriptive messages
6. Push to your fork and create a pull request

### Coding Standards

- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **Component naming**: PascalCase for components
- **File naming**: camelCase for utilities, PascalCase for components
- **CSS classes**: Tailwind utility classes preferred

## License

PON Watcher React Frontend is distributed under the **GNU General Public License v3.0**.  
For complete license terms and conditions, see the [LICENSE](LICENSE.md) file in the repository.

Copyright © [Raykavin Meireles](https://github.com/raykavin)

## Backend Integration

This frontend is designed to work with the PON Watcher Go backend:
**Backend Repository**: [https://github.com/raykavin/ponwatcher-go](https://github.com/raykavin/ponwatcher-go)

## Contact

For support, collaboration, or questions about PON Watcher React Frontend:

**Email**: [raykavin.meireles@gmail.com](mailto:raykavin.meireles@gmail.com)  
**GitHub**: [@raykavin](https://github.com/raykavin)  
**LinkedIn**: [@raykavin.dev](https://www.linkedin.com/in/raykavin-dev)  
**Instagram**: [@raykavin.dev](https://www.instagram.com/raykavin.dev)

---

## Changelog

### v1.0.0
- Initial release
- React 18 with modern hooks
- Responsive design
- Real-time monitoring
- Search functionality
- Debug panel
- Performance optimizations