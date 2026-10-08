CREATE TABLE `settings` (
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
) ENGINE=InnoDB;
