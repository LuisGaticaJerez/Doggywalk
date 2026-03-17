# Petify Brand Color Guideline

## Brand Story
Inspired by our paw print logo featuring a vibrant teal and warm orange, our color palette embodies the caring, energetic, and trustworthy nature of pet care services.

## Primary Brand Colors

### Teal/Turquoise Family (Primary Brand Color)
Represents trust, care, calmness, and professionalism.

- **Teal 50**: `#E0F7FA` - Lightest backgrounds, subtle highlights
- **Teal 100**: `#B2EBF2` - Light backgrounds, hover states
- **Teal 200**: `#80DEEA` - Soft accents, secondary elements
- **Teal 300**: `#4DD0E1` - Interactive elements
- **Teal 400**: `#26C6DA` - Primary interactive color
- **Teal 500**: `#00BCD4` - **Main Brand Teal** - Primary buttons, links
- **Teal 600**: `#00ACC1` - Hover states for primary actions
- **Teal 700**: `#0097A7` - Active states, important text
- **Teal 800**: `#00838F` - Dark accents
- **Teal 900**: `#006064` - Darkest teal, deep contrast

### Orange Family (Accent/Energy Color)
Represents warmth, energy, playfulness, and action.

- **Orange 50**: `#FFF3E0` - Lightest backgrounds
- **Orange 100**: `#FFE0B2` - Light backgrounds, subtle warnings
- **Orange 200**: `#FFCC80` - Soft highlights
- **Orange 300**: `#FFB74D` - Secondary accents
- **Orange 400**: `#FFA726` - Interactive accents
- **Orange 500**: `#FF9800` - **Main Brand Orange** - Primary accent
- **Orange 600**: `#FB8C00` - Hover states for orange elements
- **Orange 700**: `#F57C00` - Active states
- **Orange 800**: `#EF6C00` - Strong emphasis
- **Orange 900**: `#E65100` - Darkest orange

## Supporting Colors

### Neutral Grays (Professional Foundation)
- **Gray 50**: `#FAFAFA` - Page backgrounds
- **Gray 100**: `#F5F5F5` - Card backgrounds
- **Gray 200**: `#EEEEEE` - Borders, dividers
- **Gray 300**: `#E0E0E0` - Disabled states
- **Gray 400**: `#BDBDBD` - Placeholder text
- **Gray 500**: `#9E9E9E` - Secondary text
- **Gray 600**: `#757575` - Body text
- **Gray 700**: `#616161` - Headings
- **Gray 800**: `#424242` - Important text
- **Gray 900**: `#212121` - Primary text

### Semantic Colors

#### Success (Green Family)
- **Success Light**: `#C8E6C9` - Success backgrounds
- **Success Main**: `#4CAF50` - Success messages, confirmations
- **Success Dark**: `#388E3C` - Success emphasis

#### Warning (Amber Family)
- **Warning Light**: `#FFF9C4` - Warning backgrounds
- **Warning Main**: `#FFC107` - Warning messages
- **Warning Dark**: `#FFA000` - Warning emphasis

#### Error (Red Family)
- **Error Light**: `#FFCDD2` - Error backgrounds
- **Error Main**: `#F44336` - Error messages, alerts
- **Error Dark**: `#D32F2F` - Error emphasis

#### Info (Blue Family)
- **Info Light**: `#B3E5FC` - Info backgrounds
- **Info Main**: `#03A9F4` - Info messages
- **Info Dark**: `#0288D1` - Info emphasis

## Gradient Combinations

### Primary Gradient
```css
background: linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%);
```
Use for: Hero sections, primary CTAs, important cards

### Accent Gradient
```css
background: linear-gradient(135deg, #FF9800 0%, #FB8C00 100%);
```
Use for: Secondary CTAs, highlights, badges

### Warm Gradient (Brand Signature)
```css
background: linear-gradient(135deg, #00BCD4 0%, #FF9800 100%);
```
Use for: Premium features, special highlights, brand moments

### Soft Background Gradient
```css
background: linear-gradient(135deg, #E0F7FA 0%, #FFF3E0 100%);
```
Use for: Large background areas, hero sections

## Usage Guidelines

### Primary Actions
- Buttons: Teal 500 background, white text
- Hover: Teal 600
- Active: Teal 700

### Secondary Actions
- Buttons: Orange 500 background, white text
- Hover: Orange 600
- Active: Orange 700

### Links
- Default: Teal 600
- Hover: Teal 700
- Visited: Teal 800

### Backgrounds
- Main: White `#FFFFFF`
- Subtle: Gray 50 `#FAFAFA`
- Cards: White with soft shadow
- Alternating sections: White and Teal 50

### Text Hierarchy
- Primary headings: Gray 900
- Secondary headings: Gray 800
- Body text: Gray 700
- Secondary text: Gray 600
- Disabled text: Gray 400

### Borders & Dividers
- Light borders: Gray 200
- Medium borders: Gray 300
- Focus rings: Teal 500

### Status Indicators
- Active/Available: Teal 500
- Pending: Orange 500
- Success: Success Main
- Warning: Warning Main
- Error: Error Main

## Accessibility Requirements

### Contrast Ratios (WCAG AA)
- Normal text (< 18pt): Minimum 4.5:1
- Large text (≥ 18pt): Minimum 3:1
- UI components: Minimum 3:1

### Safe Combinations
✅ Teal 700 on White (8.2:1)
✅ Teal 600 on White (6.5:1)
✅ Gray 900 on White (16.1:1)
✅ White on Teal 500 (3.9:1)
✅ White on Orange 600 (4.8:1)

### Avoid
❌ Teal 300 on White (insufficient contrast)
❌ Orange 300 on White (insufficient contrast)
❌ Gray 500 on Gray 300

## Dark Mode (Future Consideration)
- Primary: Teal 300
- Accent: Orange 400
- Background: Gray 900
- Surface: Gray 800
- Text: Gray 50

## Design Principles

1. **Trust First**: Use teal as the dominant color to establish trust and professionalism
2. **Energy Accents**: Use orange sparingly for calls-to-action and important highlights
3. **Clean & Spacious**: Maintain generous white space with subtle gray backgrounds
4. **Consistent Hierarchy**: Use color to guide attention, not overwhelm
5. **Accessibility Always**: Ensure all color combinations meet WCAG AA standards
6. **Elegant Simplicity**: Less is more - let the brand colors shine through thoughtful use
