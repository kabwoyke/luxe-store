CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text NOT NULL,
	`product_ids` json NOT NULL,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `collections_slug_unique` UNIQUE(`slug`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `inventory_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` varchar(100),
	`change` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`order_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_logs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` varchar(100),
	`quantity` int NOT NULL,
	`price` int NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`variant_label` varchar(150),
	`image_url` varchar(1000),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`store_id` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`total` int NOT NULL,
	`delivery_fee` int NOT NULL DEFAULT 0,
	`payment_method` varchar(20) NOT NULL DEFAULT 'mpesa',
	`payment_status` varchar(20) NOT NULL DEFAULT 'pending',
	`delivery_name` varchar(150) NOT NULL,
	`delivery_phone` varchar(30) NOT NULL,
	`delivery_county` varchar(100),
	`delivery_address` text NOT NULL,
	`delivery_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`merchant_request_id` varchar(100) NOT NULL,
	`checkout_request_id` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`result_code` int,
	`result_desc` varchar(255),
	`mpesa_receipt` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_checkout_request_idx` UNIQUE(`checkout_request_id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`store_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`short_description` varchar(500),
	`price` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`subcategory` varchar(80) NOT NULL,
	`brand` varchar(100),
	`tags` json NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`image_url` varchar(1000) NOT NULL,
	`images` json NOT NULL,
	`attributes` json NOT NULL,
	`color_images` json NOT NULL,
	`variants` json NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`best_seller` boolean NOT NULL DEFAULT false,
	`new_arrival` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`user_name` varchar(150) NOT NULL,
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#8f4464',
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_slug_unique` UNIQUE(`slug`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`is_admin` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB;
--> statement-breakpoint
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_store_id_stores_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_store_id_stores_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `inventory_logs_product_idx` ON `inventory_logs` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `products_category_subcategory_idx` ON `products` (`category`,`subcategory`);--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`);