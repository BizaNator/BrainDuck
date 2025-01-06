-- Migration: initial_schema
-- Version: 001

-- Create users table with FiveM identifiers
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    identifier VARCHAR(50) NOT NULL UNIQUE,
    license VARCHAR(50),
    steam VARCHAR(50),
    discord VARCHAR(50),
    fivem VARCHAR(50),
    name VARCHAR(50),
    group VARCHAR(50) DEFAULT 'user',
    inventory TEXT,
    position JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    weight INTEGER DEFAULT 0,
    rare INTEGER DEFAULT 0,
    can_remove BOOLEAN DEFAULT TRUE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY,
    owner VARCHAR(50),
    plate VARCHAR(12) NOT NULL UNIQUE,
    model VARCHAR(50) NOT NULL,
    type VARCHAR(20),
    stored BOOLEAN DEFAULT TRUE,
    garage VARCHAR(50),
    position JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner) REFERENCES users(identifier)
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY,
    owner_type VARCHAR(20) NOT NULL,
    owner_id VARCHAR(50) NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    slot INTEGER,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_identifier ON users(identifier);
CREATE INDEX idx_users_license ON users(license);
CREATE INDEX idx_users_steam ON users(steam);
CREATE INDEX idx_vehicles_owner ON vehicles(owner);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_inventory_owner ON inventory(owner_type, owner_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);

-- Insert default admin group
INSERT INTO users (identifier, name, group) 
VALUES ('license:administrator', 'System Admin', 'admin')
ON CONFLICT (identifier) DO NOTHING;
