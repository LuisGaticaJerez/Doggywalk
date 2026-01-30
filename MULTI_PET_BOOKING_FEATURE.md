# Multi-Pet Booking Feature

## Overview
DoggyWalk now supports group bookings where owners can request a service for multiple pets simultaneously with a single walker. This feature allows flexible booking options where owners can choose to:
- Book one walker for all their pets (group walk)
- Book separate walkers for each pet (individual walks)

## Key Features

### 1. Flexible Pet Selection
Owners can select multiple pets when creating a booking:
- **Checkbox-based selection** for intuitive multi-pet choice
- **Visual feedback** showing how many pets are selected
- **Smart pricing** that adjusts based on pet count
- **Pet details display** showing breed, size, and age for each pet

### 2. Group Walk Pricing
The system automatically adjusts pricing for group walks:
- **Base price:** Standard rate for the first pet
- **Additional pets:** +50% of base price per extra pet
- **Example:**
  - 1 pet for 60 min @ $20/hr = $20
  - 2 pets for 60 min @ $20/hr = $30 (base + 50%)
  - 3 pets for 60 min @ $20/hr = $40 (base + 100%)

### 3. Visual Indicators
Group bookings are clearly distinguished throughout the app:
- **Pet count badges** showing "Group: X pets"
- **Multiple dog emojis** (🐕🐕) for group walks
- **Pet names displayed together** (e.g., "Max, Luna, Charlie")
- **Green badges** highlighting active group walks

### 4. Live Tracking for Groups
Group walks can be tracked in real-time:
- **Single map view** for the entire group
- **Provider's location** tracked once for all pets
- **Route history** preserved for the group walk
- **Group indicators** in tracking interface

## Database Structure

### New Table: booking_pets
Junction table connecting bookings with multiple pets:
```sql
CREATE TABLE booking_pets (
  id uuid PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id),
  pet_id uuid REFERENCES pets(id),
  created_at timestamptz,
  UNIQUE(booking_id, pet_id)
);
```

### Updated: bookings table
Added pet_count column:
```sql
ALTER TABLE bookings ADD COLUMN pet_count integer DEFAULT 1;
```

### Data Migration
Existing single-pet bookings were automatically migrated to the new structure:
- Each existing booking created a corresponding `booking_pets` record
- `pet_count` defaults to 1 for backward compatibility
- All existing functionality preserved

## User Experience

### For Owners

#### Creating a Group Booking

1. **Navigate to Booking Form**
   - Search for a provider and click "Book Now"

2. **Select Multiple Pets**
   - See all your pets in a scrollable list
   - Check the boxes for pets you want in the group
   - View real-time count: "2 selected", "3 selected", etc.

3. **See Adjusted Pricing**
   - Base price shown for first pet
   - Additional cost displayed: "Multi-pet discount: Base + 50% × 2"
   - Total calculated automatically

4. **Submit Booking**
   - All selected pets linked to single booking
   - Provider receives one request for multiple pets
   - Can accept or decline the group walk

#### Dashboard View

**Active Group Walks Section:**
- Shows count of active services
- Each group walk displays all pet names
- Quick badge showing pet count (e.g., "3 pets")
- Click any active group walk to track live

**Recent Bookings:**
- Group walks show all pet names
- Pet count badge visible
- Provider name displayed
- Status and pricing shown

#### Bookings Page

**Enhanced Display:**
- Group walks have green border and highlight
- All pet names listed together
- Provider information below pets
- "Track Walk" button for active groups

#### Live Tracking

**Group Walk Tracking:**
- Header shows all pet names
- Pet count in title (e.g., "Max, Luna, Charlie (3 pets)")
- Single location tracking for the group
- Shared route history

### For Providers

#### Receiving Group Requests

**Booking Request Shows:**
- All pet names in the booking
- Pet count clearly indicated
- Adjusted pricing for group walk
- Special instructions (if any)

**Provider Can:**
- Accept the entire group booking
- Decline if not comfortable with multiple pets
- See details of all pets involved
- Track the group during the walk

#### Active Group Walk

**During Service:**
- One GPS tracking session for the group
- All pets' names visible in active walk interface
- Single route created for all pets
- Standard walk controls (start/pause/end)

## Technical Implementation

### BookingForm Component

**Multi-Pet Selection:**
```typescript
const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

const handlePetToggle = (petId: string) => {
  setSelectedPetIds(prev =>
    prev.includes(petId)
      ? prev.filter(id => id !== petId)
      : [...prev, petId]
  );
};
```

**Pricing Calculation:**
```typescript
const calculateTotal = () => {
  const basePrice = (duration / 60) * hourlyRate;
  const petCount = selectedPetIds.length;
  if (petCount <= 1) return basePrice;
  return basePrice + (basePrice * 0.5 * (petCount - 1));
};
```

