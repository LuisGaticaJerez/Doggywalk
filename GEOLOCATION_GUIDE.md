# Geolocation Guide

This guide explains how to add geographic coordinates to pet service providers so they appear on the map.

## How It Works

The application now includes:
- **Interactive Map View**: See all nearby providers on a map (similar to Uber)
- **User Location Detection**: Automatically detects your current location
- **Distance Filtering**: Filter providers by distance (1-50km radius)
- **Distance Display**: Shows how far each provider is from you
- **Marker Clustering**: Providers are shown with color-coded pins based on service type:
  - 🚶 Green: Dog Walkers
  - 🏨 Blue: Pet Hotels
  - 🩺 Pink: Veterinarians

## Adding Location Data to Providers

### Option 1: Using SQL (Direct Database Update)

For existing providers, you can update their location information using SQL:

```sql
-- Update a specific provider with their location
UPDATE pet_masters
SET
  latitude = 4.6534,
  longitude = -74.0836,
  address = 'Cra. 7 #45-23, Bogotá',
  city = 'Bogotá',
  country = 'Colombia'
WHERE id = 'provider-uuid-here';
```

### Option 2: Sample Data for Testing

Add test providers with different locations in Bogotá:

```sql
-- Note: You'll need to create profiles first, then pet_masters
-- Example coordinates for Bogotá, Colombia:

-- Location 1: Chapinero
UPDATE pet_masters SET
  latitude = 4.6534,
  longitude = -74.0636,
  address = 'Calle 63 #7-30, Chapinero',
  city = 'Bogotá'
WHERE id = 'your-provider-id-1';

-- Location 2: Usaquén
UPDATE pet_masters SET
  latitude = 4.7110,
  longitude = -74.0321,
  address = 'Calle 116 #7-15, Usaquén',
  city = 'Bogotá'
WHERE id = 'your-provider-id-2';

-- Location 3: Zona Rosa
UPDATE pet_masters SET
  latitude = 4.6667,
  longitude = -74.0547,
  address = 'Calle 82 #12-20, Zona Rosa',
  city = 'Bogotá'
WHERE id = 'your-provider-id-3';
```

## Getting Coordinates

### Using Google Maps:
1. Open Google Maps (maps.google.com)
2. Right-click on any location
3. Click on the coordinates that appear
4. Coordinates are now copied to clipboard

### Using OpenStreetMap:
1. Visit openstreetmap.org
2. Navigate to your desired location
3. Right-click and select "Show address"
4. Coordinates appear in the URL

## Features Enabled

Once providers have location data:

1. **Map View Toggle**: Switch between list and map views
2. **Current Location**: Blue pulsing marker shows your position
3. **Provider Markers**: Color-coded pins for each service type
4. **Info Popups**: Click markers to see provider details
5. **Scroll to Provider**: Clicking a map marker scrolls to that provider in the list
6. **Distance Sorting**: Providers are automatically sorted by distance from you
7. **Radius Filter**: Adjust the search radius from 1-50km
8. **Distance Display**: Each provider card shows exact distance

## User Experience Flow

1. User opens Search Services page
2. Browser requests location permission
3. Map centers on user's location
4. Nearby providers appear as colored markers
5. User can:
   - Toggle between list and map views
   - Adjust search radius with slider
   - Filter by service type
   - Click markers to view provider details
   - See distance and directions to each provider

## Important Notes

- Providers without location data won't appear on the map
- Users must grant location permission for full functionality
- Default location (Bogotá center) is used if permission denied
- Distance calculations use the Haversine formula for accuracy
- Map uses OpenStreetMap (free, no API key required)

## Troubleshooting

**Map not showing providers?**
- Ensure providers have both latitude and longitude values
- Check that coordinates are valid (lat: -90 to 90, lng: -180 to 180)

**Location permission denied?**
- App falls back to Bogotá, Colombia as default location
- User can manually refresh and grant permission

**Providers too far away?**
- Increase the distance radius slider
- Ensure test coordinates are in the same city
