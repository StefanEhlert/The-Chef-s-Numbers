"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const router = (0, express_1.Router)();
function getTempPool() {
    return new pg_1.Pool({
        host: process.env['DB_HOST'] || '192.168.1.7',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: process.env['DB_NAME'] || 'chef_numbers',
        user: process.env['DB_USER'] || 'chef',
        password: process.env['DB_PASSWORD'] || 'password',
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
}
router.get('/', async (_req, res) => {
    try {
        console.log('🔍 Lade alle Lieferanten aus der Datenbank...');
        const pool = getTempPool();
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM suppliers ORDER BY created_at DESC');
        console.log(`✅ ${result.rows.length} Lieferanten aus der Datenbank geladen`);
        const convertedSuppliers = result.rows.map(dbSupplier => ({
            id: dbSupplier.id,
            name: dbSupplier.name,
            contactPerson: dbSupplier.contact_person,
            email: dbSupplier.email,
            phone: dbSupplier.phone,
            address: dbSupplier.address,
            createdAt: dbSupplier.created_at,
            updatedAt: dbSupplier.updated_at
        }));
        client.release();
        await pool.end();
        res.json({
            success: true,
            data: convertedSuppliers,
            count: convertedSuppliers.length
        });
    }
    catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suppliers',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, contact_person, email, phone, address } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Name is required'
            });
            return;
        }
        const pool = getTempPool();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        INSERT INTO suppliers (name, contact_person, email, phone, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, contact_person, email, phone, address]);
            console.log('✅ Lieferant erfolgreich erstellt:', result.rows[0]);
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Supplier created successfully'
            });
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create supplier',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, email, phone, address } = req.body;
        const pool = getTempPool();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        UPDATE suppliers 
        SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `, [name, contact_person, email, phone, address, id]);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
                return;
            }
            console.log('✅ Lieferant erfolgreich aktualisiert:', result.rows[0]);
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Supplier updated successfully'
            });
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getTempPool();
        const client = await pool.connect();
        try {
            const result = await client.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
                return;
            }
            console.log('✅ Lieferant erfolgreich gelöscht:', result.rows[0]);
            res.json({
                success: true,
                message: 'Supplier deleted successfully',
                data: result.rows[0]
            });
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete supplier',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=suppliers.js.map