# Tool for diagram -> https://app.diagrams.net/?src=about

# 1. User Table

```sql
CREATE TABLE User_Log_In (
    user_id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    login_ip_address VARCHAR(50)
);
```


# 2. User Info Table

```sql
CREATE TABLE User_Information (
    user_id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_mobileno VARCHAR(15),
    user_profile VARCHAR(255),
    user_dob DATE,
    user_age INT,
    user_address VARCHAR(255),
    user_gender CHAR(1),
    user_vehicle_count INT,
    -- For sub table reference
    user_vehicle TEXT,
    FOREIGN KEY (user_id) REFERENCES User_Log_In(user_id)
);
```



# 3. Vehicle Table

```sql
CREATE TABLE Vehicle_Details (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    vehicle_name VARCHAR(255),
    vehicle_type VARCHAR(255),
    vehicle_model VARCHAR(255),
    vehicle_build_year INT,
    vehicle_total_distance DOUBLE,
    vehicle_travelling_history TEXT,
    vehicle_lat DOUBLE,
    vehicle_lon DOUBLE,
    FOREIGN KEY (user_id) REFERENCES User_Information(user_id)
);
```


# 4. Travelling History Table

```sql
CREATE TABLE Vehicle_Location_History (
    location_date DATE,
    vehicle_id VARCHAR(50),
    user_id VARCHAR(50),
    location_lat DOUBLE,
    location_lon DOUBLE,
    PRIMARY KEY (vehicle_id, location_date),
    FOREIGN KEY (user_id) REFERENCES User_Information(user_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle_Details(vehicle_id)
);
```


# 5. Notification Table

```sql
CREATE TABLE Notification (
    user_id VARCHAR(50),
    charge_amount DOUBLE,
    reason_for_charge VARCHAR(255),
    charge_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    charge_pending BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES User_Information(user_id)
);
```


# 6. Transaction Table

```sql
CREATE TABLE Transaction_Table (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50),
    vehicle_id VARCHAR(50),
    payment_date DATE,
    payment_amount DOUBLE,
    FOREIGN KEY (user_id) REFERENCES User_Information(user_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle_Details(vehicle_id)
);
```