"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const articles_1 = __importDefault(require("./routes/articles"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const images_1 = __importDefault(require("./routes/images"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const postgres_1 = __importDefault(require("./routes/postgres"));
const minio_1 = __importDefault(require("./routes/minio"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
dotenv_1.default.config({ path: '.env' });
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['NODE_ENV'] === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/', (_req, res) => {
    res.status(200).json({
        message: 'The Chef\'s Numbers Backend API',
        version: '1.0.0',
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            postgres: '/api/postgres-health',
            api: '/api/v1'
        }
    });
});
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/articles', articles_1.default);
app.use('/api/v1/recipes', recipes_1.default);
app.use('/api/v1/images', images_1.default);
app.use('/api/v1/suppliers', suppliers_1.default);
app.use('/api', postgres_1.default);
app.use('/api/minio', minio_1.default);
app.use('/api/images', images_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        app.listen(parseInt(PORT.toString()), '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
            console.log(`💡 Database connections will be established dynamically via API calls`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map