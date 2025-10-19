# Component-spezifische Styles Dokumentation

## Sidebar
- **Width**: 224px (open), 60px (closed)
- **Transition**: width 0.3s ease
- **Background**: colors.card
- **Border**: 1px solid colors.cardBorder
- **Button hover**: colors.accent + '20' (rgba)
- **Accordion transition**: max-height 0.5s ease-in-out
- **Button padding**: 0.75rem 1rem
- **Button border-radius**: 0.375rem

## StatCard (Dashboard)
- **Background**: colors.card
- **Border**: 1px solid colors.cardBorder
- **Border-radius**: 12px
- **Box-shadow**: colors.paperShadow
- **Padding**: 1.5rem
- **Icon size**: 2rem
- **Number size**: 2rem, font-weight: bold
- **Text alignment**: center

## DataTable
- **Border-collapse**: collapse
- **Header padding**: 0.75rem
- **Header border-bottom**: 2px solid colors.cardBorder
- **Header background**: #f9fafb
- **Cell padding**: 0.75rem
- **Row hover**: rgba(0, 0, 0, 0.05)
- **Width**: 100%

## Modal
- **Backdrop**: rgba(0, 0, 0, 0.5)
- **Modal width**: max 800px
- **Border-radius**: 12px
- **Box-shadow**: 0 10px 40px rgba(0,0,0,0.2)
- **Padding**: 2rem
- **Z-index**: 1050 (modal), 1040 (backdrop)

## Buttons
- **Primary**: colors.primary bg, white text
- **Secondary**: colors.secondary bg, white text
- **Danger**: #ef4444 bg, white text
- **Border-radius**: 0.375rem
- **Padding**: 0.5rem 1rem
- **Font-weight**: 500
- **Transition**: all 0.2s
- **Display**: inline-flex
- **Align-items**: center
- **Justify-content**: center
- **Gap**: 0.5rem

## Inputs
- **Border**: 1px solid #d1d5db
- **Border-radius**: 0.375rem
- **Padding**: 0.5rem 0.75rem
- **Focus**: border-color changes to accent
- **Focus shadow**: 0 0 0 3px rgba(59, 130, 246, 0.1)
- **Background**: #ffffff
- **Width**: 100%
- **Font-size**: 0.875rem

## Cards
- **Background**: colors.card
- **Border**: 1px solid colors.cardBorder
- **Border-radius**: 12px
- **Box-shadow**: colors.paperShadow
- **Padding**: 1.5rem

## Navigation
- **Container**: flex, flex-direction: column
- **List-style**: none
- **Items**: display: block

## Loading Spinner
- **Border**: 4px solid #f3f3f3
- **Border-top**: 4px solid colors.primary
- **Border-radius**: 50%
- **Width**: 40px
- **Height**: 40px
- **Animation**: spin 1s linear infinite

## Status Badge
- **Padding**: 0.25rem 0.5rem
- **Border-radius**: 0.25rem
- **Font-size**: 0.75rem
- **Font-weight**: 500
- **Text-transform**: uppercase

## Form Layout
- **Label margin-bottom**: 0.5rem
- **Form-group margin-bottom**: 1rem
- **Required asterisk**: colors.accent
- **Error text**: #ef4444
- **Success text**: #10b981

## Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Mobile-specific
- **Sidebar**: Overlay auf Mobile
- **Modal**: Full-width auf Mobile
- **Table**: Horizontal scroll auf Mobile
- **Button**: Full-width auf Mobile (in Modals)
