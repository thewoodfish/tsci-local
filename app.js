// Copyright (c) 2025 Algorealm, Inc.

// Imports
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const express = require('express');
const fs = require('fs');
const util = require('util');
const app = express();
const bodyParser = require('body-parser');
const mm = require('music-metadata');

const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
const port = 4000;
const cors = require("cors");

// Static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/img', express.static(__dirname + 'public/img'));

// Set views
app.set('views', './views');
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


app.get('/', (req, res) => {
    res.render('index', { text: 'This is sparta' });
});

app.post('/get-data', (req, res) => {
    let fsData = scanDirectory(req.body.data)
        .then(data => {
            res.send({
                data
            });
        }).catch(err => {
            console.error('Error scanning directory:', err);
        });

});

// Define audio file extensions
const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];

async function scanDirectory(directory) {
    const entries = await readdir(directory);
    const results = [];

    for (const entry of entries) {
        if (entry.startsWith('.')) continue; // skip hidden files

        const fullPath = path.join(directory, entry);
        const stats = await stat(fullPath);

        const isFolder = stats.isDirectory();
        const ext = path.extname(entry).toLowerCase();

        const fileInfo = {
            name: entry,
            type: isFolder ? 'folder' : (audioExtensions.includes(ext) ? 'audio' : 'other'),
            size: isFolder ? null : formatBytes(stats.size),
            modified: stats.mtime.toISOString().replace('T', ' ').split('.')[0],
            path: fullPath,
            image: null // default
        };

        if (fileInfo.type === 'audio') {
            try {
                const metadata = await mm.parseFile(fullPath);
                const picture = metadata.common.picture?.[0];

                if (picture) {
                    const buffer = Buffer.from(picture.data); // Convert from Uint8Array or number[]
                    const base64 = buffer.toString('base64');
                    console
                    const imageMime = picture.format || 'image/jpeg';
                    const dataUrl = `data:${imageMime};base64,${base64}`;
                    fileInfo.image = dataUrl;
                }
            } catch (err) {
                console.warn(`Could not read metadata for ${entry}:`, err.message);
            }
        }

        if (fileInfo.type === 'folder' || fileInfo.type === 'audio') {
            if (fileInfo.name.indexOf("."))
                results.push(fileInfo);
        }
    }

    return results;
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// listen on port 3000
app.listen(port, '0.0.0.0', () => console.info(`Listening on port ${port}`));
