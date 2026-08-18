'use strict';

const net = require('node:net');

function clampVolume(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseMpdKeyValue(response) {
  const result = {};

  for (const line of String(response).split(/\r?\n/)) {
    const separator = line.indexOf(': ');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator);
    const value = line.slice(separator + 2);
    result[key] = value;
  }

  return result;
}

class MpdClient {
  constructor(options) {
    this.host = options.host;
    this.port = options.port;
    this.timeoutMs = options.timeoutMs;
  }

  send(commands) {
    const commandList = Array.isArray(commands) ? commands : [commands];
    const payload = `${commandList.join('\n')}\nclose\n`;

    return new Promise((resolve, reject) => {
      let response = '';
      let settled = false;

      const socket = net.createConnection(this.port, this.host);

      const finish = (error, value) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();

        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      };

      socket.setTimeout(this.timeoutMs);

      socket.on('connect', () => {
        socket.write(payload);
      });

      socket.on('data', data => {
        response += data.toString('utf8');
      });

      socket.on('timeout', () => {
        finish(new Error(`MPD request timed out after ${this.timeoutMs} ms`));
      });

      socket.on('error', error => {
        finish(error);
      });

      socket.on('end', () => {
        if (response.includes('ACK ')) {
          finish(new Error(response.trim()));
        } else {
          finish(null, response);
        }
      });

      socket.on('close', () => {
        if (!settled && response) {
          if (response.includes('ACK ')) {
            finish(new Error(response.trim()));
          } else {
            finish(null, response);
          }
        }
      });
    });
  }

  async status() {
    const response = await this.send('status');
    const parsed = parseMpdKeyValue(response);

    return {
      raw: response,
      state: parsed.state || 'stop',
      volume: clampVolume(parsed.volume),
    };
  }

  play() {
    return this.send('play');
  }

  stop() {
    return this.send('stop');
  }

  setVolume(value) {
    return this.send(`setvol ${clampVolume(value)}`);
  }
}

module.exports = {
  MpdClient,
  clampVolume,
  parseMpdKeyValue,
};
