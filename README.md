# HubLink Logistics

A web-based logistics and shipment management application designed to organize orders, parcel consolidation, delivery scheduling, and shipment tracking in one interface.

## About the Project

HubLink Logistics aims to simplify the delivery process by providing role-based interfaces for buyers, sellers, and administrators. It supports order management, address management, shipment monitoring, and delivery-related workflows.

The application is built with HTML, CSS, and JavaScript and is designed to be accessible through desktop and mobile web browsers.

## Features

### Order Management
- Create and view orders.
- Manage order information and checkout workflows.
- Validate delivery addresses.
- Review order details and related delivery information.

### Address Management
- Add and edit delivery addresses.
- Validate address information.
- Protect addresses associated with active orders from inappropriate deletion.

### Parcel Consolidation
- Support consolidation for eligible orders belonging to the same verified buyer and delivery address.
- Apply the existing consolidation eligibility rules.
- Avoid additional consolidation fees.

### Delivery Scheduling
- Support Standard Dispatch and Schedule & Hold options.
- Apply the existing scheduling fees and hold-period rules.
- Handle delivery rescheduling within the permitted hold window.
- Apply the configured default when a buyer does not select a delivery option before the deadline.

### Shipment Tracking
- View shipment details and recorded status updates.
- Display shipment milestones in a timeline.
- Show an empty state when no parcels are available to track.

### Interactive Map
- Display shipment-related geographic information using Leaflet and OpenStreetMap, where configured.
- Support map navigation and available markers.
- Require an internet connection to load online map tiles.

### Role-Based Interfaces
- Provide buyer, seller, and administrator views according to the existing application implementation.
- Restrict role-specific actions in the frontend.

### Responsive Interface
- Designed to support desktop, tablet, and mobile screen sizes.
- Includes responsive layouts for the application's main workflows.

## Technology Stack

- **HTML5** - Application structure
- **CSS3** - Styling and responsive layouts
- **JavaScript** - Application logic and interactions
- **Leaflet** - Interactive maps
- **OpenStreetMap** - Map tile provider
- **Browser localStorage** - Local application data persistence
- **Git and GitHub** - Source control and project hosting
- **GitHub Pages** - Static website deployment

## Getting Started

### Requirements

- A modern web browser
- Git, if you want to clone or update the repository
- A code editor such as Visual Studio Code

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/oizysmiseriaaa/hublink-logistics.git
   ```

2. Open the project folder:

   ```bash
   cd hublink-logistics
   ```

3. Locate `index.html` and open it in your browser, or use the **Live Server** extension in Visual Studio Code if your project requires a local web server.

If the HTML file is inside a nested project directory, open the folder containing the actual `index.html` file.

## Deployment with GitHub Pages

1. Push the project files to the GitHub repository.
2. Open the repository's **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and the folder containing the website's `index.html` file.
6. Click **Save**.
7. Wait for GitHub Pages to finish deployment.
8. Open the published website using the URL shown in the Pages settings.

Repository: https://github.com/oizysmiseriaaa/hublink-logistics

Make sure the HTML, CSS, JavaScript, manifest, service-worker, and asset paths work under the repository's published URL.

## Important Business Rules

The application implements the following configured workflow rules:

- Only verified buyers can proceed to checkout.
- Consolidation is restricted to the same verified buyer and delivery address.
- Schedule & Hold has a fee of 3% of the total order value.
- The maximum hold period is three consecutive calendar days from local hub arrival.
- Buyers have 12 hours to select a delivery option; otherwise, Standard Dispatch is the default.
- Standard Dispatch has no additional holding fee.
- Missed scheduled deliveries may only be rescheduled within the remaining hold window.
- Return-to-Seller follows the application's configured expiry, refusal, and unclaimed-parcel conditions.

These rules should be preserved when modifying the application.

## Current Limitations

- **Local data storage:** Application data is stored in the browser's local storage. Data does not automatically synchronize across devices or users.
- **Authentication:** Login and role handling are frontend simulations. They do not replace secure backend authentication and authorization.
- **Backend services:** A shared backend and database are not configured as part of the current static implementation.
- **Live tracking:** The map does not automatically provide live vehicle GPS tracking unless a real tracking integration is implemented.
- **Payments:** Do not assume that real payment processing is available.
- **Internet access:** Online map tiles and other external resources require an internet connection.

Avoid entering sensitive personal information or real customer data into the current frontend-only application.

## Testing

Initial static and isolated logic checks have been performed on the project. These included JavaScript syntax, selected business rules, address management, order-related operations, and malformed-storage handling.

Full end-to-end browser testing, all CRUD workflows, responsive viewport verification, and map and service-worker behavior have not yet been completely verified.

## Future Improvements

- Integrate secure backend authentication and role permissions.
- Add a shared database for synchronized orders and shipment records.
- Implement real-time shipment updates and GPS integration where available.
- Integrate secure payment processing if required.
- Expand automated browser and end-to-end testing.
- Improve monitoring, error handling, and deployment validation.

## License

No license has been specified yet. Unless a license is added to the repository, the project should not be assumed to be open source for unrestricted reuse.

---

**HubLink Logistics**  
Order management, parcel consolidation, delivery scheduling, and shipment tracking.
