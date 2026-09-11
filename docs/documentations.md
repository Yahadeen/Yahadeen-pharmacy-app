## PLAN

Yahadeen 
Product Requirements Summary — Pharmacy Ordering & Delivery App1. The Opportunity 
Customers today have no easy way to check whether a pharmacy actually has the medicine they need, what it costs, or how to get 
it delivered without calling around or making a wasted trip. This app puts a pharmacy's real-time stock, pricing, ordering, 
payment, and delivery into a single mobile experience — reducing friction for the customer and creating a new, always-on sales 
channel for the business. 
2. Product Vision 
A simple, trustworthy mobile app where a customer can search for a drug, instantly see if it's in stock and its price, pay for it 
directly in the app, and have it delivered to their door — with the pharmacy able to update stock at any time and customers 
notified the moment new or restocked products become available. 
3. The Three Apps 
The product is made up of three connected applications, each built for a different user: 
Feature What it does Why it matters 
Customer App The public-facing mobile app where customers browse 
drugs, check stock and price, order, pay, chat with 
support, track delivery, and get real-time notifications. 
This is the storefront — where revenue comes 
from. 
Admin Dashboard A web-based control panel for the pharmacy's 
management team to manage the drug catalog, stock, 
prices, orders, attendants, delivery partners, and view 
sales reports. 
Gives the business full oversight and control 
of the whole operation. 
Attendant App A lightweight mobile app for pharmacy staff to receive 
incoming orders, confirm/pack items, update stock on 
the go, and chat with customers or logistics riders. 
Speeds up order fulfillment and keeps stock 
accurate in real time. 
4. Core Features 
Feature What it does Why it matters 
Live Drug Catalog Browsable, searchable list of drugs showing 
availability (in stock / not available) and current price. 
Saves customers time, avoids wasted trips, 
builds trust in the app. 
In-App Ordering & 
Payment 
Customer selects items, adds to cart, and pays securely 
within the app (cards, bank transfer, mobile money). 
Removes the need to call, negotiate, or pay on 
delivery — faster, safer transactions. 
Admin Stock & Catalog 
Management 
Pharmacy management updates stock levels, prices, 
and product details from the admin dashboard. 
Keeps the catalog accurate and gives the 
business full control of what's shown. 
Real-Time Restock 
Notifications 
The moment stock is updated, affected customers get a 
push notification and can tap through to the 
new/restocked product. 
Turns restocks into an instant re-engagement 
and sales trigger — a strong differentiator. 
In-App Chat / Support Direct messaging between customer and pharmacy 
attendant (and rider, once assigned) for questions, 
prescription clarification, or delivery updates. 
Builds trust, resolves issues quickly, reduces 
phone-call dependency. 
Order Tracking & Status 
Updates 
Customer sees real-time order status: confirmed, 
packed, picked up, out for delivery, delivered. 
Keeps customers informed and reduces "where 
is my order" support load. 
Attendant Order Queue Attendants see incoming orders on their app, confirm 
stock, and mark orders ready for pickup. 
Faster, more accurate order fulfillment at the 
pharmacy counter. 
Automated Delivery 
Dispatch 
On successful payment, the order is automatically 
handed off to an integrated third-party logistics (3PL) 
partner for pickup and delivery. 
No manual dispatch calls — faster fulfillment, 
lower operating overhead. 
Distance-Based Delivery 
Fee 
Delivery cost is calculated automatically from the 
customer's delivery address before checkout. 
Transparent, fair pricing; no under- or 
over-charging on delivery. 
Reports & Insights Admin dashboard shows sales, best-selling drugs, 
low-stock alerts, and delivery performance. 
Helps management make faster, 
better-informed decisions. 
Feature What it does Why it matters 
User Accounts & Order 
History 
Customers create a profile, save addresses, and view 
past orders for quick reordering. 
5. How It Works (Customer Journey) 
Encourages repeat purchases and speeds up 
future checkouts. 
• Discover: Customer opens the app and searches or browses drugs by name or category. 
• Check: Sees live availability and price for each item. 
• Order & Pay: Adds items to cart, enters/confirms delivery address, sees the calculated delivery fee, and pays in-app. 
• Fulfill: Attendant confirms and packs the order; it's automatically sent to the logistics partner for pickup and delivery. 
• Stay Informed: Customer tracks order status in real time, can chat with the pharmacy, and gets notified instantly whenever 
new stock arrives. 
6. Why This Wins 
• Convenience: One app to check availability, price, pay, chat, and get delivery — no phone calls needed. 
• Speed: Real-time stock, an attendant queue, and automated dispatch mean faster fulfillment end to end. 
• Retention: Restock notifications and order history keep customers coming back. 
• Efficiency: A dedicated admin dashboard and attendant app cut manual work and pricing errors for the business. 
• Trust: Transparent pricing, live order tracking, and direct chat support build customer confidence. 







