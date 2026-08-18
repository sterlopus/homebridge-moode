# homebridge-moode

Homebridge accessory for controlling a [moOde audio player](https://moodeaudio.org/) from HomeKit.

The plugin talks directly to moOde's MPD server and exposes it to HomeKit as a Lightbulb. This gives HomeKit one tile with:

- On/Off for playback
- Brightness slider for volume
- Periodic status updates from MPD

HomeKit does not provide a general-purpose speaker accessory with a visible volume slider for custom Homebridge accessories. A Lightbulb is used intentionally because it has the exact controls needed here: `On` and `Brightness`.

## Features

- `On` sends MPD `play`
- `Off` sends MPD `stop`
- `Brightness` sends MPD `setvol <0-100>`
- Reads MPD `status`
- Maps `state: play` to HomeKit `On`
- Maps `volume: N` to HomeKit `Brightness`
- Polls moOde periodically so HomeKit stays in sync

## Requirements

- Homebridge 1.8 or newer
- Node.js 18 or newer
- moOde with MPD reachable from the Homebridge host
- MPD port open, usually `6600`

For example, if your moOde player is at `192.168.2.180`, Homebridge must be able to connect to `192.168.2.180:6600`.

## Installation

Install the plugin on the Homebridge host:

```bash
npm install -g homebridge-moode
```

If you are installing directly from a GitHub repository:

```bash
npm install -g github:sterlopus/homebridge-moode
```

Restart Homebridge after installation.

## Configuration

Add an accessory entry in Homebridge:

```json
{
  "accessory": "Moode",
  "name": "moOde",
  "host": "192.168.2.180",
  "port": 6600,
  "timeoutMs": 3000,
  "pollIntervalSeconds": 30
}
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `accessory` | string | `Moode` | Must be `Moode`. |
| `name` | string | `moOde` | Accessory name shown in HomeKit. |
| `host` | string | required | IP address or hostname of the moOde player. |
| `port` | number | `6600` | MPD port. |
| `timeoutMs` | number | `3000` | MPD connection timeout in milliseconds. |
| `pollIntervalSeconds` | number | `30` | How often Homebridge refreshes playback and volume state. |

## HomeKit Behavior

The accessory appears as a light:

| HomeKit control | moOde / MPD action |
| --- | --- |
| Turn on | `play` |
| Turn off | `stop` |
| Set brightness to 0-100% | `setvol 0-100` |
| Read state | `status` |

Siri examples:

- "Turn on moOde"
- "Turn off moOde"
- "Set moOde to 40 percent"

## Troubleshooting

Check that the Homebridge host can reach MPD:

```bash
node -e "const net=require('net');const s=net.createConnection(6600,'192.168.2.180',()=>s.write('status\nclose\n'));s.on('data',d=>process.stdout.write(d));s.on('error',e=>console.error(e.message));"
```

You should see MPD status lines, including values like:

```text
volume: 69
state: play
```

If the command cannot connect, check:

- moOde IP address
- MPD port
- firewall rules
- whether MPD is enabled in moOde
- whether Homebridge and moOde are on the same network

## Development

Run tests:

```bash
npm test
```

Create a local package:

```bash
npm pack
```

Install that package on the Homebridge host:

```bash
npm install -g ./homebridge-moode-0.1.0.tgz
```

## License

MIT
