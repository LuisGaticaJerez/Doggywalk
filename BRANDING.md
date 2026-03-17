# Petify Brand Guidelines

**Last Updated:** March 17, 2026

## Brand Identity

### Name
**Petify** - A modern, friendly name that combines "Pet" with "ify" (to make or become), suggesting transformation and care for pets.

### Tagline
"Connecting pets with the care they deserve"

### Mission
To create a comprehensive platform that seamlessly connects pet owners with professional pet care providers, ensuring every pet receives the best possible care.

---

## Visual Identity

### Logo
The official Petify logo is a heart-shaped design featuring:
- **Left side:** An orange dog face with a friendly expression
- **Right side:** A teal/turquoise cat face with a calm expression
- **Design:** The two animals form a heart shape together, symbolizing love and care for all pets

**File Location:** `/public/petify_corazon_solo.png`

**Usage:**
- Home page hero section (120x120px)
- Favicon and app icons (various sizes)
- Marketing materials
- Social media profiles

### Color Palette

#### Primary Colors
- **Warm Orange:** `#FF8C42` - Energy, warmth, and friendliness
- **Golden Yellow:** `#FFA500` - Joy and optimism
- **Sunny Yellow:** `#FFD93D` - Brightness and happiness
- **Vibrant Red:** `#FF6B6B` - Love and passion

#### Secondary Colors
- **Teal/Turquoise:** `#4EA9A9` - Calm and trust
- **Light Background:** `#FFF9E6` - Soft and welcoming
- **White:** `#FFFFFF` - Clean and modern

#### Accent Colors
- **Success Green:** For positive actions and confirmations
- **Alert Red:** For warnings and important actions
- **Info Blue:** For informational messages

### Gradients

#### Primary Gradient (Home Page)
```css
background: linear-gradient(135deg, #FF6B6B 0%, #FFA500 50%, #FFD93D 100%);
```

#### Navigation Gradient
```css
background: linear-gradient(135deg, #FF8C42 0%, #FFA500 100%);
```

#### Background Gradient
```css
background: linear-gradient(to bottom, #FFF9E6 0%, #f8fafc 100%);
```

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, sans-serif;
```

### Font Weights
- **Regular:** 400 - Body text
- **Semi-Bold:** 600 - Buttons, labels
- **Bold:** 700 - Headings, emphasis

### Type Scale
- **Hero Heading:** 3rem (48px)
- **Page Heading:** 2rem (32px)
- **Section Heading:** 1.5rem (24px)
- **Subheading:** 1.25rem (20px)
- **Body Text:** 1rem (16px)
- **Small Text:** 0.875rem (14px)

---

## Design Principles

### 1. Warmth and Friendliness
- Use warm colors (oranges, yellows)
- Rounded corners on all UI elements
- Friendly, conversational language
- Welcoming illustrations and icons

### 2. Trust and Safety
- Display verification badges prominently
- Show clear security indicators
- Use professional photography
- Maintain consistent quality standards

### 3. Simplicity
- Clean, uncluttered interfaces
- Clear visual hierarchy
- Intuitive navigation
- Minimal cognitive load

### 4. Inclusivity
- Support for multiple languages (5 languages)
- Accessible color contrasts
- Clear, readable typography
- Support for both dogs and cats (and other pets)

### 5. Responsiveness
- Mobile-first design approach
- Consistent experience across devices
- Touch-friendly interface elements
- Optimized performance

---

## UI Components

### Buttons

#### Primary Button
- Background: White
- Text Color: Primary orange
- Border: 2px solid white
- Border Radius: 50px (fully rounded)
- Padding: 10px 20px
- Font Weight: 700

#### Secondary Button
- Background: `rgba(255,255,255,0.2)`
- Text Color: White
- Border: 2px solid white
- Border Radius: 50px
- Padding: 10px 20px
- Font Weight: 600

### Cards
- Background: White
- Border: None
- Border Radius: 16px
- Shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Padding: 20px

### Service Badges
- Walker: Orange (`#FF8C42`)
- Hotel: Blue (`#4A90E2`)
- Vet: Red (`#E74C3C`)
- Groomer: Purple (`#9B59B6`)

---

## Voice and Tone

### Voice Characteristics
- **Friendly:** Warm and approachable
- **Professional:** Knowledgeable and reliable
- **Caring:** Empathetic and supportive
- **Positive:** Optimistic and encouraging

### Writing Guidelines
- Use conversational language
- Address users directly (you, your)
- Be clear and concise
- Avoid jargon and technical terms
- Use active voice
- Include emojis sparingly for emphasis (🐾, ❤️, ✨)

