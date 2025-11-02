/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Diese werden später dynamisch aus designTemplates.ts gesetzt
        // Hier definieren wir nur Fallback-Werte
      }
    }
  },
  plugins: [],
  safelist: [
    // Button-Klassen
    'btn',
    'btn-primary',
    'btn-secondary',
    'btn-outline',
    'btn-outline-primary',
    'btn-outline-secondary',
    'btn-outline-info',
    'btn-outline-input',
    'btn-link',
    'btn-action',
    'btn-danger',
    'btn-square',
    'btn-ghost',
    
    // Card-Klassen
    'card',
    'card-body',
    'card-header',
    'card-footer',
    'card-title',
    'card-text',
    'card-button',
    'card-list',
    
    // Container & Layout
    'container-fluid',
    'page',
    
    // Table-Klassen
    'table',
    'table-responsive',
    'modern-table',
    
    // Sidebar-Klassen
    'sidebar-button',
    'sidebar-sub-button',
    'sidebar-icon',
    
    // Form-Klassen
    'form-control',
    'form-select',
    'form-label',
    'form-check',
    'form-check-input',
    'form-check-label',
    'input-group',
    'input-group-text',
    
    // Modal-Klassen
    'modal',
    'modal-dialog',
    'modal-content',
    'modal-backdrop',
    
    // Alert-Klassen
    'alert-info',
    'alert-info-supabase',
    'alert-info-firebase',
    'alert-info-couchdb',
    'alert-info-theme',
    'alert-info-secondary',
    'alert-warning-service-role',
    
    // Nav-Klassen
    'nav',
    'nav-item',
    'navbar',
    'navbar-brand',
    'navbar-dark',
    
    // Drawer-Klassen
    'drawer',
    'drawer-toggle',
    'drawer-side',
    'drawer-content',
    'drawer-overlay',
    
    // Utility-Klassen (falls sie nicht von Tailwind abgedeckt werden)
    'flex',
    'flex-column',
    'flex-col',
    'flex-wrap',
    'items-center',
    'justify-between',
    'justify-center',
    'w-full',
    'h-full',
    'text-center',
    'overflow-auto',
    'overflow-hidden',
    
    // Spacing-Klassen (falls sie nicht von Tailwind abgedeckt werden)
    'p-2',
    'p-4',
    'mb-1',
    'mb-2',
    'mb-3',
    'mb-4',
    'mt-3',
    
    // Weitere wichtige Klassen
    'spinner-border',
    'spinner-border-sm',
    'text-muted',
    'text-truncate',
    'text-primary',
    'text-secondary-dynamic',
    'text-dynamic',
    'list-group-item',
    'badge',
    'accordion-content',
    'section-header',
    'version-badge',
    'visually-hidden',
    
    // State-Klassen mit Varianten (explizit aufgelistet)
    'sidebar-button.open',
    'sidebar-button.closed',
    'sidebar-button.active',
    'sidebar-sub-button.active',
    'sidebar-icon.open',
    'sidebar-icon.closed',
    'accordion-content.open',
    'accordion-content.closed',
    'btn-outline-secondary.no-hover',
    
    // Spezifische Modifikatoren
    'cursor-pointer',
    'd-flex',
    'align-items-center',
    'justify-content-center',
    'me-2',
    'mx-auto',
    'mt-4',
    'small',
  ]
}

