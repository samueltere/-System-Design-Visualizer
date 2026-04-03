import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Pool Initialization
let pool: any = null;

async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl || dbUrl === 'MY_DATABASE_URL' || dbUrl.includes('placeholder')) {
    console.warn('DATABASE_URL is not configured or is a placeholder. PostgreSQL features will be disabled.');
    return;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000, // Fail fast if connection is bad
    });

    // Test connection
    await pool.query('SELECT NOW()');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        nodes JSONB NOT NULL DEFAULT '[]',
        edges JSONB NOT NULL DEFAULT '[]',
        owner_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL database initialized');
  } catch (err) {
    console.error('Failed to initialize database (PostgreSQL disabled):', err instanceof Error ? err.message : err);
    pool = null; // Disable pool if initialization fails
  }
}

export const app = express();
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// POST /api/design → save nodes and edges
app.post('/api/design', async (req, res) => {
  const { name, nodes, edges, ownerId, id } = req.body;

  if (!pool) {
    return res.status(503).json({ error: 'Database not configured or initialization failed' });
  }

  try {
    const query = `
      INSERT INTO designs (id, name, nodes, edges, owner_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          nodes = EXCLUDED.nodes,
          edges = EXCLUDED.edges,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [id || undefined, name, JSON.stringify(nodes), JSON.stringify(edges), ownerId];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving design:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/design/:id → retrieve saved design
app.get('/api/design/:id', async (req, res) => {
  const { id } = req.params;

  if (!pool) {
    return res.status(503).json({ error: 'Database not configured or initialization failed' });
  }

  try {
    const result = await pool.query('SELECT * FROM designs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving design:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  await initDb();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Simulation state
  const simulations = new Map<string, { interval: NodeJS.Timeout, config: any }>();

  // Real-time collaboration logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-diagram', (diagramId) => {
      socket.join(diagramId);
      console.log(`User ${socket.id} joined diagram ${diagramId}`);
    });

    socket.on('diagram-update', ({ diagramId, nodes, edges }) => {
      socket.to(diagramId).emit('diagram-remote-update', { nodes, edges });
    });

    socket.on('start-simulation', ({ diagramId, nodes, edges, config }) => {
      if (simulations.has(diagramId)) {
        clearInterval(simulations.get(diagramId)!.interval);
      }

      console.log(`Starting simulation for ${diagramId} with config:`, config);
      
      const nodeStats = new Map<string, { throughput: number, activeRequests: number, totalLatency: number, completedRequests: number }>();
      
      // Initialize stats for all nodes
      nodes.forEach((node: any) => {
        nodeStats.set(node.id, { throughput: 0, activeRequests: 0, totalLatency: 0, completedRequests: 0 });
      });

      const interval = setInterval(() => {
        // Emit metrics every second
        const metrics: any = {};
        nodeStats.forEach((stats, nodeId) => {
          metrics[nodeId] = {
            throughput: stats.throughput,
            avgLatency: stats.completedRequests > 0 ? stats.totalLatency / stats.completedRequests : 0,
            load: stats.throughput / (config.capacity || 5), // Default capacity of 5 req/sec
          };
          // Reset throughput for next second
          stats.throughput = 0;
        });
        io.to(diagramId).emit('performance-metrics', metrics);

        // Find entry points (Client nodes)
        const entryNodes = nodes.filter((n: any) => n.type === 'client');
        if (entryNodes.length === 0) return;

        // For each entry node, start a "request"
        entryNodes.forEach((startNode: any) => {
          const flow = (currentNodeId: string, startTime: number) => {
            const stats = nodeStats.get(currentNodeId);
            if (stats) {
              stats.throughput++;
              stats.activeRequests++;
            }

            const outgoingEdges = edges.filter((e: any) => e.source === currentNodeId);
            
            if (outgoingEdges.length === 0) {
              // End of flow
              if (stats) {
                stats.activeRequests--;
                stats.completedRequests++;
                stats.totalLatency += Date.now() - startTime;
              }
              return;
            }

            outgoingEdges.forEach((edge: any) => {
              // Emit flow event to the room
              io.to(diagramId).emit('request-flow', { edgeId: edge.id, nodeId: edge.target });
              
              // Simulate latency and continue flow
              setTimeout(() => {
                if (stats) {
                  stats.activeRequests--;
                  stats.completedRequests++;
                  stats.totalLatency += Date.now() - startTime;
                }
                flow(edge.target, Date.now());
              }, config.latency || 500);
            });
          };

          flow(startNode.id, Date.now());
        });
      }, 1000 / (config.rps || 1));

      simulations.set(diagramId, { interval, config });
      io.to(diagramId).emit('simulation-status', { running: true, config });
    });

    socket.on('stop-simulation', (diagramId) => {
      if (simulations.has(diagramId)) {
        clearInterval(simulations.get(diagramId)!.interval);
        simulations.delete(diagramId);
        console.log(`Stopped simulation for ${diagramId}`);
      }
      io.to(diagramId).emit('simulation-status', { running: false });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV !== 'test') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
