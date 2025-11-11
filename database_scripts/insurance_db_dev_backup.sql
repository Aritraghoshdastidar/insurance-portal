-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: insurance_db_dev
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `insurance_db_dev`
--

/*!40000 DROP DATABASE IF EXISTS `insurance_db_dev`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `insurance_db_dev` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `insurance_db_dev`;

--
-- Table structure for table `admin_reminder`
--

DROP TABLE IF EXISTS `admin_reminder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_reminder` (
  `id` varchar(50) NOT NULL,
  `notification_id` varchar(50) DEFAULT NULL,
  `admin_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_reminder_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `reminder` (`notification_id`),
  CONSTRAINT `admin_reminder_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `administrator` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_reminder`
--

LOCK TABLES `admin_reminder` WRITE;
/*!40000 ALTER TABLE `admin_reminder` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_reminder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrator`
--

DROP TABLE IF EXISTS `administrator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrator` (
  `admin_id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrator`
--

LOCK TABLES `administrator` WRITE;
/*!40000 ALTER TABLE `administrator` DISABLE KEYS */;
INSERT INTO `administrator` VALUES ('ADM001','Admin User','admin@insurance.com','9999999999','System Admin','$2b$10$0w0dB4ZU622jS5DOmR4/Le3d6Kit2zUu80aufzNFoCv9VWYYPk/.C'),('ADM002','Junior Adjuster','j.adjuster@insurance.com',NULL,'Junior Adjuster','$2b$10$Qg0rD8un5G5Cetou0yga7OW7r3OI5up96/xxvj3WcWZyKOr/UZsi.'),('ADM003','Security Officer','security.officer@insurance.com','8888888888','Security Officer','$2b$10$y30jFKUcTiwo.LNQVcy3vOWzVu3Bqpbmla.hpVVOTlc0ajEYAzK3y');
/*!40000 ALTER TABLE `administrator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent`
--

DROP TABLE IF EXISTS `agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent` (
  `agent_id` varchar(50) NOT NULL,
  `agent_no` varchar(20) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent`
--

LOCK TABLES `agent` WRITE;
/*!40000 ALTER TABLE `agent` DISABLE KEYS */;
INSERT INTO `agent` VALUES ('AGENT001',NULL,'Agent Smith','smith.agent@example.com','9876500001',NULL),('AGENT002',NULL,'Agent Cooper','cooper.agent@example.com','9876500002',NULL),('AGT001','A001','Agent Smith','agent@insurance.com','8888888888','Mumbai Branch');
/*!40000 ALTER TABLE `agent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent_policy`
--

DROP TABLE IF EXISTS `agent_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_policy` (
  `id` varchar(50) NOT NULL,
  `policy_id` varchar(50) DEFAULT NULL,
  `agent_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `policy_id` (`policy_id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_policy_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`),
  CONSTRAINT `agent_policy_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `agent` (`agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_policy`
--

LOCK TABLES `agent_policy` WRITE;
/*!40000 ALTER TABLE `agent_policy` DISABLE KEYS */;
INSERT INTO `agent_policy` VALUES ('AP_POL_BUY_1762662764443','POL_BUY_1762662764443','AGT001'),('AP_POL_BUY_1762665108394','POL_BUY_1762665108394','AGT001'),('AP_POL_BUY_1762665128583','POL_BUY_1762665128583','AGT001'),('AP_POL_BUY_1762665929841','POL_BUY_1762665929841','AGT001'),('AP_POL_BUY_1762666091336','POL_BUY_1762666091336','AGT001'),('AP_POL_BUY_1762674586386','POL_BUY_1762674586386','AGT001'),('AP_POL_BUY_1762675442912','POL_BUY_1762675442912','AGT001'),('AP_POL_BUY_1762681573778','POL_BUY_1762681573778','AGT001'),('AP_POL_TEST_AGENT','POL_TEST_AGENT','AGT001'),('AP_POL_TEST_WORKFLOW_1762667801290','POL_TEST_WORKFLOW_1762667801290','AGT001'),('AP_POL_TEST_WORKFLOW_1762667844093','POL_TEST_WORKFLOW_1762667844093','AGT001'),('AP_POL001','POL0001','AGT001'),('AP_POL002','POL0002','AGT001');
/*!40000 ALTER TABLE `agent_policy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `user_type` enum('CUSTOMER','ADMIN') NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `entity_id` varchar(50) DEFAULT NULL COMMENT 'ID of the affected entity (e.g., claim_id, policy_id)',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `details` json DEFAULT NULL COMMENT 'Optional details like data before/after change',
  PRIMARY KEY (`audit_log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Audit log for sensitive user actions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-07 11:35:01',NULL),(2,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-07 11:40:24',NULL),(3,'ADM002','ADMIN','CLAIM_STATUS_UPDATE_APPROVED','CLM_1761213442232','2025-11-07 11:40:40','{\"newStatus\": \"APPROVED\", \"oldStatus\": \"PENDING\"}'),(4,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 03:29:32',NULL),(5,'new@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 03:41:30','{\"email\": \"new@insurance.com\"}'),(6,'new@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 03:42:08','{\"email\": \"new@insurance.com\"}'),(7,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 03:42:19',NULL),(8,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 03:53:58',NULL),(9,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 04:05:40',NULL),(10,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 04:24:52',NULL),(11,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 04:28:41',NULL),(12,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 04:32:33',NULL),(13,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762662764443','2025-11-09 04:32:44','{\"template_policy_id\": \"POL1003\"}'),(14,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762665108394','2025-11-09 05:11:48','{\"template_policy_id\": \"POL0002\"}'),(15,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762665128583','2025-11-09 05:12:08','{\"template_policy_id\": \"POL1003\"}'),(16,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762665929841','2025-11-09 05:25:29','{\"template_policy_id\": \"POL1001\"}'),(17,'CUST_1761038061124','CUSTOMER','INITIAL_PREMIUM_PAYMENT','POL_BUY_1762665929841','2025-11-09 05:25:29','{\"payment_id\": \"PAY_1762665929914\", \"transaction_id\": \"TXN_1762665929914\"}'),(18,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762666091336','2025-11-09 05:28:11','{\"template_policy_id\": \"POL0002\"}'),(19,'CUST_1761038061124','CUSTOMER','INITIAL_PREMIUM_PAYMENT','POL_BUY_1762666091336','2025-11-09 05:28:11','{\"payment_id\": \"PAY_1762666091376\", \"transaction_id\": \"TXN_1762666091376\"}'),(20,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 05:34:43',NULL),(21,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 05:36:38',NULL),(22,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 05:45:54',NULL),(23,'ADM002','ADMIN','POLICY_INITIAL_APPROVAL','POL_TEST_AGENT','2025-11-09 05:50:56','{\"newStatus\": \"PENDING_FINAL_APPROVAL\"}'),(24,'ADM002','ADMIN','CLAIM_STATUS_UPDATE_APPROVED','CLM_1762665971112','2025-11-09 05:50:58','{\"newStatus\": \"APPROVED\", \"oldStatus\": \"PENDING\"}'),(25,'ADM002','ADMIN','CLAIM_STATUS_UPDATE_APPROVED','CLM_1762667111575','2025-11-09 05:50:59','{\"newStatus\": \"APPROVED\", \"oldStatus\": \"PENDING\"}'),(26,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 05:58:44',NULL),(27,'j.adjuster@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 05:59:39','{\"email\": \"j.adjuster@insurance.com\"}'),(28,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 05:59:42',NULL),(29,'ADM002','ADMIN','POLICY_INITIAL_APPROVAL','POL_TEST_WORKFLOW_1762667844093','2025-11-09 05:59:48','{\"newStatus\": \"PENDING_FINAL_APPROVAL\"}'),(30,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 06:04:50',NULL),(31,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:09:37',NULL),(32,'ADM002','ADMIN','POLICY_INITIAL_APPROVAL','POL_BUY_1762662764443','2025-11-09 06:10:32','{\"newStatus\": \"PENDING_FINAL_APPROVAL\"}'),(33,'ADM002','ADMIN','POLICY_INITIAL_APPROVAL','POL_BUY_1762665108394','2025-11-09 06:10:33','{\"newStatus\": \"PENDING_FINAL_APPROVAL\"}'),(34,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:21:40',NULL),(35,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:28:19',NULL),(36,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL1005','2025-11-09 06:29:48','{\"newStatus\": \"ACTIVE\"}'),(37,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:30:06',NULL),(38,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 06:30:20',NULL),(39,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:33:50',NULL),(40,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL_TEST_AGENT','2025-11-09 06:33:54','{\"newStatus\": \"ACTIVE\"}'),(41,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL_BUY_1762662764443','2025-11-09 06:33:55','{\"newStatus\": \"ACTIVE\"}'),(42,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL_BUY_1762665108394','2025-11-09 06:33:55','{\"newStatus\": \"ACTIVE\"}'),(43,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL_TEST_WORKFLOW_1762667844093','2025-11-09 06:33:56','{\"newStatus\": \"ACTIVE\"}'),(44,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:34:11',NULL),(45,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 06:34:27',NULL),(46,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:35:08',NULL),(47,'ADM002','ADMIN','CLAIM_STATUS_UPDATE_APPROVED','CLM_1762670090888','2025-11-09 06:35:11','{\"newStatus\": \"APPROVED\", \"oldStatus\": \"PENDING\"}'),(48,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 06:46:15',NULL),(49,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:08:56',NULL),(50,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:15:46',NULL),(51,'ADM002','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 07:16:06','{\"email\": \"j.adjuster@insurance.com\"}'),(52,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:16:12',NULL),(53,'ADM001','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:23:54',NULL),(54,'ADM002','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 07:24:47','{\"email\": \"j.adjuster@insurance.com\"}'),(55,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:24:51',NULL),(56,'CUST_1762673734968','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 07:35:55',NULL),(57,'CUST_1762673734968','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762674586386','2025-11-09 07:49:46','{\"template_policy_id\": \"POL_BUY_1762665108394\"}'),(58,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 07:54:49','{\"email\": \"admin@insurance.com\"}'),(59,'ADM001','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:54:54',NULL),(60,'ADM001','ADMIN','POLICY_INITIAL_APPROVAL','POL_BUY_1762674586386','2025-11-09 07:54:58','{\"newStatus\": \"PENDING_FINAL_APPROVAL\"}'),(61,'ADM003','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 07:55:29',NULL),(62,'ADM003','ADMIN','POLICY_FINAL_APPROVAL','POL_BUY_1762674586386','2025-11-09 07:55:30','{\"newStatus\": \"ACTIVE\"}'),(63,'ADM003','ADMIN','CLAIM_STATUS_UPDATE_APPROVED','CLM_1762674847953','2025-11-09 07:55:31','{\"newStatus\": \"APPROVED\", \"oldStatus\": \"PENDING\"}'),(64,'Test1@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 07:56:05','{\"email\": \"Test1@example.com\"}'),(65,'Test1@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 07:56:38','{\"email\": \"Test1@insurance.com\"}'),(66,'Test1@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 07:56:48','{\"email\": \"Test1@example.com\"}'),(67,'CUST_1762673734968','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 07:57:54',NULL),(68,'CUST_1762673734968','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762675442912','2025-11-09 08:04:02','{\"template_policy_id\": \"POL_BUY_1762665108394\"}'),(69,'CUST_1762673734968','CUSTOMER','INITIAL_PREMIUM_PAYMENT','POL_BUY_1762675442912','2025-11-09 08:04:03','{\"payment_id\": \"PAY_1762675442981\", \"finalStatus\": \"PENDING_INITIAL_APPROVAL\", \"transaction_id\": \"TXN_1762675442981\"}'),(70,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 09:45:57',NULL),(71,'CUST_1761038061124','CUSTOMER','POLICY_PURCHASED','POL_BUY_1762681573778','2025-11-09 09:46:13','{\"template_policy_id\": \"POL_BUY_1762665108394\"}'),(72,'CUST_1761038061124','CUSTOMER','INITIAL_PREMIUM_PAYMENT','POL_BUY_1762681573778','2025-11-09 09:46:13','{\"payment_id\": \"PAY_1762681573830\", \"finalStatus\": \"PENDING_INITIAL_APPROVAL\", \"transaction_id\": \"TXN_1762681573830\"}'),(73,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 13:31:11',NULL),(74,'Testing@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:11:26','{\"email\": \"Testing@example.com\"}'),(75,'Testing@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:11:50','{\"email\": \"Testing@example.com\"}'),(76,'CUST_TEST_01','CUSTOMER','LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:12:02','{\"email\": \"Test@example.com\"}'),(77,'CUST_TEST_01','CUSTOMER','LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:12:42','{\"email\": \"test@example.com\"}'),(78,'CUST_TEST_01','CUSTOMER','LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:12:56','{\"email\": \"test@example.com\"}'),(79,'testing@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:13:05','{\"email\": \"testing@example.com\"}'),(80,'Testing@example.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:13:24','{\"email\": \"Testing@example.com\"}'),(81,'CUST_1761038061124','CUSTOMER','LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:13:40','{\"email\": \"new@example.com\"}'),(82,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-09 14:13:44',NULL),(83,'j.adjuster@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:14:53','{\"email\": \"j.adjuster@insurance.com\"}'),(84,'ADM002','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 14:15:41',NULL),(85,'admin@example.com','ADMIN','ADMIN_LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:16:40','{\"email\": \"admin@example.com\"}'),(86,'admin@example.com','ADMIN','ADMIN_LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:16:45','{\"email\": \"admin@example.com\"}'),(87,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:17:26','{\"email\": \"admin@insurance.com\"}'),(88,'ADM001','ADMIN','ADMIN_LOGIN_SUCCESS',NULL,'2025-11-09 14:17:29',NULL),(89,'CUST_TEST_01','CUSTOMER','LOGIN_FAILED_PASSWORD',NULL,'2025-11-09 14:19:24','{\"email\": \"test@example.com\"}'),(90,'Testing@insurance.com','CUSTOMER','LOGIN_FAILED_USER_NOT_FOUND',NULL,'2025-11-09 14:19:57','{\"email\": \"Testing@insurance.com\"}'),(91,'CUST_1761038061124','CUSTOMER','LOGIN_SUCCESS',NULL,'2025-11-10 04:11:04',NULL),(92,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:11:42','{\"email\": \"admin@insurance.com\"}'),(93,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:11:52','{\"email\": \"admin@insurance.com\"}'),(94,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:12:10','{\"email\": \"admin@insurance.com\"}'),(95,'ADM001','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:12:15','{\"email\": \"admin@insurance.com\"}'),(96,'ADM002','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:12:41','{\"email\": \"j.adjuster@insurance.com\"}'),(97,'ADM002','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:12:57','{\"email\": \"j.adjuster@insurance.com\"}'),(98,'ADM003','ADMIN','ADMIN_LOGIN_FAILED_PASSWORD',NULL,'2025-11-10 04:13:21','{\"email\": \"security.officer@insurance.com\"}');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `beneficiary`
--

DROP TABLE IF EXISTS `beneficiary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary` (
  `beneficiary_id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`beneficiary_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `beneficiary_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beneficiary`
--

LOCK TABLES `beneficiary` WRITE;
/*!40000 ALTER TABLE `beneficiary` DISABLE KEYS */;
INSERT INTO `beneficiary` VALUES ('BEN001','Jane Doe','jane@email.com','9111111111','Spouse','CUST001');
/*!40000 ALTER TABLE `beneficiary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim`
--

DROP TABLE IF EXISTS `claim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim` (
  `claim_id` varchar(50) NOT NULL,
  `policy_id` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `description` text,
  `claim_date` date DEFAULT NULL,
  `claim_status` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `status_log` text,
  `admin_id` varchar(50) DEFAULT NULL,
  `workflow_id` varchar(50) DEFAULT NULL,
  `current_step_order` int DEFAULT '1',
  `risk_score` int DEFAULT '0',
  PRIMARY KEY (`claim_id`),
  KEY `policy_id` (`policy_id`),
  KEY `customer_id` (`customer_id`),
  KEY `admin_id` (`admin_id`),
  KEY `fk_claim_workflow` (`workflow_id`),
  CONSTRAINT `claim_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`),
  CONSTRAINT `claim_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `claim_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `administrator` (`admin_id`),
  CONSTRAINT `fk_claim_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim`
--

LOCK TABLES `claim` WRITE;
/*!40000 ALTER TABLE `claim` DISABLE KEYS */;
INSERT INTO `claim` VALUES ('CLM_1761039772069','POL1001','CUST_1761038061124','Annual_check-up','2025-10-21','DECLINED',250.00,'Claim submitted by user.\nClaim declined by admin ADM002.','ADM002',NULL,1,2),('CLM_1761141526405','POL0002','CUST_1761140956348','Health','2025-10-22','DECLINED',10000.00,'Claim submitted by user.\nClaim declined by admin ADM002.',NULL,NULL,1,4),('CLM_1761201732504','POL1003','CUST_1761038061124','TEST','2025-10-23','APPROVED',99.00,'Claim submitted by user.\nClaim approved by admin ADM002.','ADM001',NULL,1,2),('CLM_1761206908731','POL1SESSION_1001','CUST_1761038061124','MED','2025-10-23','DECLINED',100.00,'Claim submitted by user.\nClaim declined by admin ADM002.',NULL,NULL,2,2),('CLM_1761213442232','POL1002','CUST_1761038061124','Workflow Test Correct Policy','2025-10-23','APPROVED',300.00,'Claim submitted by user.\nClaim approved by admin ADM002.','ADM002','CLAIM_APPROVAL_V1',NULL,2),('CLM_1762665971112','POL_BUY_1762665128583','CUST_1761038061124','adads','2025-11-09','APPROVED',12313123212.00,'Claim submitted by user.\nClaim approved by admin ADM002.','ADM001','CLAIM_APPROVAL_V1',NULL,10),('CLM_1762667111575','POL_BUY_1762665929841','CUST_1761038061124','Medical expenses for hospital visit','2025-11-09','APPROVED',5000.00,'Claim submitted by user.\nClaim approved by admin ADM002.','ADM003','CLAIM_APPROVAL_V1',NULL,3),('CLM_1762670090888','POL_BUY_1762666091336','CUST_1761038061124','test test','2025-11-09','APPROVED',150000.00,'Claim submitted by user.\nClaim approved by admin ADM002.','ADM002','CLAIM_APPROVAL_V1',NULL,7),('CLM_1762674847953','POL_BUY_1762674586386','CUST_1762673734968','Medical expenses for hospital visit','2025-11-09','APPROVED',5000.00,'Claim submitted by user.\nClaim approved by admin ADM003.',NULL,'CLAIM_APPROVAL_V1',NULL,0),('CLM_DEV_TEST','POL1001','CUST0001','Claim for physiotherapy session','2025-10-19','APPROVED',3000.00,'Claim submitted in dev.\nAssigned to adjuster.\nClaim approved by adjuster.','ADM002',NULL,1,3),('CLM001','POL0001','CUST_1761038061124','Medical treatment claim','2025-10-04','APPROVED',5000.00,'Claim submitted for review\nClaim approved by admin ADM002.','ADM002',NULL,1,3),('CLM002','POL0001','CUST001','Emergency surgery','2025-10-04','APPROVED',8000.00,'Claim approved after review','ADM001',NULL,1,4),('CLM003','POL1001','CUST0001','Claim for annual health check-up','2025-10-19','APPROVED',2500.00,'Claim submitted via API.\nAssigned to adjuster ADM002.\nClaim approved by ADM002. Payment pending.','ADM002',NULL,1,3),('CLM004','POL1002','CUST0002','Claim for cosmetic dental work','2025-10-19','DECLINED',7500.00,'Claim submitted via API.\nAssigned to adjuster ADM002.\nClaim declined by ADM002. Cosmetic procedures not covered.','ADM003',NULL,1,4);
/*!40000 ALTER TABLE `claim` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_claim_status_update` AFTER UPDATE ON `claim` FOR EACH ROW BEGIN
    DECLARE v_notification_id VARCHAR(50);
    
    IF OLD.claim_status != NEW.claim_status THEN
        SET v_notification_id = CONCAT('NOTIF_', NEW.claim_id, '_STATUS');
        
        INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
        VALUES (v_notification_id, NOW(), 'PENDING',
                CONCAT('Your claim ', NEW.claim_id, ' status has been updated to: ', NEW.claim_status),
                'CLAIM_UPDATE', NEW.customer_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `customer_id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `notification_preference_channel` enum('EMAIL','SMS','BOTH','NONE') DEFAULT 'EMAIL',
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES ('CUST_1761038061124','New User','new@example.com',NULL,NULL,NULL,NULL,'$2b$10$FHYtKei3MqZ1jOEt2b4zG.NHUU7GWlUkFDljCbl8YtgmSx/DQUB1e','EMAIL'),('CUST_1761140956348','Aritra','test@gmail.com',NULL,NULL,NULL,NULL,'$2b$10$LPktkRIdBxiSv/EN2YAGauUxqi2FoWCj4a9HFy2RniRIl1pb4jUB.','EMAIL'),('CUST_1762673734968','Testing1','Testing1@example.com',NULL,NULL,NULL,NULL,'$2b$10$7vyHS3MfrNQ4PPA7CJcDeemguU2amib9XkI.Z5Tb1/VMoc4FQmeta','EMAIL'),('CUST_TEST_01','Test User','test@example.com',NULL,NULL,NULL,NULL,'$2b$10$f9a/U.3q.L2jK6s.nL4/8uY1g.h8s3n.l5j.h5s.mK3o.p9y.u7o','EMAIL'),('CUST_TEST_2025','Test Customer','customer@test.com','555-0123','123 Test St',NULL,NULL,'\\.WydZXdX9FAnHZqXnnbOscRKzMc.lIa6By5wycOKt8XsRYi0Rj6','EMAIL'),('CUST0001','Alice Johnson','alice.johnson@example.com','9876543210','123 Maple St','1980-01-15',NULL,'','EMAIL'),('CUST0002','Bob Smith','bob.smith@example.com','9876543211','234 Oak St','1975-05-20',NULL,'','EMAIL'),('CUST0003','Charlie Brown','charlie.brown@example.com','9876543212','345 Pine St','1988-03-10',NULL,'','EMAIL'),('CUST0004','David Lee','david.lee@example.com','9876543213','456 Cedar St','1990-07-25',NULL,'','EMAIL'),('CUST0005','Eva Green','eva.green@example.com','9876543214','567 Birch St','1982-12-01',NULL,'','EMAIL'),('CUST0006','Frank Wright','frank.wright@example.com','9876543215','678 Elm St','1979-09-10',NULL,'','EMAIL'),('CUST0007','Grace Hall','grace.hall@example.com','9876543216','789 Willow St','1985-11-30',NULL,'','EMAIL'),('CUST0008','Hannah Scott','hannah.scott@example.com','9876543217','890 Poplar St','1992-04-18',NULL,'','EMAIL'),('CUST0009','Ian King','ian.king@example.com','9876543218','901 Spruce St','1978-06-12',NULL,'','EMAIL'),('CUST001','John Doe','john@email.com','9876543210','123 Main St','1990-05-15','Male','','EMAIL'),('CUST0010','Jane Doe','jane.doe@example.com','9876543219','102 Ash St','1983-08-15',NULL,'','EMAIL'),('CUST0011','Kyle Young','kyle.young@example.com','9876543220','213 Fir St','1991-02-20',NULL,'','EMAIL'),('CUST0012','Laura Parker','laura.parker@example.com','9876543221','324 Chestnut St','1986-10-05',NULL,'','EMAIL'),('CUST0013','Mark Adams','mark.adams@example.com','9876543222','435 Walnut St','1984-03-22',NULL,'','EMAIL'),('CUST0014','Nina Clark','nina.clark@example.com','9876543223','546 Sycamore St','1977-07-07',NULL,'','EMAIL'),('CUST0015','Oliver Davis','oliver.davis@example.com','9876543224','657 Maple St','1989-09-17',NULL,'','EMAIL'),('CUST0016','Paula Edwards','paula.edwards@example.com','9876543225','768 Oak St','1981-01-29',NULL,'','EMAIL'),('CUST0017','Quinn Ford','quinn.ford@example.com','9876543226','879 Pine St','1993-05-13',NULL,'','EMAIL'),('CUST0018','Rachel Gomez','rachel.gomez@example.com','9876543227','980 Cedar St','1987-11-22',NULL,'','EMAIL'),('CUST0019','Steve Harris','steve.harris@example.com','9876543228','109 Birch St','1980-04-04',NULL,'','EMAIL'),('CUST002','Alice Johnson','alice@email.com','9123456789','789 Pine Ave','1985-08-10','Female','','EMAIL'),('CUST0020','Tina Johnson','tina.johnson@example.com','9876543229','210 Elm St','1982-06-30',NULL,'','EMAIL');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_policy`
--

DROP TABLE IF EXISTS `customer_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_policy` (
  `customer_policy_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(50) NOT NULL,
  `policy_id` varchar(50) NOT NULL,
  PRIMARY KEY (`customer_policy_id`),
  KEY `fk_cp_customer` (`customer_id`),
  KEY `fk_cp_policy` (`policy_id`),
  CONSTRAINT `fk_cp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `fk_cp_policy` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_policy`
--

LOCK TABLES `customer_policy` WRITE;
/*!40000 ALTER TABLE `customer_policy` DISABLE KEYS */;
INSERT INTO `customer_policy` VALUES (1,'CUST0001','POL1001'),(2,'CUST0002','POL1002'),(3,'CUST0003','POL1003'),(4,'CUST0004','POL1001'),(5,'CUST0005','POL1002'),(6,'CUST0006','POL1003'),(7,'CUST0007','POL1001'),(8,'CUST0008','POL1002'),(9,'CUST0009','POL1003'),(10,'CUST001','POL0001'),(11,'CUST0010','POL1001'),(12,'CUST0011','POL1002'),(13,'CUST0012','POL1003'),(14,'CUST0013','POL1001'),(15,'CUST0014','POL1002'),(16,'CUST0015','POL1003'),(17,'CUST0016','POL1001'),(18,'CUST0017','POL1002'),(19,'CUST0018','POL1003'),(20,'CUST0019','POL1001'),(21,'CUST002','POL0002'),(22,'CUST0020','POL1002'),(23,'CUST_1761038061124','POL1002'),(24,'CUST_1761038061124','POL_BUY_1762662764443'),(25,'CUST_1761038061124','POL_BUY_1762665108394'),(26,'CUST_1761038061124','POL_BUY_1762665128583'),(27,'CUST_1761038061124','POL_BUY_1762665929841'),(28,'CUST_1761038061124','POL_BUY_1762666091336'),(29,'CUST_1761038061124','POL_TEST_WORKFLOW_1762667801290'),(30,'CUST_1761038061124','POL_TEST_WORKFLOW_1762667844093'),(31,'CUST_1762673734968','POL_BUY_1762674586386'),(32,'CUST_1762673734968','POL_BUY_1762675442912'),(33,'CUST_1761038061124','POL_BUY_1762681573778');
/*!40000 ALTER TABLE `customer_policy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `initial_payment`
--

DROP TABLE IF EXISTS `initial_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `initial_payment` (
  `payment_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_gateway` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MOCK_PAYMENT',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('PENDING','SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_policy_payment` (`policy_id`),
  KEY `idx_customer_payment` (`customer_id`),
  KEY `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `initial_payment`
--

LOCK TABLES `initial_payment` WRITE;
/*!40000 ALTER TABLE `initial_payment` DISABLE KEYS */;
INSERT INTO `initial_payment` VALUES ('MOCKPAY_1762665947886','POL_BUY_1762665128583','CUST_1761038061124',50000.00,'MOCK_PAYMENT','MOCK_TXN_1762665947886','SUCCESS','2025-11-09 05:25:47'),('MOCKPAY_1762667946421','POL_TEST_WORKFLOW_1762667801290','CUST_1761038061124',15000.00,'MOCK_PAYMENT','MOCK_TXN_1762667946421','SUCCESS','2025-11-09 05:59:06'),('MOCKPAY_1762668306711','POL_BUY_1762665108394','CUST_1761038061124',25000.00,'MOCK_PAYMENT','MOCK_TXN_1762668306711','SUCCESS','2025-11-09 06:05:06'),('MOCKPAY_1762668309958','POL_BUY_1762662764443','CUST_1761038061124',50000.00,'MOCK_PAYMENT','MOCK_TXN_1762668309958','SUCCESS','2025-11-09 06:05:09'),('MOCKPAY_1762674810382','POL_BUY_1762674586386','CUST_1762673734968',25000.00,'MOCK_PAYMENT','MOCK_TXN_1762674810382','SUCCESS','2025-11-09 07:53:30'),('PAY_1762665929914','POL_BUY_1762665929841','CUST_1761038061124',12000.00,'MOCK_GATEWAY','TXN_1762665929914','SUCCESS','2025-11-09 05:25:29'),('PAY_1762666091376','POL_BUY_1762666091336','CUST_1761038061124',25000.00,'MOCK_GATEWAY','TXN_1762666091376','SUCCESS','2025-11-09 05:28:11'),('PAY_1762675442981','POL_BUY_1762675442912','CUST_1762673734968',25000.00,'MOCK_GATEWAY','TXN_1762675442981','SUCCESS','2025-11-09 08:04:02'),('PAY_1762681573830','POL_BUY_1762681573778','CUST_1761038061124',25000.00,'MOCK_GATEWAY','TXN_1762681573830','SUCCESS','2025-11-09 09:46:13');
/*!40000 ALTER TABLE `initial_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'INFO',
  `sent_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_status` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`notification_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_read_status` (`read_status`),
  KEY `idx_sent_timestamp` (`sent_timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,'CUST_1762673734968','Γ£à Policy POL_BUY_1762675442912 (LIFE) has been successfully purchased and is now under review by our underwriters.','POLICY_CREATED','2025-11-09 08:04:02',0),(2,'CUST_1762673734968','≡ƒÆ│ Payment of Γé╣25000.00 received for policy POL_BUY_1762675442912. Thank you for your payment!','PAYMENT_RECEIVED','2025-11-09 08:04:02',0),(3,'CUST_1761038061124','Γ£à Policy POL_BUY_1762681573778 (LIFE) has been successfully purchased and is now under review by our underwriters.','POLICY_CREATED','2025-11-09 09:46:13',0),(4,'CUST_1761038061124','≡ƒÆ│ Payment of Γé╣25000.00 received for policy POL_BUY_1762681573778. Thank you for your payment!','PAYMENT_RECEIVED','2025-11-09 09:46:13',0);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` varchar(50) NOT NULL,
  `customer_policy_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `payment_mode` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payment_customer_policy` (`customer_policy_id`),
  CONSTRAINT `fk_payment_customer_policy` FOREIGN KEY (`customer_policy_id`) REFERENCES `customer_policy` (`customer_policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES ('PAY_DEV_TEST',1,'Success','2025-10-19 06:39:52','Debit Card'),('PAY0001',1,'Success','2025-01-01 04:30:00','Credit Card'),('PAY0002',2,'Success','2025-03-15 05:30:00','Net Banking'),('PAY0003',3,'Success','2025-06-01 04:00:00','Cash'),('PAY0004',4,'Failed','2025-01-05 06:30:00','Credit Card'),('PAY0005',5,'Success','2025-03-18 04:40:00','Net Banking'),('PAY0006',6,'Success','2025-06-03 09:00:00','Cash'),('PAY0007',7,'Success','2025-01-09 02:55:00','Credit Card'),('PAY0008',8,'Success','2025-03-20 04:45:00','Net Banking'),('PAY0009',9,'Success','2025-06-07 07:30:00','Cash'),('PAY001',10,'SUCCESS','2025-10-04 06:03:47','UPI'),('PAY0010',11,'Success','2025-01-12 10:15:00','Credit Card'),('PAY0011',12,'Failed','2025-03-25 04:20:00','Net Banking'),('PAY0012',13,'Success','2025-06-10 06:25:00','Cash'),('PAY0013',14,'Success','2025-01-15 07:00:00','Credit Card'),('PAY0014',15,'Failed','2025-03-28 10:30:00','Net Banking'),('PAY0015',16,'Success','2025-06-12 08:50:00','Cash'),('PAY0016',17,'Success','2025-01-18 04:40:00','Credit Card'),('PAY0017',18,'Success','2025-03-30 03:30:00','Net Banking'),('PAY0018',19,'Failed','2025-06-15 02:30:00','Cash'),('PAY0019',20,'Success','2025-01-22 12:00:00','Credit Card'),('PAY0020',22,'Success','2025-04-02 12:30:00','Net Banking');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_payment_success` AFTER INSERT ON `payment` FOR EACH ROW BEGIN
    DECLARE v_notification_id VARCHAR(50);
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_policy_id VARCHAR(50);

    IF NEW.status = 'Success' THEN
        SELECT customer_id, policy_id 
        INTO v_customer_id, v_policy_id 
        FROM customer_policy 
        WHERE customer_policy_id = NEW.customer_policy_id;
        
        SET v_notification_id = CONCAT('NOTIF_', NEW.payment_id, '_SUCCESS');
        
        INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
        VALUES (v_notification_id, NOW(), 'PENDING',
                CONCAT('Payment successful for policy ', v_policy_id, ' via ', NEW.payment_mode),
                'PAYMENT_SUCCESS', v_customer_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'CARD',
  `payment_gateway` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MOCK_PAYMENT',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('PENDING','SUCCESS','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `idx_policy_payment` (`policy_id`),
  KEY `idx_customer_payment` (`customer_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policy`
--

DROP TABLE IF EXISTS `policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policy` (
  `policy_id` varchar(50) NOT NULL,
  `policy_date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `premium_amount` decimal(15,2) DEFAULT NULL,
  `coverage_details` text,
  `status` enum('INACTIVE_AWAITING_PAYMENT','UNDERWRITER_REVIEW','PENDING_INITIAL_APPROVAL','PENDING_FINAL_APPROVAL','ACTIVE','DECLINED','DENIED_UNDERWRITER','EXPIRED') DEFAULT NULL,
  `policy_type` varchar(50) DEFAULT NULL,
  `previous_policy_id` varchar(50) DEFAULT NULL,
  `initial_approver_id` varchar(50) DEFAULT NULL,
  `initial_approval_date` timestamp NULL DEFAULT NULL,
  `final_approver_id` varchar(50) DEFAULT NULL,
  `final_approval_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`policy_id`),
  KEY `previous_policy_id` (`previous_policy_id`),
  KEY `fk_policy_initial_approver` (`initial_approver_id`),
  KEY `fk_policy_final_approver` (`final_approver_id`),
  CONSTRAINT `fk_policy_final_approver` FOREIGN KEY (`final_approver_id`) REFERENCES `administrator` (`admin_id`),
  CONSTRAINT `fk_policy_initial_approver` FOREIGN KEY (`initial_approver_id`) REFERENCES `administrator` (`admin_id`),
  CONSTRAINT `policy_ibfk_1` FOREIGN KEY (`previous_policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policy`
--

LOCK TABLES `policy` WRITE;
/*!40000 ALTER TABLE `policy` DISABLE KEYS */;
INSERT INTO `policy` VALUES ('POL_BUY_1762662764443','2025-11-09',NULL,NULL,50000.00,'Premium life insurance','ACTIVE','LIFE',NULL,'ADM002','2025-11-09 06:10:32','ADM003','2025-11-09 06:33:55'),('POL_BUY_1762665108394','2025-11-09',NULL,NULL,25000.00,'Term Life Insurance','ACTIVE','LIFE',NULL,'ADM002','2025-11-09 06:10:33','ADM003','2025-11-09 06:33:55'),('POL_BUY_1762665128583','2025-11-09',NULL,NULL,50000.00,'Premium life insurance','ACTIVE','LIFE',NULL,NULL,NULL,NULL,NULL),('POL_BUY_1762665929841','2025-11-09',NULL,NULL,12000.00,'Basic health coverage','ACTIVE','HEALTH',NULL,NULL,NULL,NULL,NULL),('POL_BUY_1762666091336','2025-11-09',NULL,NULL,25000.00,'Term Life Insurance','ACTIVE','LIFE',NULL,NULL,NULL,NULL,NULL),('POL_BUY_1762674586386','2025-11-09',NULL,NULL,25000.00,'Term Life Insurance','ACTIVE','LIFE',NULL,'ADM001','2025-11-09 07:54:58','ADM003','2025-11-09 07:55:30'),('POL_BUY_1762675442912','2025-11-09',NULL,NULL,25000.00,'Term Life Insurance','PENDING_INITIAL_APPROVAL','LIFE',NULL,NULL,NULL,NULL,NULL),('POL_BUY_1762681573778','2025-11-09',NULL,NULL,25000.00,'Term Life Insurance','PENDING_INITIAL_APPROVAL','LIFE',NULL,NULL,NULL,NULL,NULL),('POL_TEST_AGENT','2025-10-22',NULL,NULL,5000.00,NULL,'ACTIVE','HOME',NULL,'ADM002','2025-11-09 05:50:56','ADM003','2025-11-09 06:33:54'),('POL_TEST_WORKFLOW_1762667801290','2025-11-09',NULL,NULL,15000.00,'Test coverage','ACTIVE','HEALTH',NULL,NULL,NULL,NULL,NULL),('POL_TEST_WORKFLOW_1762667844093','2025-11-09',NULL,NULL,15000.00,'Test coverage','ACTIVE','HEALTH',NULL,'ADM002','2025-11-09 05:59:48','ADM003','2025-11-09 06:33:56'),('POL0001','2025-10-04','2025-01-01','2025-12-31',15000.00,'Comprehensive health coverage','ACTIVE','HEALTH',NULL,NULL,NULL,NULL,NULL),('POL0002','2025-10-04','2025-02-01','2026-01-31',25000.00,'Term Life Insurance','ACTIVE','LIFE',NULL,NULL,NULL,NULL,NULL),('POL1001','2025-01-01','2025-01-01','2025-12-31',12000.00,'Basic health coverage','ACTIVE','HEALTH',NULL,NULL,NULL,NULL,NULL),('POL1002','2025-02-15','2025-02-15','2026-02-14',15000.00,'Standard car insurance','ACTIVE','CAR',NULL,NULL,NULL,NULL,NULL),('POL1003','2025-03-01','2025-03-01','2030-02-28',50000.00,'Premium life insurance','ACTIVE','LIFE',NULL,NULL,NULL,NULL,NULL),('POL1004','2025-10-19',NULL,NULL,18000.00,NULL,'ACTIVE','HEALTH',NULL,NULL,NULL,NULL,NULL),('POL1005','2025-10-19',NULL,NULL,25000.00,NULL,'ACTIVE','HEALTH',NULL,'ADM002','2025-11-07 11:40:39','ADM003','2025-11-09 06:29:48'),('POL1006','2025-10-26','2025-11-01','2026-10-31',600.00,'Basic Home Insurance','INACTIVE_AWAITING_PAYMENT','HOME',NULL,'ADM001','2025-10-25 10:00:00','ADM002','2025-10-26 11:00:00');
/*!40000 ALTER TABLE `policy` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_policy_insert` AFTER INSERT ON `policy` FOR EACH ROW BEGIN
    DECLARE v_notification_id VARCHAR(50);
    DECLARE v_customer_id VARCHAR(50);
    
    SELECT customer_id INTO v_customer_id 
    FROM customer_policy 
    WHERE policy_id = NEW.policy_id 
    LIMIT 1;
    
    SET v_notification_id = CONCAT('NOTIF_', NEW.policy_id, '_PAYMENT');
    
    INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
    VALUES (v_notification_id, DATE_ADD(NEW.start_date, INTERVAL -7 DAY), 'PENDING',
            CONCAT('Payment reminder for policy ', NEW.policy_id, '. Premium amount: Rs.', NEW.premium_amount),
            'PAYMENT_REMINDER', v_customer_id);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `policy_renewal_reminder` AFTER INSERT ON `policy` FOR EACH ROW BEGIN
    DECLARE v_notification_id VARCHAR(50);
    DECLARE v_customer_id VARCHAR(50);
    
    SELECT customer_id INTO v_customer_id 
    FROM customer_policy 
    WHERE policy_id = NEW.policy_id 
    LIMIT 1;
    
    SET v_notification_id = CONCAT('NOTIF_', NEW.policy_id, '_RENEWAL');
    
    INSERT INTO reminder (notification_id, notification_date, status, message, type, customer_id)
    VALUES (v_notification_id, DATE_SUB(NEW.end_date, INTERVAL 30 DAY), 'PENDING',
            CONCAT('Policy ', NEW.policy_id, ' expires on ', NEW.end_date, '. Please renew to continue coverage.'),
            'RENEWAL_REMINDER', v_customer_id);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_policy_insert_assign_agent` AFTER INSERT ON `policy` FOR EACH ROW BEGIN
    DECLARE new_agent_policy_id VARCHAR(50);
    
    SET new_agent_policy_id = CONCAT('AP_', NEW.policy_id);
    
    INSERT INTO agent_policy (id, policy_id, agent_id) 
    VALUES (new_agent_policy_id, NEW.policy_id, 'AGT001');
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `reminder`
--

DROP TABLE IF EXISTS `reminder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder` (
  `notification_id` varchar(50) NOT NULL,
  `notification_date` timestamp NULL DEFAULT NULL,
  `status` enum('PENDING','SENT','FAILED') DEFAULT 'PENDING',
  `sent_timestamp` timestamp NULL DEFAULT NULL,
  `message` text,
  `type` varchar(50) DEFAULT NULL,
  `admin_id` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `admin_id` (`admin_id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_reminder_status_date` (`status`,`notification_date`),
  CONSTRAINT `reminder_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `administrator` (`admin_id`),
  CONSTRAINT `reminder_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder`
--

LOCK TABLES `reminder` WRITE;
/*!40000 ALTER TABLE `reminder` DISABLE KEYS */;
INSERT INTO `reminder` VALUES ('NOTIF_CLM_1761213442232_STATUS','2025-11-07 11:40:40','PENDING',NULL,'Your claim CLM_1761213442232 status has been updated to: APPROVED','CLAIM_UPDATE',NULL,'CUST_1761038061124'),('NOTIF_CLM_1762665971112_STATUS','2025-11-09 05:50:58','PENDING',NULL,'Your claim CLM_1762665971112 status has been updated to: APPROVED','CLAIM_UPDATE',NULL,'CUST_1761038061124'),('NOTIF_CLM_1762667111575_STATUS','2025-11-09 05:50:59','PENDING',NULL,'Your claim CLM_1762667111575 status has been updated to: APPROVED','CLAIM_UPDATE',NULL,'CUST_1761038061124'),('NOTIF_CLM_1762670090888_STATUS','2025-11-09 06:35:11','PENDING',NULL,'Your claim CLM_1762670090888 status has been updated to: APPROVED','CLAIM_UPDATE',NULL,'CUST_1761038061124'),('NOTIF_CLM_1762674847953_STATUS','2025-11-09 07:55:31','PENDING',NULL,'Your claim CLM_1762674847953 status has been updated to: APPROVED','CLAIM_UPDATE',NULL,'CUST_1762673734968'),('NOTIF_POL_BUY_1762662764443_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762662764443. Premium amount: Rs.50000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762662764443_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665108394_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762665108394. Premium amount: Rs.25000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665108394_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665128583_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762665128583. Premium amount: Rs.50000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665128583_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665929841_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762665929841. Premium amount: Rs.12000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762665929841_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762666091336_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762666091336. Premium amount: Rs.25000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762666091336_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762674586386_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762674586386. Premium amount: Rs.25000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762674586386_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762675442912_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762675442912. Premium amount: Rs.25000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762675442912_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762681573778_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_BUY_1762681573778. Premium amount: Rs.25000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_BUY_1762681573778_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_TEST_WORKFLOW_1762667801290_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_TEST_WORKFLOW_1762667801290. Premium amount: Rs.15000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_TEST_WORKFLOW_1762667801290_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL),('NOTIF_POL_TEST_WORKFLOW_1762667844093_PAYMENT',NULL,'PENDING',NULL,'Payment reminder for policy POL_TEST_WORKFLOW_1762667844093. Premium amount: Rs.15000.00','PAYMENT_REMINDER',NULL,NULL),('NOTIF_POL_TEST_WORKFLOW_1762667844093_RENEWAL',NULL,'PENDING',NULL,NULL,'RENEWAL_REMINDER',NULL,NULL);
/*!40000 ALTER TABLE `reminder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_steps`
--

DROP TABLE IF EXISTS `workflow_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_steps` (
  `step_id` varchar(50) NOT NULL,
  `workflow_id` varchar(50) NOT NULL,
  `step_order` int NOT NULL,
  `step_name` varchar(100) DEFAULT NULL,
  `task_type` enum('MANUAL','API','RULE') DEFAULT NULL,
  `configuration` json DEFAULT NULL,
  `due_date` datetime DEFAULT ((now() + interval 3 day)),
  `assigned_role` varchar(50) DEFAULT 'Unassigned',
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `workflow_id_step_order` (`workflow_id`,`step_order`),
  CONSTRAINT `workflow_steps_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_steps`
--

LOCK TABLES `workflow_steps` WRITE;
/*!40000 ALTER TABLE `workflow_steps` DISABLE KEYS */;
INSERT INTO `workflow_steps` VALUES ('STEP_V1_1','CLAIM_APPROVAL_V1',1,'Assign Claim','RULE','{\"ruleName\": \"assignByAmount\", \"threshold\": 500, \"targetAdminId\": \"ADM002\"}','2025-11-10 11:21:02','Unassigned'),('STEP_V1_2','CLAIM_APPROVAL_V1',2,'Manual Review','MANUAL','{\"assignedRole\": \"Junior Adjuster\"}','2025-11-10 11:21:02','Unassigned'),('STEP_V1_3','CLAIM_APPROVAL_V1',3,'Notify Customer','API','{\"task\": \"sendNotification\", \"template\": \"claimApproved\"}','2025-11-10 11:21:02','Unassigned');
/*!40000 ALTER TABLE `workflow_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `workflow_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `definition_json` text COMMENT 'Stores the JSON definition from the visual workflow designer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
INSERT INTO `workflows` VALUES ('CLAIM_APPROVAL_V1','Standard Claim Approval','Initial workflow for claims under $500','{\"nodes\":[{\"id\":\"1\",\"type\":\"input\",\"data\":{\"label\":\"Start\"},\"position\":{\"x\":250,\"y\":5},\"width\":150,\"height\":37,\"selected\":false,\"dragging\":false},{\"id\":\"node_2\",\"type\":\"rule\",\"data\":{\"label\":\"New Rule\"},\"position\":{\"x\":391.17295561604624,\"y\":-108.80352848720037},\"width\":181,\"height\":59,\"selected\":false,\"positionAbsolute\":{\"x\":391.17295561604624,\"y\":-108.80352848720037},\"dragging\":false},{\"id\":\"node_3\",\"type\":\"manual\",\"data\":{\"label\":\"New Manual Task\"},\"position\":{\"x\":511.1711946048981,\"y\":106.76278182944378},\"width\":181,\"height\":59,\"selected\":false,\"positionAbsolute\":{\"x\":511.1711946048981,\"y\":106.76278182944378},\"dragging\":false}],\"edges\":[{\"source\":\"node_2\",\"sourceHandle\":null,\"target\":\"node_3\",\"targetHandle\":null,\"id\":\"reactflow__edge-node_2-node_3\"}]}','2025-11-07 11:21:02','2025-11-07 11:39:59');
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'insurance_db_dev'
--

--
-- Dumping routines for database 'insurance_db_dev'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-10  9:46:34
