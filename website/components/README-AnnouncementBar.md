# AnnouncementBar Component

## Overview
The `AnnouncementBar` component displays a prominent banner at the top of the website (above the navigation bar) for time-sensitive promotions, major feature launches, or important announcements.

## Features
- **Visually Distinct**: Eye-catching gradient background (purple → blue → cyan)
- **Dismissible**: Users can close the announcement, and their preference is saved in localStorage
- **Configurable**: Easy to customize message, badge, link, and storage key
- **Responsive**: Works seamlessly on mobile and desktop
- **Smooth Animation**: Fade and slide out animation when dismissed

## Usage

The announcement bar is configured in `/app/layout.tsx`:

```tsx
<AnnouncementBar
    badge="50% OFF"
    message="Limited time offer: Get 50% off Pro subscription!"
    linkText="Claim Offer"
    linkHref="/activate"
    storageKey="promo-50-off"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | string | Yes | - | The main announcement text |
| `linkText` | string | No | - | Text for the call-to-action button |
| `linkHref` | string | No | - | URL for the call-to-action button |
| `badge` | string | No | - | Badge text (e.g., "NEW", "50% OFF", "LAUNCH") |
| `storageKey` | string | No | "announcement-dismissed" | localStorage key to persist dismiss state |

## Updating the Announcement

To update the announcement for a new promotion or feature launch:

1. Open `/app/layout.tsx`
2. Modify the `AnnouncementBar` props:

```tsx
<AnnouncementBar
    badge="NEW FEATURE"                              // Update badge
    message="Privacy Guard is now available!"        // Update message
    linkText="Learn More"                            // Update link text
    linkHref="/help#privacy-guard"                   // Update link URL
    storageKey="privacy-guard-launch"                // Change key to show to users who dismissed previous announcement
/>
```

3. **Important**: Change the `storageKey` when starting a new campaign so users who dismissed the previous announcement will see the new one.

## Temporarily Disabling the Announcement

To hide the announcement bar:

1. Open `/app/layout.tsx`
2. Comment out or remove the `<AnnouncementBar />` component

```tsx
{/* <AnnouncementBar ... /> */}
```

## Examples

### Promotion Campaign
```tsx
<AnnouncementBar
    badge="50% OFF"
    message="Limited time: Get 50% off your first month!"
    linkText="Claim Offer"
    linkHref="/activate"
    storageKey="promo-jan-2026"
/>
```

### Feature Launch
```tsx
<AnnouncementBar
    badge="NEW"
    message="Introducing Auto-Solve Mode - Automatically solve questions!"
    linkText="Try It Now"
    linkHref="/help#auto-solve"
    storageKey="feature-autosolve-launch"
/>
```

### Simple Announcement (no badge or link)
```tsx
<AnnouncementBar
    message="CaptureAI is now available on the Chrome Web Store!"
    storageKey="chrome-store-launch"
/>
```

## Styling

The component uses Tailwind CSS with a gradient background:
- **Gradient**: `from-purple-600 via-blue-600 to-cyan-500`
- **Badge**: White semi-transparent background with sparkles icon
- **CTA Button**: White background with blue text, hover effects
- **Close Button**: White X icon in top-right corner

To customize the gradient, edit the className in `/components/AnnouncementBar.tsx`:

```tsx
className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 ..."
```

## Best Practices

1. **Keep messages concise**: Aim for 50-70 characters for optimal readability
2. **Use clear CTAs**: Make the action button text action-oriented ("Claim Offer", "Learn More", "Get Started")
3. **Update storage keys**: Always change the `storageKey` when starting a new campaign
4. **Test on mobile**: Verify the announcement looks good on small screens
5. **Limit usage**: Use sparingly for truly important announcements to avoid banner blindness

## Technical Details

- **Persistence**: Uses browser localStorage to remember dismiss state
- **Animation**: CSS transitions for smooth fade-out (300ms)
- **Accessibility**: Includes ARIA label for dismiss button
- **Client-side only**: Uses 'use client' directive for React hooks (useState, useEffect)
