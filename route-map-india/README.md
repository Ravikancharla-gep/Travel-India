# My Route Map - India Travel Tracker

A beautiful React application for tracking your travels across India with interactive maps, route visualization, and trip management.

## 🚀 Features

- **Interactive India Map**: Built with Leaflet.js and OpenStreetMap
- **Trip Management**: Create multiple trip lists with custom color themes
- **Route Visualization**: See your travel routes with animated connecting lines
- **Place Management**: Add places with photos, descriptions, and travel details
- **Image Gallery**: Upload and view photos for each location
- **Responsive Design**: Works perfectly on desktop and mobile
- **Local Storage**: All data persists in your browser
- **Smooth Animations**: Powered by Framer Motion

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Leaflet.js** for interactive maps
- **React Leaflet** for React integration
- **Framer Motion** for animations
- **Lucide React** for icons

## 📋 Prerequisites

- **Node.js 20.19+** or **22.12+** (Required for Vite)
- **npm** or **yarn** package manager

## 🚀 Getting Started

### Option 1: Quick Demo (No Installation Required)

1. **Open the demo file**
   - Simply open `demo.html` in your web browser
   - No Node.js or installation required
   - See the Kerala Trip with interactive map

### Option 2: Full Development Setup

1. **Prerequisites**
   - Node.js 20.19+ or 22.12+ (Required for Vite)
   - npm or yarn package manager

2. **Install dependencies**
   ```bash
   cd route-map-india
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Node.js Version Issues?

If you have an older Node.js version:
- **Use the demo**: Open `demo.html` directly in your browser
- **Upgrade Node.js**: Use `nvm` to manage versions
- **Alternative**: Use `yarn` instead of `npm`

## 🗺️ How to Use

### Creating Your First Trip

1. **Create a Trip List**: Click the "+" button in the sidebar to create a new trip
2. **Add Places**: Click the floating "+" button on the map to add places
3. **Fill Details**: Enter place name, coordinates, transport mode, and upload photos
4. **View Routes**: See animated route lines connecting your places
5. **Explore**: Click on markers to see detailed information and photos

### Sample Data

The app comes with a pre-loaded "Kerala Trip" featuring:
- **Munnar**: Hill station with tea plantations
- **Kochi**: Historic port city
- **Alleppey**: Famous for backwaters

## 🎨 Features in Detail

### Interactive Map
- Zoom and pan around India
- Custom colored markers for each trip
- Hover effects with image previews
- Click markers for detailed popups

### Trip Management
- Create unlimited trip lists
- Each trip has a unique color theme
- Switch between trips to see different routes
- Delete trips and places as needed

### Place Details
- Upload photos (stored as base64)
- Add descriptions and travel information
- Track transport modes (Bus, Train, Car, Flight, etc.)
- Record distances and travel times
- View full-screen image galleries

### Data Persistence
- All data saved to browser localStorage
- No server required
- Data persists between sessions

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Sidebar.tsx     # Trip list management
│   ├── AddPlaceForm.tsx # Add new places
│   ├── PlacePopup.tsx  # Marker popup content
│   └── ImageModal.tsx  # Full-screen image viewer
├── types/              # TypeScript type definitions
│   └── index.ts        # All app types
├── utils/              # Utility functions
│   └── storage.ts      # localStorage helpers
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌟 Future Enhancements

- **User Authentication**: Firebase/Supabase integration
- **Cloud Storage**: Store images in the cloud
- **Auto Distance Calculation**: Google Maps API integration
- **Export Features**: Share maps and trip summaries
- **Offline Support**: PWA capabilities
- **Social Features**: Share trips with friends

## 🐛 Troubleshooting

### Node.js Version Issues
If you encounter Node.js version errors:
- Upgrade to Node.js 20.19+ or 22.12+
- Use `nvm` to manage Node.js versions

### Map Not Loading
- Check your internet connection
- Ensure Leaflet CSS is loaded
- Check browser console for errors

### Data Not Persisting
- Check if localStorage is enabled
- Clear browser cache and try again
- Ensure you're not in private/incognito mode

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Leaflet.js** for the amazing mapping library
- **OpenStreetMap** for free map tiles
- **Tailwind CSS** for beautiful styling
- **Framer Motion** for smooth animations

---

**Happy Traveling! 🗺️✈️**