## TECHNICAL DOCUMENTATION

Yahadeen — Technical Documentation & Implementation Plan 
1. Project Overview 
Yahadeen will be a connected pharmacy ordering and delivery platform designed to make it easier 
for customers to search for medications, confirm availability and pricing, place orders, make 
payments, and receive deliveries. 
The complete system will consist of three connected applications: 
1. Customer Mobile Application 
2. Pharmacy Attendant Mobile Application 
3. Web-Based Admin Dashboard 
The system will operate from a centralized database and backend architecture, ensuring that 
inventory, orders, payments, delivery updates, notifications, and user activities remain 
synchronized across all platforms. 
The goal is to provide the pharmacy with a practical digital sales and operations system rather than 
just a simple online catalog. 
2. Proposed Technology Stack 
Mobile Applications 
Both mobile applications will be developed using: 
• React Native 
• Expo 
• TypeScript 
This allows both Android and iOS applications to be developed from a shared codebase, reducing 
development time and future maintenance costs. 
Supporting Technologies 
Depending on the selected architecture, the mobile applications will make use of: 
• Expo Router for navigation 
• Expo Notifications/Firebase Cloud Messaging for push notifications 
• Secure local storage for authentication tokens 
• React Query or equivalent for API data synchronization 
• Zustand or Context API for lightweight application state 
• Maps and location services where required for delivery functionality 
Web Admin Dashboard 
The administrative dashboard will be developed using: 
• Next.js 
• TypeScript 
• Tailwind CSS 
• Responsive dashboard architecture 
The dashboard will be optimized for desktop and tablet use while remaining usable on mobile 
devices. 
3. Application Breakdown 
A. Customer Mobile Application 
This is the primary application used by pharmacy customers. 
Core Features 
• User registration and login 
• Profile management 
• Saved delivery addresses 
• Browse medications by category 
• Search medications 
• View medication details 
• Real-time stock availability 
• Current medication pricing 
• Shopping cart 
• Checkout process 
• Delivery fee calculation 
• Secure online payment 
• Order confirmation 
• Real-time order status updates 
• Order history 
• Reorder previous purchases 
• Push notifications 
• Restock notifications 
• In-app chat and support 
The customer experience will follow the core journey of discovering a medication, checking 
availability and price, placing an order, paying, tracking fulfillment, and receiving updates. 
B. Pharmacy Attendant Mobile Application 
The attendant application will be designed specifically for pharmacy staff responsible for order 
fulfillment and stock operations. 
Core Features 
• Secure attendant login 
• View incoming orders 
• Order queue management 
• Confirm product availability 
• Confirm or reject orders where necessary 
• Mark orders as being prepared 
• Mark orders as packed 
• Mark orders ready for pickup 
• Update stock quantities 
• View assigned order details 
• Communicate with customers 
• Communicate with delivery personnel where applicable 
• Receive real-time order notifications 
This application is intentionally focused and lightweight so pharmacy attendants can process 
orders quickly without needing access to the full administrative system. 
C. Web Admin Dashboard 
The web dashboard will provide full operational control of the Yahadeen platform. 
Dashboard Modules 
Dashboard Overview 
• Total sales 
• Total orders 
• Pending orders 
• Completed orders 
• Revenue overview 
• Low-stock products 
• Recent activity 
Product & Drug Management 
• Add medications/products 
• Edit product details 
• Upload product images 
• Set product categories 
• Update pricing 
• Update stock quantities 
• Enable or disable products 
• Manage availability 
Order Management 
• View all orders 
• Filter by order status 
• View payment information 
• Assign or manage fulfillment 
• Monitor delivery progress 
• Handle cancellations or failed orders 
Attendant Management 
• Create attendant accounts 
• Manage permissions 
• Monitor activity 
• Activate or deactivate attendants 
Customer Management 
• View registered customers 
• View customer order history 
• Manage customer information where necessary 
Inventory Monitoring 
• Low-stock alerts 
• Out-of-stock products 
• Inventory updates 
• Product availability management 
Reports & Analytics 
• Sales reports 
• Revenue summaries 
• Best-selling products 
• Order performance 
• Inventory insights 
• Delivery performance 
The dashboard will serve as the central operational system for managing products, stock, orders, 
attendants, delivery operations, and business insights. 
4. Payment Integration 
The platform will integrate a suitable payment gateway to support secure customer payments. 
Depending on the target market and preferred provider, this may include: 
• Card payments 
• Bank transfers 
• Other locally supported payment methods 
Payment processing will include: 
• Payment initialization 
• Secure payment verification 
• Webhook handling 
• Automatic order confirmation after successful payment 
• Failed payment handling 
The final payment provider will be selected based on the pharmacy's operating country, transaction 
requirements, and available payment methods. 
5. Delivery & Logistics Integration 
Yahadeen is designed to support integration with a third-party logistics or delivery partner. 
The intended workflow is: 
1. Customer places an order. 
2. Payment is confirmed. 
3. Pharmacy attendant confirms and prepares the order. 
4. Order is marked ready for pickup. 
5. Delivery partner receives the delivery request. 
6. Rider picks up the order. 
7. Delivery status is updated. 
8. Customer receives real-time updates. 
Delivery fees can also be calculated automatically based on the customer's delivery address and 
distance where the selected logistics provider supports this capability. 
Note: The availability and capabilities of automated dispatch, distance calculation, tracking, and 
rider communication will depend on the API capabilities of the selected logistics partner. 
6. Real-Time Notifications & Communication 
The system will support push notifications for important activities. 
Examples include: 
Customers 
• Order received 
• Order confirmed 
• Order being prepared 
• Order ready 
• Order picked up 
• Order out for delivery 
• Order delivered 
• Product restocked 
Attendants 
• New order received 
• Order cancellation 
• Stock-related alerts 
A restock notification feature will allow interested customers to be notified when previously 
unavailable products become available again. 
The system can also include in-app messaging between: 
• Customer and pharmacy attendant 
• Customer and delivery personnel, where supported by the logistics workflow 
7. Backend Architecture Options 
Two technical approaches are available for the backend architecture. 
Option One — Next.js API Routes 
Under this option, the Next.js application will handle both: 
• The Admin Dashboard frontend 
• Backend API services 
The backend will be built using Next.js Route Handlers/API Routes, but the application logic 
will be properly separated into reusable service layers. 
Proposed Structure 
Next.js Application 
│ 
├── Admin Dashboard 
│ 
├── API Routes 
│   
├── Authentication 
│   
│   
│   
│   
│   
├── Products 
├── Orders 
├── Inventory 
├── Payments 
├── Notifications 
│   └── Reports 
│ 
├── Services 
│   
├── Product Service 
│   
│   
│   
├── Order Service 
├── Payment Service 
├── Inventory Service 
│   └── Notification Service 
│ 
└── Database Layer 
The API routes will remain relatively lightweight, while the main business logic will live inside 
dedicated services. This makes the system easier to maintain and also reduces the risk of business 
logic becoming scattered across individual API endpoints. 
Advantages 
• Lower infrastructure complexity 
• Faster development 
• One primary backend application to manage 
• Shared TypeScript types 
• Easier deployment for the initial version 
• Lower operational cost 
• Suitable for an MVP and moderate initial traffic 
Considerations 
As the system grows, complex background jobs, real-time services, large integrations, or 
independently scalable workloads may become more difficult to manage within the same 
application. 
This option is recommended if the priority is to launch efficiently, reduce infrastructure cost, and 
validate the product before scaling aggressively. 
8. Option Two — Dedicated Backend Architecture 
The second option is to build a separate backend application. 
Recommended Stack 
• NestJS 
• TypeScript 
• PostgreSQL 
• Prisma or another suitable ORM 
• Redis where required 
• Queue system for background jobs where required 
The architecture would look like: 
Customer Mobile App 
│ 
Attendant Mobile App 
│ 
Admin Dashboard 
│ 
▼ 
Dedicated API 
(NestJS) 
│ 
┌──────┼─────────┐ 
│      │
         │ 
