# Layover

Layover is a travel itinerary management application that helps users organize their trips by consolidating flights, hotels, and activities into a single, chronological timeline. Built on the Internet Computer Protocol (ICP), it provides a secure and decentralized way to plan and share travel itineraries.

## Key Features

- **Secure User Authentication**: Internet Identity integration for passwordless, decentralized login.
- **Profile Management**:
  - User profile setup with customizable display name.
  - Edit name functionality accessible from header dropdown.
  - Automatic profile creation flow for new users.
- **Trip Management**:
  - Create trips with name, optional destination, and optional date range.
  - Edit and delete trips with confirmation dialogs.
  - Automatic share token generation for each trip.
  - Trip list view with destination and date display.
  - Maximum of 50 trips per user with field length validation.
- **Event Management**:
  - Three event types: Flight, Hotel, and Activity.
  - Event details include title, date/time, location, confirmation code, and notes.
  - Location input with optional search via Photon API for auto-fill.
  - Events automatically grouped by day in chronological order.
  - Visual event cards with type-specific icons and color coding.
  - Maximum of 100 events per trip with comprehensive field validation.
- **Trip Sharing**:
  - Generate shareable links for read-only trip viewing.
  - Share via copy link or email.
  - Shared trips accessible without authentication.
  - Clear visual indicator for shared/read-only mode.
- **Modern UI/UX**:
  - Clean, minimal design with light and dark mode support.
  - Fully responsive layout working seamlessly on desktop and mobile.
  - Interactive hover effects and smooth transitions.
  - Elegant landing page with feature preview.

## Technical Specifications

### Backend Functions (Motoko)

#### Profile Management

- `getProfile()`: Retrieves current user's profile information
- `setProfile(name: Text)`: Creates or updates user profile with name validation

#### Trip Management

- `createTrip(...)`: Creates a new trip with optional destination and date range, auto-generates share token
- `getTrips()`: Retrieves all trips for the authenticated user
- `getTripById(id: Nat)`: Gets a single trip with all associated events
- `updateTrip(...)`: Updates trip details with validation
- `deleteTrip(id: Nat)`: Deletes trip and all associated events, removes share token

#### Event Management

- `createEvent(...)`: Adds event to a trip with type, title, datetime, location, and optional details
- `getEvents(tripId: Nat)`: Gets all events for a trip sorted by date/time
- `updateEvent(...)`: Updates event details with validation
- `deleteEvent(id: Nat)`: Removes an event from a trip

#### Sharing

- `getSharedTrip(shareToken: Text)`: Public query to retrieve trip data via share token for unauthenticated access

### Frontend Architecture (React + TypeScript)

#### Components

- **App**: Main application with routing between trip list and trip detail views
- **Header**: Shared header with logo and profile dropdown (edit name, logout)
- **TripList**: Grid view of all user trips with create, edit, and delete actions
- **TripDetail**: Detailed trip view with events grouped by day
- **TripForm**: Dialog for creating and editing trips with optional field validation
- **EventForm**: Dialog for creating and editing events with location search
- **EventCard**: Visual card displaying event details with type-specific styling
- **ProfileSetupDialog**: Initial setup flow for new users to set their name
- **EditNameDialog**: Dialog for updating user display name
- **ShareDialog**: Interface for generating and sharing trip links

#### State Management

- TanStack Query for API state management and caching
- React Query mutations for CRUD operations
- Automatic cache invalidation on data changes

#### Key Features

- Internet Identity authentication integration
- Debounced location search with Photon geocoding API
- Responsive design with mobile-first approach
- Date/time formatting with timezone support
- Share URL generation and clipboard integration

### API Integration

- **Photon Geocoding**: Location search and auto-fill for event locations
- **Share Token System**: Unique token generation for public trip sharing
