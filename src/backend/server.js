import express from 'express';
import os from 'os';
import { exec } from 'child_process';
import cors from 'cors';
import axios from 'axios';
import https from 'https'; // Import the HTTPS module

import { createProxyMiddleware } from 'http-proxy-middleware';

// const proxy = httpProxy.createProxyServer({});

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

// Function to fetch the printer's name from its web interface
async function fetchPrinterNameFromWeb(ip) {
    try {
        // Create an HTTPS agent that ignores SSL certificate validation
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false, // Disable SSL certificate validation
        });

        const response = await axios.get(`http://${ip}`, { httpsAgent });
        // Send HTTP GET request to the printer's IP
        const html = response.data;

        // List of tags to try for extracting the printer's name
        const tagsToMatch = ['h1', 'strong'];

        for (const tag of tagsToMatch) {
            const regex = new RegExp(`<${tag}(\\s[^>]*)?>(.*?)</${tag}>`, 'i'); // Create a regex for the current tag
            const match = html.match(regex);

            if (match && match[2] && match[2].toLowerCase().startsWith('hp')) {
                return match[2]; // Return the first valid match that does not start with "HP"
            }
        }

        return `Printer at ${ip}`; // Fallback if no valid name is found
    } catch (error) {
        // console.error(`Error fetching printer name from ${ip}:`, error.message);
        return `Printer at ${ip}`; // Fallback in case of an error
    }
}

// Endpoint to get all printers on the LAN
app.get('/api/printers', async (req, res) => {
    const printers = [];
    //   const subnet = '172.27.195'
    const subnet = '172.27.196'; // Replace with your subnet
    let completed = 0;

    for (let i = 1; i <= 254; i++) {
        const ip = `${subnet}.${i}`;
        exec(`ping -n 1 -w 100 ${ip}`, async (error, stdout) => {
            if (!error && stdout.includes('Reply from')) {
                const name = await fetchPrinterNameFromWeb(ip); // Fetch the printer's name from the web interface
                printers.push({
                    id: printers.length + 1,
                    name,
                    ip,
                    status: 'Online',
                });
            }

            completed++;

            // Send response when all IPs are scanned
            if (completed === 254) {
                res.json(printers);
            }
        });
    }
});
// Disable X-Frame-Options for all routes
app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    next();
});
app.use('/proxy/:ip', (req, res, next) => {

    const targetIP = req.params.ip;
    if (!targetIP) return res.status(400).send('IP required');

    const proxyMiddleware = createProxyMiddleware({
        target: `http://${targetIP}`,
        changeOrigin: true,
        secure: false,
        selfHandleResponse: false,
        pathRewrite: {
            [`^/proxy/${targetIP}`]: '', // Remove the proxy prefix
        },
        onProxyRes(proxyRes, req, res) {
            // Remove X-Frame-Options to allow iframe embedding (if needed)
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['frame-options'];
            proxyRes.headers['x-frame-options'] = 'ALLOW-FROM *';
        },
        onError(err, req, res) {
            res.status(500).send('Proxy error: ' + err.message);
        },
        // agent: new https.Agent({ rejectUnauthorized: false })
    });

    return proxyMiddleware(req, res, next);
});


app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});