### Example Copy

**Good:**
"Find the perfect walker for your furry friend"
"Your pet's happiness is our priority"
"Book a service in just a few taps"

**Avoid:**
"Locate service providers in your geographical area"
"Platform for pet care management solutions"
"Complete the transaction workflow"

---

## Application States

### Loading States
- Use animated spinners
- Show skeleton screens for content
- Display friendly loading messages
- Never show blank screens

### Empty States
- Use friendly illustrations
- Provide clear next steps
- Encourage user action
- Show relevant suggestions

### Error States
- Use clear, friendly language
- Explain what went wrong
- Provide actionable solutions
- Don't blame the user

### Success States
- Celebrate user achievements
- Use positive language
- Show clear confirmations
- Guide to next steps

---

## Iconography

### Icon Style
- Simple, line-based icons
- Consistent stroke width
- Rounded corners
- Friendly, approachable feel

### Common Icons
- 🐾 Paw prints - Pet-related actions
- 🏠 Home - Navigation
- 📍 Location pin - Geolocation
- ⭐ Star - Ratings and favorites
- 💬 Chat bubble - Messaging
- 🔔 Bell - Notifications
- ⚙️ Gear - Settings
- 👤 Profile - User account

---

## Photography Guidelines

### Style
- Bright and natural lighting
- Happy, healthy pets
- Real-life scenarios
- Professional quality
- Diverse breeds and types

### Content
- Pets enjoying services
- Providers interacting with pets
- Clean, safe environments
- Action shots (walks, play, grooming)
- Before/after transformations

### Avoid
- Stock photos that look generic
- Unhappy or distressed pets
- Cluttered backgrounds
- Low-quality images
- Overly edited photos

---

## Multi-Language Support

### Supported Languages
- English (en) - Primary
- Spanish (es)
- Chinese (zh)
- Portuguese (pt)
- French (fr)

### Translation Guidelines
- Maintain consistent tone across languages
- Adapt cultural references appropriately
- Keep the friendly, warm tone
- Use native speakers for translation
- Test UI with translated content

---

## Accessibility

### Color Contrast
- Maintain WCAG AA compliance minimum
- Test all color combinations
- Provide sufficient contrast ratios
- Never rely on color alone for information

### Typography
- Minimum font size: 14px
- Use readable font families
- Sufficient line height (1.5 for body)
- Clear hierarchy

### Interactive Elements
- Minimum touch target: 44x44px
- Clear focus states
- Keyboard navigation support
- Screen reader friendly

---

## Animation and Motion

### Principles
- Purposeful, not decorative
- Smooth and natural
- Performance-optimized
- User-controlled

### Common Animations
- **Fade in:** Page transitions
- **Slide up:** Modals and toasts
- **Pulse:** Active status indicators
- **Hover effects:** Interactive elements
- **Float:** Decorative elements on home page

### Timing
- Fast: 200ms - Micro-interactions
- Medium: 300ms - Transitions
- Slow: 500ms - Page loads

---

## Platform-Specific Guidelines

### Web Application
- Responsive design (mobile-first)
- Progressive Web App (PWA) support
- Optimized performance
- Cross-browser compatibility

### Mobile Considerations
- Touch-friendly interfaces
- Simplified navigation
- Optimized images
- Offline functionality

---

## Brand Applications

### Social Media
- Use brand colors in posts
- Include logo on graphics
- Maintain consistent voice
- Share pet success stories
- Engage with community

### Marketing Materials
- Highlight key features
- Show real pets and providers
- Use testimonials
- Include clear calls-to-action
- Maintain brand consistency

### Email Communications
- Use brand colors sparingly
- Keep design clean and simple
- Include logo in header
- Maintain friendly tone
- Clear subject lines

---

## Do's and Don'ts

### Do
✅ Use the official logo
✅ Maintain color consistency
✅ Write in a friendly tone
✅ Show diverse pets
✅ Prioritize user experience
✅ Test across devices
✅ Update documentation

### Don't
❌ Modify the logo
❌ Use off-brand colors
❌ Use formal or technical language
❌ Show only one type of pet
❌ Sacrifice usability for aesthetics
❌ Ignore mobile users
❌ Leave documentation outdated

---

## Version History

- **v2.2.0** (March 17, 2026) - Initial rebrand to Petify
- Brand identity established
- Logo introduced
- Color palette defined
- Design system documented

---

**Petify** - Connecting pets with the care they deserve 🐾
