-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: xerox_rental_db
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `action_type` enum('ACCESS_SENSITIVE_DATA','CREATE','DELETE','EXPORT','IMPERSONATION','IMPORT','LOGIN','LOGOUT','READ','UPDATE') NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `details` varchar(255) DEFAULT NULL,
  `entity_id` varchar(255) DEFAULT NULL,
  `entity_type` varchar(255) NOT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKris84xcvl3wyk87jyyoedw3vc` (`user_id`),
  CONSTRAINT `FKris84xcvl3wyk87jyyoedw3vc` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `company_logo_url` varchar(500) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `default_copy_ratio` double DEFAULT NULL,
  `default_free_copies` bigint DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `signature_image_url` varchar(500) DEFAULT NULL,
  `stamp_image_url` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `owner_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKjoneogwy1jt91t3lrorso1p5p` (`owner_id`),
  CONSTRAINT `FK75qajoobuyjudpx949wvbdmyi` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `end_date` datetime(6) NOT NULL,
  `monthly_rent` double NOT NULL,
  `start_date` datetime(6) NOT NULL,
  `status` enum('ACTIVE','EXPIRED','TERMINATED') NOT NULL,
  `terms` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  `owner_id` bigint NOT NULL,
  `rental_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK68qujdyxwmqtp0wt1dyij6u9s` (`machine_id`),
  KEY `FK17suexlu3rbp31vyv1hled4oy` (`owner_id`),
  KEY `FKdv9yhrelfitokqnpxgfhatdj6` (`rental_id`),
  CONSTRAINT `FK17suexlu3rbp31vyv1hled4oy` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK68qujdyxwmqtp0wt1dyij6u9s` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `FKdv9yhrelfitokqnpxgfhatdj6` FOREIGN KEY (`rental_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `document_type` enum('AGREEMENT','CERTIFICATE','CONTRACT','INSPECTION_REPORT','INSURANCE','INVOICE','LICENSE','MAINTENANCE_REPORT','MANUAL','OTHER','RECEIPT','SPECIFICATION','WARRANTY') NOT NULL,
  `download_count` int NOT NULL,
  `entity_id` bigint DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `is_public` bit(1) NOT NULL,
  `status` enum('ACTIVE','ARCHIVED','DELETED','EXPIRED') NOT NULL,
  `string` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `version` int NOT NULL,
  `contract_id` bigint DEFAULT NULL,
  `machine_id` bigint DEFAULT NULL,
  `uploaded_by` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcg8y2nvd6sjvwb8kuvhk6h0fy` (`contract_id`),
  KEY `FKj0we4fhbx0nycoeg5tr9r0lo9` (`machine_id`),
  KEY `FKi7w1wj3aiorapq4qtjguj2yhl` (`uploaded_by`),
  KEY `FK9vlo82o8epjk25heonrvyxxxd` (`user_id`),
  CONSTRAINT `FK9vlo82o8epjk25heonrvyxxxd` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKcg8y2nvd6sjvwb8kuvhk6h0fy` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`),
  CONSTRAINT `FKi7w1wj3aiorapq4qtjguj2yhl` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKj0we4fhbx0nycoeg5tr9r0lo9` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `billable_copies` bigint DEFAULT NULL,
  `closing_reading` bigint DEFAULT NULL,
  `copy_ratio` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `free_copies` bigint DEFAULT NULL,
  `monthly_rent` double DEFAULT NULL,
  `starting_reading` bigint DEFAULT NULL,
  `total_copies` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `invoice_id` bigint NOT NULL,
  `machine_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKq8pt8fbl1qms8g1nldae9f1bh` (`invoice_id`),
  KEY `FKiwpyl01tq96nmlpb77cbwk3tm` (`machine_id`),
  CONSTRAINT `FKiwpyl01tq96nmlpb77cbwk3tm` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `FKq8pt8fbl1qms8g1nldae9f1bh` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `billable_copies` bigint DEFAULT NULL,
  `classification` varchar(255) DEFAULT NULL,
  `closing_reading` bigint DEFAULT NULL,
  `company_logo_url` varchar(255) DEFAULT NULL,
  `copy_ratio` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `due_date` datetime(6) NOT NULL,
  `free_copies` bigint DEFAULT NULL,
  `gst_amount` double NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `monthly_rent` double DEFAULT NULL,
  `paid_date` datetime(6) DEFAULT NULL,
  `payment_mode` enum('OFFLINE','ONLINE') DEFAULT NULL,
  `signature_image_url` varchar(255) DEFAULT NULL,
  `stamp_image_url` varchar(255) DEFAULT NULL,
  `starting_reading` bigint DEFAULT NULL,
  `status` enum('OVERDUE','PAID','PENDING') NOT NULL,
  `total_amount` double NOT NULL,
  `total_copies` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  `owner_id` bigint NOT NULL,
  `rental_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKiwj5wp0e35dgt0dljqp8k3m54` (`invoice_number`),
  KEY `FKg08c7srlohdj3ubmopsvpp572` (`machine_id`),
  KEY `FKg28ocntng11icy7vl9iqnes88` (`owner_id`),
  KEY `FKndgdmcmm6j6di37fxh30q8a7o` (`rental_id`),
  CONSTRAINT `FKg08c7srlohdj3ubmopsvpp572` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `FKg28ocntng11icy7vl9iqnes88` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKndgdmcmm6j6di37fxh30q8a7o` FOREIGN KEY (`rental_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_health`
--

DROP TABLE IF EXISTS `machine_health`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_health` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alerts` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `error_count` int DEFAULT NULL,
  `health_score` double NOT NULL,
  `humidity` double DEFAULT NULL,
  `last_maintenance` datetime(6) DEFAULT NULL,
  `next_maintenance` datetime(6) DEFAULT NULL,
  `pages_printed_today` bigint DEFAULT NULL,
  `paper_level` int DEFAULT NULL,
  `recommendations` varchar(255) DEFAULT NULL,
  `status` enum('CRITICAL','EXCELLENT','GOOD','OFFLINE','WARNING') NOT NULL,
  `temperature` double DEFAULT NULL,
  `toner_level` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtqbq79h7xe1kkxyf7ovvo4p3j` (`machine_id`),
  CONSTRAINT `FKtqbq79h7xe1kkxyf7ovvo4p3j` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_locations`
--

DROP TABLE IF EXISTS `machine_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `location_type` enum('CURRENT','DELIVERY','HISTORICAL','PICKUP','SERVICE','STORAGE') NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `recorded_at` datetime(6) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  `recorded_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdw35i8ssurffctwtjdd7fcgbk` (`machine_id`),
  KEY `FK98j82vw02qfovfjy8orkaaiap` (`recorded_by`),
  CONSTRAINT `FK98j82vw02qfovfjy8orkaaiap` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdw35i8ssurffctwtjdd7fcgbk` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machines`
--

DROP TABLE IF EXISTS `machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `current_address` varchar(255) DEFAULT NULL,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `installation_date` datetime(6) DEFAULT NULL,
  `last_location_update` datetime(6) DEFAULT NULL,
  `last_service_date` datetime(6) DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `monthly_rent` double NOT NULL,
  `name` varchar(255) NOT NULL,
  `serial_number` varchar(255) NOT NULL,
  `status` enum('AVAILABLE','MAINTENANCE','RENTED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_usage` bigint NOT NULL,
  `owner_id` bigint NOT NULL,
  `rental_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKi0gota946i558sa9y7w9tvgw9` (`serial_number`),
  KEY `FKk5xfhm3xms5aqlgkqxlccnaw` (`owner_id`),
  KEY `FKm936k52uhul6c2xj7rwh37dpu` (`rental_id`),
  CONSTRAINT `FKk5xfhm3xms5aqlgkqxlccnaw` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKm936k52uhul6c2xj7rwh37dpu` FOREIGN KEY (`rental_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maintenance_schedules`
--

DROP TABLE IF EXISTS `maintenance_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actual_duration` int DEFAULT NULL,
  `completed_date` datetime(6) DEFAULT NULL,
  `cost` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `estimated_duration` int DEFAULT NULL,
  `maintenance_type` varchar(255) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `scheduled_date` datetime(6) NOT NULL,
  `status` enum('CANCELLED','COMPLETED','IN_PROGRESS','OVERDUE','SCHEDULED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  `technician_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp0gbl94tcq4r8nqyjx83e04ly` (`machine_id`),
  KEY `FK7m5wh6hmrp090ljmo7t8d87dy` (`technician_id`),
  CONSTRAINT `FK7m5wh6hmrp090ljmo7t8d87dy` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp0gbl94tcq4r8nqyjx83e04ly` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action_url` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `message` varchar(255) NOT NULL,
  `priority` enum('CRITICAL','HIGH','LOW','MEDIUM') NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('ERROR','INFO','MAINTENANCE','PAYMENT','SUCCESS','SYSTEM','WARNING') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKk10cry0ngw776qndbru23piqi` (`user_id`),
  CONSTRAINT `FKk10cry0ngw776qndbru23piqi` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rate_limit_events`
--

DROP TABLE IF EXISTS `rate_limit_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blocked` bit(1) NOT NULL,
  `client_id` varchar(200) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `limit_type` varchar(50) NOT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_blocked` (`blocked`)
) ENGINE=InnoDB AUTO_INCREMENT=11004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rental_requests`
--

DROP TABLE IF EXISTS `rental_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `end_date` datetime(6) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `monthly_rent` double NOT NULL,
  `request_date` datetime(6) NOT NULL,
  `start_date` datetime(6) NOT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `machine_id` bigint NOT NULL,
  `owner_id` bigint NOT NULL,
  `rental_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK48js5lsc4nhu768tvwkdpa34h` (`machine_id`),
  KEY `FKc1g95c6pm69w98gwadh7y6bay` (`owner_id`),
  KEY `FKrenqykwni46yuxko38faage82` (`rental_id`),
  CONSTRAINT `FK48js5lsc4nhu768tvwkdpa34h` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `FKc1g95c6pm69w98gwadh7y6bay` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrenqykwni46yuxko38faage82` FOREIGN KEY (`rental_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` enum('ACTIVATED','CANCELLED','CREATED','DOWNGRADED','EXPIRED','REACTIVATED','REFUNDED','RENEWED','SUSPENDED','TRIAL_CONVERTED','TRIAL_STARTED','UPGRADED') NOT NULL,
  `amount_paid` double DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `new_plan_id` bigint DEFAULT NULL,
  `new_status` enum('ACTIVE','CANCELLED','EXPIRED','PENDING','SUSPENDED','TRIAL') DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `old_plan_id` bigint DEFAULT NULL,
  `old_status` enum('ACTIVE','CANCELLED','EXPIRED','PENDING','SUSPENDED','TRIAL') DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `refund_amount` double DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `subscription_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKisfm8mfqfi14d18b1qg00yvgp` (`subscription_id`),
  KEY `FKdie7gypwqawjuhdrxkkwq232c` (`user_id`),
  CONSTRAINT `FKdie7gypwqawjuhdrxkkwq232c` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKisfm8mfqfi14d18b1qg00yvgp` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `discount_percentage` double NOT NULL,
  `machine_limit` int DEFAULT NULL,
  `monthly_price` double NOT NULL,
  `name` varchar(255) NOT NULL,
  `trial_days` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `yearly_price` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6f47tqtrv0ck166hqdgpps5e1` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_notes` varchar(255) DEFAULT NULL,
  `amount_paid` double NOT NULL,
  `auto_renew` bit(1) NOT NULL,
  `billing_cycle` enum('MONTHLY','YEARLY') NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `end_date` datetime(6) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_pdf_path` varchar(500) DEFAULT NULL,
  `invoice_sent` bit(1) DEFAULT NULL,
  `invoice_sent_at` datetime(6) DEFAULT NULL,
  `is_trial` bit(1) NOT NULL,
  `last_notification_sent` datetime(6) DEFAULT NULL,
  `machine_limit` int DEFAULT NULL,
  `payment_details` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_verified` bit(1) DEFAULT NULL,
  `payment_verified_at` datetime(6) DEFAULT NULL,
  `start_date` datetime(6) NOT NULL,
  `status` enum('ACTIVE','CANCELLED','EXPIRED','PENDING','SUSPENDED','TRIAL') NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `trial_end_date` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `payment_verified_by` bigint DEFAULT NULL,
  `plan_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKj7dww09tyvnwkb1oetqqi3j95` (`payment_verified_by`),
  KEY `FKb7i81ggiampppc6oaodhwnkq3` (`plan_id`),
  KEY `FK54j1tnvqvb4o47gxybmfs97f9` (`user_id`),
  CONSTRAINT `FK54j1tnvqvb4o47gxybmfs97f9` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKb7i81ggiampppc6oaodhwnkq3` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  CONSTRAINT `FKj7dww09tyvnwkb1oetqqi3j95` FOREIGN KEY (`payment_verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `email_sent` bit(1) DEFAULT NULL,
  `image_file_name` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `priority` enum('HIGH','LOW','MEDIUM') NOT NULL,
  `status` enum('CLOSED','IN_PROGRESS','OPEN','RESOLVED') NOT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `assigned_to` bigint DEFAULT NULL,
  `created_by` bigint NOT NULL,
  `machine_id` bigint DEFAULT NULL,
  `owner_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfftadufiqdhbqnkaw38987xw` (`assigned_to`),
  KEY `FKowruchtnlp4o01gawkgqro7jm` (`created_by`),
  KEY `FK5ypa2hkoghrwauc40iw0lspci` (`machine_id`),
  KEY `FKhmvm9ig10wqd8u6bpb1k2qqfi` (`owner_id`),
  CONSTRAINT `FK5ypa2hkoghrwauc40iw0lspci` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `FKfftadufiqdhbqnkaw38987xw` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `FKhmvm9ig10wqd8u6bpb1k2qqfi` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKowruchtnlp4o01gawkgqro7jm` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_2fa_attempts`
--

DROP TABLE IF EXISTS `user_2fa_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_2fa_attempts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attempt_type` enum('BACKUP_CODE','DISABLE','LOGIN','SETUP') NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `error_message` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` bit(1) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) NOT NULL,
  `bank_account_holder_name` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(500) DEFAULT NULL,
  `bank_branch` varchar(255) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `is_password_changed` bit(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','OWNER','RENTAL','TECHNICIAN') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `owner_id` bigint DEFAULT NULL,
  `two_factor_backup_codes` varchar(255) DEFAULT NULL,
  `two_factor_enabled` bit(1) NOT NULL,
  `two_factor_secret` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6j5t70rd2eub907qysjvvd76n` (`email`),
  KEY `FKcbe4l28w3fq7lrnpp1nea9b4e` (`owner_id`),
  CONSTRAINT `FKcbe4l28w3fq7lrnpp1nea9b4e` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 13:59:23
