-- Migration: add_indexes_and_permissions
-- Version: 002

-- Add permission system tables
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_permissions (
    group_name VARCHAR(50) NOT NULL,
    permission_name VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50),
    PRIMARY KEY (group_name, permission_name),
    FOREIGN KEY (permission_name) REFERENCES permissions(name) ON DELETE CASCADE
);

CREATE TABLE user_permissions (
    identifier VARCHAR(50) NOT NULL,
    permission_name VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50),
    expires_at TIMESTAMP,
    PRIMARY KEY (identifier, permission_name),
    FOREIGN KEY (identifier) REFERENCES users(identifier) ON DELETE CASCADE,
    FOREIGN KEY (permission_name) REFERENCES permissions(name) ON DELETE CASCADE
);

-- Add new indexes for better query performance
CREATE INDEX idx_inventory_created ON inventory(created_at);
CREATE INDEX idx_users_group ON users(group);
CREATE INDEX idx_users_banned ON users(banned);
CREATE INDEX idx_vehicles_model ON vehicles(model);

-- Add new columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS playtime INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS character_slots INTEGER DEFAULT 1;

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel FLOAT DEFAULT 100.0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_health FLOAT DEFAULT 1000.0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_health FLOAT DEFAULT 1000.0;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
    ('admin.users', 'Manage users and permissions'),
    ('admin.vehicles', 'Manage vehicles'),
    ('admin.items', 'Manage items and inventory'),
    ('admin.database', 'Access database management UI'),
    ('user.basic', 'Basic user permissions');

-- Grant default permissions to admin group
INSERT INTO group_permissions (group_name, permission_name, granted_by) VALUES
    ('admin', 'admin.users', 'SYSTEM'),
    ('admin', 'admin.vehicles', 'SYSTEM'),
    ('admin', 'admin.items', 'SYSTEM'),
    ('admin', 'admin.database', 'SYSTEM');

-- Grant basic permissions to user group
INSERT INTO group_permissions (group_name, permission_name, granted_by) VALUES
    ('user', 'user.basic', 'SYSTEM');
