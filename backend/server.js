const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- DATABASE INITIALIZATION ---
let db;
try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'temple_receipts.db');
    db = new Database(dbPath);
    console.log('Connected to SQLite database at:', dbPath);
} catch (err) {
    console.warn('better-sqlite3 fallback to file-based JSON DB handler:', err.message);
    // Simple file-based fallback if native sqlite3 build is pending
    db = createFallbackDb();
}

function initDb(database) {
    if (database.exec) {
        database.exec(`
            CREATE TABLE IF NOT EXISTS receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_no TEXT UNIQUE NOT NULL,
                deity TEXT,
                pooja TEXT,
                offering_date TEXT,
                booking_date TEXT,
                grand_total REAL,
                line_items_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

function createFallbackDb() {
    let dbFile = path.join(__dirname, 'receipts_db.json');
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isServerless) {
        dbFile = path.join('/tmp', 'receipts_db.json');
    }

    let data = { receipts: [], lastId: 0 };
    
    // Check /tmp or local file
    if (fs.existsSync(dbFile)) {
        try {
            data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        } catch (e) {}
    } else if (fs.existsSync(path.join(__dirname, 'receipts_db.json'))) {
        try {
            data = JSON.parse(fs.readFileSync(path.join(__dirname, 'receipts_db.json'), 'utf8'));
        } catch (e) {}
    }

    function save() {
        try {
            fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
        } catch (err) {
            console.warn("Serverless DB write notice:", err.message);
        }
    }

    return {
        isFallback: true,
        prepare: function () {
            return {
                run: function (...args) {
                    return {};
                }
            };
        },
        createReceipt: function (receiptObj) {
            data.lastId++;
            const id = data.lastId;
            const year = new Date().getFullYear();
            const receipt_no = `REC-${year}-${String(id).padStart(4, '0')}`;
            const newRecord = {
                id,
                receipt_no,
                ...receiptObj,
                created_at: new Date().toISOString()
            };
            data.receipts.unshift(newRecord);
            save();
            return newRecord;
        },
        getReceipts: function (query = {}) {
            let list = [...data.receipts];
            if (query.search) {
                const s = query.search.toLowerCase();
                list = list.filter(r =>
                    (r.receipt_no && r.receipt_no.toLowerCase().includes(s)) ||
                    (r.deity && r.deity.toLowerCase().includes(s)) ||
                    (r.pooja && r.pooja.toLowerCase().includes(s)) ||
                    (r.line_items_json && r.line_items_json.toLowerCase().includes(s))
                );
            }
            if (query.pooja) {
                const p = query.pooja.toLowerCase();
                list = list.filter(r => (r.pooja && r.pooja.toLowerCase().includes(p)) || (r.line_items_json && r.line_items_json.toLowerCase().includes(p)));
            }
            if (query.date) {
                const d = query.date;
                const parts = d.split('-');
                const ddmmyyyy = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
                list = list.filter(r => r.booking_date === d || r.booking_date === ddmmyyyy || r.offering_date === d || r.offering_date === ddmmyyyy || (r.created_at && r.created_at.startsWith(d)));
            }
            if (query.sort === 'ASC') {
                list.sort((a, b) => a.id - b.id);
            } else {
                list.sort((a, b) => b.id - a.id);
            }
            return list;
        },
        getReceiptById: function (idOrNo) {
            return data.receipts.find(r => r.id == idOrNo || r.receipt_no === idOrNo);
        },
        getSummary: function (dateStr) {
            const today = dateStr || new Date().toISOString().split('T')[0];
            const list = data.receipts.filter(r => r.booking_date === today || (r.created_at && r.created_at.startsWith(today)));
            const totalAmount = list.reduce((sum, r) => sum + (parseFloat(r.grand_total) || 0), 0);
            return {
                date: today,
                total_receipts: list.length,
                total_amount: totalAmount
            };
        },
        deleteReceipt: function (id) {
            const idx = data.receipts.findIndex(r => r.id == id || r.receipt_no === id);
            if (idx !== -1) {
                const deleted = data.receipts.splice(idx, 1)[0];
                save();
                return deleted;
            }
            return null;
        },
        deleteAllReceipts: function () {
            data.receipts = [];
            data.lastId = 0;
            save();
            return true;
        }
    };
}

if (!db.isFallback) {
    initDb(db);
}

// --- CLOUD DATABASE (SUPABASE / POSTGRES) SUPPORT ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const isCloudDb = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (isCloudDb) {
    console.log('Online Cloud Database Active (Supabase):', SUPABASE_URL);
}

// --- API ENDPOINTS ---

// 1. Create & Save New Receipt
app.post('/api/receipts', async (req, res) => {
    try {
        const { deity, pooja, offering_date, booking_date, grand_total, line_items } = req.body;

        const lineItemsJson = JSON.stringify(line_items || []);
        const todayStr = booking_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

        if (isCloudDb) {
            const countRes = await fetch(`${SUPABASE_URL}/rest/v1/receipts?select=id`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const countData = await countRes.json();
            const totalCount = Array.isArray(countData) ? countData.length : 0;
            const year = new Date().getFullYear();
            const receiptNo = `REC-${year}-${String(totalCount + 1).padStart(4, '0')}`;

            const payload = {
                receipt_no: receiptNo,
                deity: deity || '',
                pooja: pooja || '',
                offering_date: offering_date || '',
                booking_date: todayStr,
                grand_total: parseFloat(grand_total) || 0,
                line_items_json: lineItemsJson,
                created_at: new Date().toISOString()
            };

            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/receipts`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });
            const insertedData = await insertRes.json();
            return res.json({ success: true, receipt: Array.isArray(insertedData) ? insertedData[0] : payload });
        }

        if (db.isFallback) {
            const saved = db.createReceipt({
                deity: deity || '',
                pooja: pooja || '',
                offering_date: offering_date || '',
                booking_date: todayStr,
                grand_total: parseFloat(grand_total) || 0,
                line_items_json: lineItemsJson
            });
            return res.json({ success: true, receipt: saved });
        }

        // SQLite Implementation
        const year = new Date().getFullYear();
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM receipts');
        const countRow = countStmt.get();
        const nextSeq = (countRow.count || 0) + 1;
        const receiptNo = `REC-${year}-${String(nextSeq).padStart(4, '0')}`;

        const insertStmt = db.prepare(`
            INSERT INTO receipts (receipt_no, deity, pooja, offering_date, booking_date, grand_total, line_items_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertStmt.run(
            receiptNo,
            deity || '',
            pooja || '',
            offering_date || '',
            todayStr,
            parseFloat(grand_total) || 0,
            lineItemsJson
        );

        const newReceipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, receipt: newReceipt });
    } catch (err) {
        console.error('Error saving receipt:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Fetch All Receipts / Search History
app.get('/api/receipts', async (req, res) => {
    try {
        if (isCloudDb) {
            const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/receipts?select=*&order=id.desc`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const list = await fetchRes.json();
            return res.json({ success: true, receipts: Array.isArray(list) ? list : [] });
        }

        if (db.isFallback) {
            const list = db.getReceipts(req.query);
            return res.json({ success: true, receipts: list });
        }

        const { search, pooja, date, sort } = req.query;
        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(receipt_no LIKE ? OR deity LIKE ? OR pooja LIKE ? OR line_items_json LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (pooja) {
            whereClauses.push('(pooja LIKE ? OR line_items_json LIKE ?)');
            const pTerm = `%${pooja}%`;
            params.push(pTerm, pTerm);
        }

        if (date) {
            whereClauses.push('(booking_date = ? OR offering_date = ? OR created_at LIKE ?)');
            const dTerm = `%${date}%`;
            params.push(date, date, dTerm);
        }

        const orderDir = sort === 'ASC' ? 'ASC' : 'DESC';
        let sql = 'SELECT * FROM receipts';
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        sql += ` ORDER BY id ${orderDir} LIMIT 200`;

        const stmt = db.prepare(sql);
        const receipts = stmt.all(...params);
        res.json({ success: true, receipts });
    } catch (err) {
        console.error('Error fetching receipts:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Get Single Receipt
app.get('/api/receipts/:id', async (req, res) => {
    try {
        if (isCloudDb) {
            const id = req.params.id;
            const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/receipts?or=(id.eq.${id},receipt_no.eq.${id})`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const list = await fetchRes.json();
            if (Array.isArray(list) && list.length > 0) {
                return res.json({ success: true, receipt: list[0] });
            }
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }

        if (db.isFallback) {
            const item = db.getReceiptById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Receipt not found' });
            return res.json({ success: true, receipt: item });
        }

        const stmt = db.prepare('SELECT * FROM receipts WHERE id = ? OR receipt_no = ?');
        const receipt = stmt.get(req.params.id, req.params.id);
        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        res.json({ success: true, receipt });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Daily Summary Analytics
app.get('/api/summary', (req, res) => {
    try {
        if (db.isFallback) {
            return res.json({ success: true, summary: db.getSummary(req.query.date) });
        }

        const dateStr = req.query.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const stmt = db.prepare(`
            SELECT COUNT(*) as total_receipts, COALESCE(SUM(grand_total), 0) as total_amount
            FROM receipts
            WHERE booking_date = ?
        `);
        const summary = stmt.get(dateStr);
        res.json({ success: true, summary: { date: dateStr, ...summary } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Delete Single Receipt by ID
app.delete('/api/receipts/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isCloudDb) {
            await fetch(`${SUPABASE_URL}/rest/v1/receipts?or=(id.eq.${id},receipt_no.eq.${id})`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            return res.json({ success: true });
        }

        if (db.isFallback) {
            const deleted = db.deleteReceipt(id);
            if (deleted) return res.json({ success: true, deleted });
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }

        const stmt = db.prepare('DELETE FROM receipts WHERE id = ? OR receipt_no = ?');
        const info = stmt.run(id, id);
        if (info.changes > 0) {
            return res.json({ success: true });
        }
        res.status(404).json({ success: false, message: 'Receipt not found' });
    } catch (err) {
        console.error('Error deleting receipt:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Clear Entire Receipts History
app.delete('/api/receipts', async (req, res) => {
    try {
        if (isCloudDb) {
            await fetch(`${SUPABASE_URL}/rest/v1/receipts?id=gt.0`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            return res.json({ success: true, message: 'All receipts deleted' });
        }

        if (db.isFallback) {
            db.deleteAllReceipts();
            return res.json({ success: true, message: 'All receipts deleted' });
        }

        db.prepare('DELETE FROM receipts').run();
        res.json({ success: true, message: 'All receipts deleted' });
    } catch (err) {
        console.error('Error clearing history:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Serve Static Frontend Assets
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));
app.use('/assets', express.static(path.join(rootDir, 'assets')));

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` Temple Receipt Backend Server Running!`);
        console.log(` Local URL: http://localhost:${PORT}`);
        console.log(`====================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const altPort = PORT + 1;
            console.log(`Port ${PORT} in use, trying alternate port ${altPort}...`);
            app.listen(altPort, () => {
                console.log(`====================================================`);
                console.log(` Temple Receipt Backend Server Running!`);
                console.log(` Local URL: http://localhost:${altPort}`);
                console.log(`====================================================`);
            });
        } else {
            console.error(err);
        }
    });
}

module.exports = app;
