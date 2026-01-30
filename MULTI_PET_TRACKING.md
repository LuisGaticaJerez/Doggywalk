# Multi-Pet Real-Time Tracking System

## Overview
The DoggyWalk platform now supports simultaneous tracking of multiple pets for owners who have multiple active service bookings at the same time.

## Key Features

### 1. Multiple Concurrent Services
- **Owners can book services for different pets simultaneously**
- Each pet can have its own active service with a different provider
- No limit on the number of concurrent active bookings per owner
- Each booking maintains its own independent route and tracking data

### 2. Live Tracking Dashboard
When owners have active services, a special "Live Tracking" section appears at the top of the dashboard showing:
- Real-time count of active services
- List of all pets currently on walks
- Quick access buttons to each pet's individual tracking page
- Visual indicators (green pulse animation) for active services
- Status badges showing "LIVE" for in-progress services or "ACCEPTED" for scheduled services

### 3. Independent Route Tracking
Each service booking has:
- **Unique route ID** linked to `booking_id`
- **Separate GPS coordinates** stored in `routes.coordinates`
- **Independent real-time updates** via Supabase Realtime channels
- **Individual distance and duration tracking**

### 4. Enhanced Bookings Page
The bookings page now displays:
- **Prominent pet names** with emoji icons for owner bookings
- **Green border and shadow** for active services
- **Pulsing green indicator** on active booking cards
- **Pet-specific tracking buttons** clearly labeled with pet names
- Better visual hierarchy to distinguish multiple active services

## How It Works

### For Owners

1. **Dashboard View**
   - Active services section shows at the top if any pet has an active/accepted booking
   - Each card shows: Pet name, provider name, and status
   - Click any card to go directly to that pet's live tracking

2. **Bookings Page**
   - Active services are highlighted with green borders
   - Each booking card clearly shows the pet name
   - "Track Walk" button available for accepted/in-progress services
   - Can track multiple pets simultaneously by opening multiple tabs

3. **Live Tracking Page** (`/bookings/:bookingId/track`)
   - Real-time map showing provider's current location
   - Complete route path from walk start
   - Live statistics: distance, duration, status
   - Automatic updates via Realtime subscription
   - Each pet's tracking is completely independent

### For Providers

1. **Service Activation**
   - When starting a service, a route record is automatically created
   - Provider becomes unavailable in search results while serving a client
   - Can only manage one active walk at a time (one location at a time)

2. **Active Walk Management** (`/my-bookings/:bookingId/walk`)
   - Start/pause GPS tracking
   - View current route and statistics
   - End walk when service is complete
   - Location updates every few seconds when tracking is active

## Database Structure

### Routes Table
```
- booking_id (unique, references bookings)
- coordinates (JSONB array of {lat, lng, timestamp})
- distance_meters (calculated)
- started_at (timestamp)
- ended_at (timestamp)
```

Each booking gets its own route record, ensuring complete independence between concurrent services.

### Real-time Subscriptions
Each tracking page subscribes to its own channel:
```javascript
supabase.channel(`route-${bookingId}`)
```

This ensures updates for one pet don't interfere with another pet's tracking.

## User Experience Scenarios

### Scenario 1: Two Pets, Two Walks
- Owner has 2 dogs: Max and Luna
- Books morning walk for Max at 8 AM with Provider A
- Books afternoon walk for Luna at 2 PM with Provider B
- At 8 AM: Can track Max's walk in real-time
- At 2 PM: Dashboard shows both active walks
- Can open two browser tabs to watch both simultaneously

### Scenario 2: Sequential Services Same Day
- Owner books 3 services throughout the day
- Dashboard updates automatically as each service becomes active
- Previous completed walks remain in booking history
- Can review past routes even after service completion

## Technical Implementation

### Provider Availability Logic
```javascript
// Providers with active bookings are filtered out from search
const activeBookings = await supabase
  .from('bookings')
  .select('pet_master_id')
  .in('status', ['in_progress', 'accepted']);

// Filter providers
const availableProviders = allProviders.filter(
  provider => !activeProviderIds.has(provider.id)
);
```

### Route Updates
```javascript
// Each location update appends to the route array
const newCoord = {
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  timestamp: new Date().toISOString()
};

await supabase
  .from('routes')
  .update({ coordinates: [...existingRoute, newCoord] })
  .eq('booking_id', bookingId);
```

## Benefits

1. **Flexibility**: Owners can manage multiple pets' needs simultaneously
2. **Independence**: Each service is tracked separately with no interference
3. **Scalability**: System can handle any number of concurrent bookings per user
4. **Real-time Updates**: All tracking happens live without page refreshes
5. **Clear UI**: Easy to distinguish between different pets and their services
6. **Historical Records**: All routes are preserved for review after completion

## Security Considerations

- Each tracking page verifies the owner matches the booking
- Real-time channels are specific to each booking ID
- Providers can only update routes for their assigned bookings
- Location data is only visible to the owner and assigned provider
