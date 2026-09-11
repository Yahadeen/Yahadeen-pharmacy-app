// Export all services for easy importing
export { ProductService } from './product.service';
export { InventoryService } from './inventory.service';
export { OrderService } from './order.service';
export { PaymentService } from './payment.service';
export { CategoryService } from './category.service';
export { UserService } from './user.service';
export { AddressService } from './address.service';
export { NotificationService } from './notification.service';
export { ReportService } from './report.service';

// Export types
export type { Product, ProductWithStock, CreateProductInput, UpdateProductInput } from './product.service';
export type { StockMovement, UpdateStockInput } from './inventory.service';
export type { Order, OrderItem, OrderWithItems, CreateOrderInput, UpdateOrderStatusInput } from './order.service';
export type { Payment, InitPaymentInput } from './payment.service';
export type { Category, CreateCategoryInput, UpdateCategoryInput } from './category.service';
export type { Profile, CreateAttendantInput, UpdateProfileInput } from './user.service';
export type { Address, CreateAddressInput, UpdateAddressInput } from './address.service';
export type { Notification, CreateNotificationInput } from './notification.service';
export type { SalesReport, BestSellingProduct, DeliveryPerformance } from './report.service';
