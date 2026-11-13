const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const app = express();

// 1. ሰርቨሩን አንድ ጊዜ ብቻ እዚህ ጋር እንፈጥራለን
const server = http.createServer(app);

// 2. Socket.io ውቅር
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST", "PUT"]
    }
});

app.use(cors());
app.use(express.json());
// 3. የ'io' መቆጣጠሪያውን ለRoutes ማስተላለፍ
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use('/api/ai',aiRoutes);


app.use('/api/tasks', taskRoutes);

// 4. የሪል-ታይም ግንኙነት ክስተት
io.on('connection', (socket) => {
    console.log('አንድ ተጠቃሚ በሪል-ታይም ተገናኝቷል! ID:', socket.id);

    socket.on('disconnect', () => {
        console.log('ተጠቃሚ ተለይቷል።');
    });
});

// 5. ሰርቨሩን በፖርት 5000 ማስነሳት
server.listen(process.env.PORT || 5000, () => {
    console.log(`ሰርቨር በፖርት 5000 ላይ በሪል-ታይም መነሳት ችሏል!`);
});