**Booking Creation:**
```typescript
// Create booking
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    owner_id: profile.id,
    pet_master_id: providerId,
    pet_id: selectedPetIds[0], // Primary pet
    pet_count: selectedPetIds.length,
    total_amount: calculateTotal(),
    // ... other fields
  })
  .select()
  .single();

// Link all pets to booking
const bookingPets = selectedPetIds.map(petId => ({
  booking_id: booking.id,
  pet_id: petId
}));

await supabase.from('booking_pets').insert(bookingPets);
```

### Querying Group Bookings

**Load Bookings with All Pets:**
```typescript
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    pets (name),
    pet_masters (profiles (full_name)),
    booking_pets (
      pets (id, name)
    )
  `)
  .eq('owner_id', userId);
```

**Display Pet Names:**
```typescript
{booking.booking_pets && booking.booking_pets.length > 0
  ? booking.booking_pets.map(bp => bp.pets.name).join(', ')
  : booking.pets?.name
}
```

## Security & RLS Policies

### booking_pets Table Policies

**Owners can view their booking pets:**
```sql
CREATE POLICY "Owners can view their booking pets"
  ON booking_pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );
```

**Owners can insert booking pets:**
```sql
CREATE POLICY "Owners can insert booking pets"
  ON booking_pets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );
```

**Pet masters can view assigned booking pets:**
```sql
CREATE POLICY "Pet masters can view assigned booking pets"
  ON booking_pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.pet_master_id = auth.uid()
    )
  );
```

## Use Cases & Scenarios

### Scenario 1: Owner with 3 Dogs - Group Walk
**Situation:** Sarah has Max, Luna, and Charlie. She wants them all walked together.

**Process:**
1. Sarah searches for walkers near her location
2. Finds John who has good ratings
3. Clicks "Book Now"
4. Selects all 3 dogs (Max, Luna, Charlie)
5. Sees price: $20 base + $10 + $10 = $40 for 60 minutes
6. Books the group walk
7. John receives one request for 3 pets
8. John accepts
9. During walk, Sarah tracks all 3 on one map
10. Single route saved for the group walk

### Scenario 2: Owner with 2 Dogs - Separate Walks
**Situation:** Emma has Rex (large, energetic) and Bella (small, calm). She wants separate walks.

**Process:**
1. Emma searches for walkers
2. Books John for Rex at 8 AM
   - Selects only Rex
   - Pays $20 for 60 minutes
3. Books Maria for Bella at 2 PM
   - Selects only Bella
   - Pays $20 for 60 minutes
4. Two separate bookings created
5. Can track each walk independently
6. Different providers, different times

### Scenario 3: Owner with 2 Dogs - Mixed Approach
**Situation:** Tom usually walks his 2 dogs together but one is sick today.

**Morning:**
- Books group walk for both dogs
- Provider accepts group booking

**Next Week:**
- One dog is sick
- Books individual walk for healthy dog only
- Selects single pet in booking form

## Benefits

### For Pet Owners
1. **Cost Effective:** Group walks are cheaper than separate walks
2. **Convenience:** All pets walked together at once
3. **Flexibility:** Choose group or individual based on needs
4. **Transparency:** Clear pricing and pet information
5. **Easy Tracking:** Monitor entire group on one map

### For Pet Walkers
1. **Higher Revenue:** More pets per booking means more income
2. **Efficiency:** Walk multiple pets in same time slot
3. **Clear Communication:** Know exactly which pets in advance
4. **Fair Compensation:** 50% extra per additional pet
5. **Simple Tracking:** One GPS session for entire group

### For the Platform
1. **Increased Bookings:** More options = more transactions
2. **User Satisfaction:** Flexibility meets diverse needs
3. **Scalability:** System supports any number of pets per booking
4. **Data Insights:** Track group vs individual preferences
5. **Competitive Advantage:** Unique feature in pet service market

## Future Enhancements

### Potential Improvements
1. **Custom Group Pricing:** Let providers set their own multi-pet rates
2. **Pet Compatibility Checks:** Warn if selected pets don't get along
3. **Group Size Limits:** Allow providers to set maximum group size
4. **Split Tracking:** Show individual pet paths if provider tags each pet
5. **Group Photos:** Upload photos of all pets together during walk
6. **Package Deals:** Discounts for regular group walk bookings
7. **Mixed Species Groups:** Support cats, rabbits, etc. in groups

## Migration Notes

### Backward Compatibility
- All existing bookings work without modification
- Single-pet bookings automatically have `pet_count = 1`
- Legacy `pet_id` field maintained for compatibility
- UI gracefully handles both old and new booking formats

### Performance Considerations
- Indexed `booking_id` and `pet_id` for fast lookups
- Efficient join queries for loading booking details
- Minimal database overhead for single-pet bookings
- Real-time tracking unaffected by pet count

## Testing Checklist

- [x] Create booking with single pet
- [x] Create booking with multiple pets (2, 3, 4+)
- [x] View group bookings in dashboard
- [x] View group bookings in bookings list
- [x] Track group walk in real-time
- [x] Provider receives correct pet information
- [x] Pricing calculates correctly for groups
- [x] Pet names display correctly everywhere
- [x] RLS policies prevent unauthorized access
- [x] Migration preserves existing bookings
- [x] Build completes successfully
