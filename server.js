const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 설정
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // http에서는 false
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1일
    }
}));

// ★중요★ DB 연결 설정 (비밀번호 확인하세요!)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '~Tsupt1426037',  // 사용자님 비밀번호
    database: 'mytodo'
});

db.connect((err) => {
    if (err) {
        console.error('❌ DB 연결 실패! 비밀번호나 DB이름을 확인하세요.', err);
    } else {
        console.log('✅ MariaDB 연결 성공!');
    }
});

// --- API (로그인, 회원가입) ---

// 회원가입
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword], (err) => {
                if (err) return res.status(400).json({ msg: '이미 있는 아이디입니다.' });
                res.json({ msg: '가입 성공' });
            });
    } catch (e) { res.status(500).json({ error: e }); }
});

// 로그인
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ msg: '없는 아이디입니다.' });
        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.save(err => {
                if (err) return res.status(500).json({ error: 'Session save error' });
                res.json({ msg: '로그인 성공', username: user.username });
            });
        } else {
            res.status(401).json({ msg: '비밀번호 틀림' });
        }
    });
});

// 로그아웃
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ msg: '로그아웃' }));
});

// 세션 확인
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({
            isAuthenticated: true,
            user: { username: req.session.username, id: req.session.userId }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// --- 투두리스트 기능 (CRUD) ---

// 목록 가져오기
app.get('/api/tasks', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: '로그인필요' });
    db.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// 추가하기
app.post('/api/tasks', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: '로그인필요' });
    const { text, category, repetition, priority, emoji, due_date, due_time } = req.body;
    const sql = `INSERT INTO tasks (user_id, text, category, repetition, priority, emoji, due_date, due_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [req.session.userId, text, category, repetition, priority, emoji, due_date, due_time], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, msg: '추가됨' });
    });
});

// 수정/완료 처리
app.put('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: '로그인필요' });
    const { text, category, repetition, priority, emoji, due_date, due_time, completed } = req.body;

    let sql, params;
    if (text === undefined) {
        sql = 'UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?';
        params = [completed, req.params.id, req.session.userId];
    } else {
        sql = `UPDATE tasks SET text=?, category=?, repetition=?, priority=?, emoji=?, due_date=?, due_time=?, completed=? WHERE id=? AND user_id=?`;
        params = [text, category, repetition, priority, emoji, due_date, due_time, completed, req.params.id, req.session.userId];
    }
    db.query(sql, params, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: '수정됨' });
    });
});

// 삭제하기
app.delete('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: '로그인필요' });
    db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId], (err) => {
        res.json({ msg: '삭제됨' });
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});