# 1. User Table

```sql
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```


# 2. User Info Table

```sql
CREATE TABLE User_Info (
    user_id INT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);
```



# 3. Vehicle Table

```sql
CREATE TABLE Vehicle (
    vehicle_number VARCHAR(50) PRIMARY KEY,
    vehicle_type VARCHAR(50),
    vehicle_year INT,
    user_id INT,
    total_fines DECIMAL(10, 2) DEFAULT 0.00,
    coordinates VARCHAR(255),  -- Can be formatted as "lat,long"
    travelling_history TEXT,   -- Store major travelling points or reference to a history table
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);
```



# 4. Transaction Table

```sql
CREATE TABLE Transaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    vehicle_number VARCHAR(50),
    payment_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (vehicle_number) REFERENCES Vehicle(vehicle_number)
);
```



# 5. Notification Table

```sql
CREATE TABLE Notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    challan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    challan_reason TEXT,
    total_amount DECIMAL(10, 2),
    toll_charge DECIMAL(10, 2),
    pending BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);
```



# 6. Travelling History Table

```sql
CREATE TABLE Travelling_History (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(50),
    city_coordinates VARCHAR(255),
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_number) REFERENCES Vehicle(vehicle_number)
);
```