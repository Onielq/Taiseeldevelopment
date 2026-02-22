BEGIN TRANSACTION;

CREATE TABLE units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL UNIQUE,
            floor INTEGER NOT NULL,
            type TEXT NOT NULL,
            sqft INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('occupied', 'vacant', 'listed')),
            value INTEGER NOT NULL,
            rent INTEGER NOT NULL,
            last_sold_at TEXT
        );

INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (1, '101', 1, 'Studio', 520, 'occupied', 540000, 1850, '2023-07-03');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (2, '102', 1, '1 Bed', 850, 'occupied', 850000, 2800, '2023-06-15');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (3, '103', 1, '2 Bed', 1180, 'occupied', 1180000, 3800, '2024-01-22');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (4, '104', 1, '2 Bed', 1200, 'vacant', 1200000, 3900, '2024-05-30');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (5, '201', 2, 'Studio', 530, 'occupied', 555000, 1900, '2023-03-14');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (6, '202', 2, '1 Bed', 870, 'occupied', 890000, 2950, '2023-11-21');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (7, '203', 2, '2 Bed', 1200, 'listed', 1220000, 3950, '2025-01-12');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (8, '204', 2, '3 Bed', 1650, 'occupied', 1680000, 5200, '2024-09-05');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (9, '301', 3, '1 Bed', 870, 'occupied', 910000, 3000, '2024-02-18');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (10, '302', 3, '2 Bed', 1200, 'occupied', 1240000, 4000, '2023-08-09');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (11, '303', 3, '3 Bed', 1670, 'occupied', 1720000, 5350, '2024-10-10');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (12, '304', 3, '2 Bed', 1190, 'occupied', 1230000, 3980, '2023-12-01');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (13, '401', 4, '1 Bed', 875, 'occupied', 930000, 3100, '2025-02-03');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (14, '402', 4, '2 Bed', 1210, 'occupied', 1260000, 4100, '2024-11-18');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (15, '403', 4, '3 Bed', 1680, 'vacant', 1750000, 5500, '2025-01-25');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (16, '404', 4, '2 Bed', 1195, 'occupied', 1250000, 4050, '2024-03-28');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (17, '501', 5, '2 Bed', 1400, 'occupied', 1480000, 4600, '2025-02-02');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (18, '502', 5, 'Penthouse', 2200, 'occupied', 2400000, 7200, '2024-12-15');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (19, '601', 6, 'Penthouse', 2400, 'occupied', 2700000, 7800, '2025-01-17');
INSERT INTO units (id, unit_code, floor, type, sqft, status, value, rent, last_sold_at) VALUES (20, '602', 6, 'Penthouse', 2350, 'occupied', 2640000, 7580, '2024-08-29');

CREATE TABLE valuation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE,
            total_value INTEGER NOT NULL,
            rent_roll INTEGER NOT NULL,
            per_unit_avg INTEGER NOT NULL
        );

INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (1, '2019', 11900000, 41000, 598000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (2, '2020', 12300000, 39800, 614000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (3, '2021', 15800000, 46000, 790000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (4, '2022', 18400000, 53500, 920000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (5, '2023', 20100000, 57800, 1005000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (6, '2024', 22200000, 62100, 1110000);
INSERT INTO valuation_history (id, label, total_value, rent_roll, per_unit_avg) VALUES (7, '2025', 24120000, 67320, 1206000);

COMMIT;