Auth  Orders   Inventory 
│      │
         │ 
Payments Notifications Delivery 
│ 
▼ 
Database 
Advantages 
• Better separation of frontend and backend systems 
• Easier long-term scalability 
• Independent deployment of backend services 
• Better structure for complex business logic 
• Easier integration with multiple external services 
• Better support for background processing 
• Easier implementation of queues and scheduled tasks 
• More suitable for a growing multi-platform system 
Considerations 
• Higher development cost 
• Additional infrastructure 
• More deployment and maintenance requirements 
• Longer initial development time 
9. Recommended Architecture 
For the first production version, I would recommend evaluating the expected scale and available 
budget. 
Recommended for Faster and More Cost-Effective Launch 
Next.js + Service Layer Architecture 
This will allow the project to launch faster while maintaining a clean separation between API 
endpoints and business logic. 
The service architecture also makes it possible to migrate or extract certain services into a 
dedicated backend later if the platform grows significantly. 
Recommended for Long-Term Scale 
Dedicated NestJS Backend 
This would be the stronger architecture if Yahadeen is expected to expand into: 
• Multiple pharmacy branches 
• Multiple locations 
• Large transaction volumes 
• Complex logistics operations 
• Multiple delivery providers 
• Advanced reporting 
• Large-scale notifications 
• Multiple future client applications 
10. Database & Infrastructure 
The platform will require a centralized cloud database. 
Recommended options include: 
• PostgreSQL 
• Supabase PostgreSQL 
• Managed PostgreSQL infrastructure 
Core data will include: 
• Users 
• Customers 
• Attendants 
• Administrators 
• Products 
• Categories 
• Inventory 
• Orders 
• Order items 
• Payments 
• Delivery information 
• Notifications 
• Chat messages 
The final infrastructure setup will also include: 
• Secure environment variables 
• Authentication and authorization 
• Database backups 
• API security 
• Logging and monitoring 
• Payment webhook validation 
11. Development Phases 
Phase 1 — Planning & System Architecture 
• Final feature review 
• Database architecture 
• User roles and permissions 
• API planning 
• Third-party integration review 
• Technical architecture setup 
Phase 2 — Backend & Core Services 
• Authentication 
• User management 
• Product management 
• Inventory management 
• Order management 
• Payment integration 
• Notification infrastructure 
Phase 3 — Customer Mobile Application 
• Authentication 
• Product browsing 
• Search 
• Cart 
• Checkout 
• Payment 
• Order tracking 
• Notifications 
• Profile and order history 
• Customer support 
Phase 4 — Attendant Mobile Application 
• Authentication 
• Order queue 
• Order processing 
• Stock updates 
• Fulfillment workflow 
• Notifications 
• Communication tools 
Phase 5 — Admin Dashboard 
• Dashboard analytics 
• Product management 
• Inventory management 
• Order management 
• Attendant management 
• Customer management 
• Reports 
Phase 6 — Testing & Deployment 
• Functional testing 
• API testing 
• Payment testing 
• Real-time synchronization testing 
• Security review 
• Production deployment 
• Mobile application build preparation 
12. Estimated Development Timeline 
The estimated development timeline will be approximately: 
Development Area 
Estimated Duration 
Planning & Architecture 1 Week 
Backend & Database 
1–2 Weeks 
Customer Mobile App 1–2 Weeks 
Attendant Mobile App 1–2 Weeks 
Admin Dashboard 
1–2 Weeks 
Testing & Deployment 1–2 Weeks 
Estimated Total 
Approximately 8–12 Weeks 
Some development stages can run concurrently, which may reduce the overall delivery timeline. 
13. Development Investment 
The pricing below covers the design and development of the software platform described in this 
document. 
Option One — Next.js API Routes + Service Architecture 
Development Cost 
₦2,500,000 
This includes: 
• Customer mobile application 
• Attendant mobile application 
• Admin dashboard 
• Next.js backend/API architecture 
• Database integration 
• Authentication 
• Product and inventory management 
• Order management 
• Payment gateway integration 
• Push notification setup 
• Delivery/logistics integration 
• Testing and deployment support 
This option provides a more cost-effective architecture while maintaining a clean and scalable 
service structure. 
Option Two — Dedicated NestJS Backend 
Development Cost 
₦3,500,000 
This includes everything in Option One, with: 
• Dedicated NestJS backend 
• Independent API architecture 
• Modular backend services 
• Advanced background processing structure 
• Improved long-term scalability 
• Independent backend deployment 
• Better readiness for future integrations and expansion 
14. Third-Party and Recurring Costs 
The development cost does not include third-party charges that may be required to operate the 
platform. 
These may include: 
• Google Play Developer Account 
• Apple Developer Account 
• Cloud hosting 
• Database hosting 
• Domain name 
• Payment gateway transaction charges 
• SMS services, if implemented 
• Push notification services where applicable 
• Maps and location APIs 
• Logistics provider charges 
• Cloud storage 
• Email services 
These services will be selected based on actual operational requirements and can be configured to 
minimize recurring costs during the initial launch. 
15. Project Scope Notes 
The proposed development covers the Yahadeen software platform and the features outlined in 
this implementation plan. 
Certain features depend on external service providers, particularly: 
• Automated logistics dispatch 
• Distance-based delivery pricing 
• Live rider tracking 
• Payment methods 
• Maps and geolocation services 
Where an external provider does not provide a required API capability, the feature may require an 
alternative provider or additional custom development. 
Any major features introduced outside the approved scope may require a separate timeline and 
cost review. 
16. Final Recommendation 
Yahadeen should be developed as a centralized, API-driven platform where the customer 
application, attendant application, and administrative dashboard all communicate with the same 
core business system. 
For an efficient first launch, I recommend the Next.js API Routes with a properly structured 
service layer. This provides a faster and more cost-effective path to production without sacrificing 
clean architecture. 
If the business intends to scale aggressively from the beginning, support multiple pharmacy 
locations, integrate several logistics providers, or handle significantly larger operational 
workloads, the dedicated NestJS backend architecture would be the preferred long-term 
investment. 
The architecture will ultimately be selected based on the project's launch budget, expected growth, 
and operational requirements, with both approaches designed to support the core Yahadeen vision 
of real-time stock visibility, ordering, payment, fulfillment, and delivery. 