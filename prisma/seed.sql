-- Seed script for Arhatiya Portal
-- Run with: npx prisma db execute --file prisma/seed.sql

-- Default admin user (password: admin123)
INSERT OR IGNORE INTO User (id, name, email, password, role, firmName, mandiName, address, mobile, createdAt, updatedAt)
VALUES (
  'clseed001',
  'Arhatiya Admin',
  'admin@arhatiya.com',
  '$2b$10$lOjYI7V42lXEOgej7naaVOynqXVseRhkIplC8G3dCw6XG2Kb26U/C',
  'ADMIN',
  'Ram Lal & Sons',
  'Karnal Mandi',
  'Shop No. 12, Grain Market, Karnal, Haryana',
  '9812345678',
  datetime('now'),
  datetime('now')
);

-- Default settings
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set001', 'commission_rate', '2.5');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set002', 'market_fee_rate', '2');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set003', 'rdf_rate', '2');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set004', 'labour_rate', '30');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set005', 'current_season', 'Rabi 2025-26');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set006', 'firm_name', 'Ram Lal & Sons');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set007', 'mandi_name', 'Karnal Mandi');
INSERT OR IGNORE INTO Settings (id, key, value) VALUES ('set008', 'mandi_code', 'KNL');

-- Sample farmers
INSERT OR IGNORE INTO Farmer (id, name, village, tehsil, mobile, isActive, createdAt, updatedAt)
VALUES ('farm001', 'Ramesh Kumar', 'Nilokheri', 'Nilokheri', '9812111111', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Farmer (id, name, village, tehsil, mobile, isActive, createdAt, updatedAt)
VALUES ('farm002', 'Suresh Singh', 'Gharaunda', 'Gharaunda', '9812222222', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Farmer (id, name, village, tehsil, mobile, isActive, createdAt, updatedAt)
VALUES ('farm003', 'Mahesh Yadav', 'Taraori', 'Karnal', '9812333333', 1, datetime('now'), datetime('now'));

-- Sample traders
INSERT OR IGNORE INTO Trader (id, name, firmName, mobile, licenseNo, isActive, createdAt, updatedAt)
VALUES ('trad001', 'Vijay Bansal', 'Vijay Rice Mills', '9812444444', 'HAR/KNL/001', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Trader (id, name, firmName, mobile, licenseNo, isActive, createdAt, updatedAt)
VALUES ('trad002', 'Anil Gupta', 'Gupta Flour Mill', '9812555555', 'HAR/KNL/002', 1, datetime('now'), datetime('now'));
