'use strict';

const { MpdClient, clampVolume } = require('./lib/mpd-client');

const PLUGIN_NAME = 'homebridge-moode';
const ACCESSORY_NAME = 'Moode';

let Service;
let Characteristic;

class MoodeAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name || 'moOde';
    this.host = config.host || '192.168.2.180';
    this.port = Number(config.port || 6600);
    this.timeoutMs = Number(config.timeoutMs || 3000);
    this.pollIntervalSeconds = Number(config.pollIntervalSeconds ?? 30);

    this.client = new MpdClient({
      host: this.host,
      port: this.port,
      timeoutMs: this.timeoutMs,
    });

    this.lastState = {
      on: false,
      volume: 50,
    };

    this.service = new Service.Lightbulb(this.name);

    this.service
      .getCharacteristic(Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.service
      .getCharacteristic(Characteristic.Brightness)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: 1,
      })
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    if (this.pollIntervalSeconds > 0) {
      this.pollTimer = setInterval(() => {
        this.updateCharacteristics().catch(error => {
          this.log.debug(`Could not refresh moOde status: ${error.message}`);
        });
      }, this.pollIntervalSeconds * 1000);

      if (typeof this.pollTimer.unref === 'function') {
        this.pollTimer.unref();
      }
    }

    this.log.info(`moOde accessory configured for ${this.host}:${this.port}`);
  }

  getServices() {
    const informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'moOde / MPD')
      .setCharacteristic(Characteristic.Model, 'MPD Lightbulb Volume')
      .setCharacteristic(Characteristic.SerialNumber, `${this.host}:${this.port}`);

    return [informationService, this.service];
  }

  async readStatus() {
    const status = await this.client.status();
    this.lastState = {
      on: status.state === 'play',
      volume: clampVolume(status.volume),
    };
    return this.lastState;
  }

  async updateCharacteristics() {
    const state = await this.readStatus();
    this.service.updateCharacteristic(Characteristic.On, state.on);
    this.service.updateCharacteristic(Characteristic.Brightness, state.volume);
  }

  async getOn() {
    const state = await this.readStatus();
    return state.on;
  }

  async setOn(value) {
    const on = Boolean(value);

    if (on) {
      await this.client.play();
      this.log.info(`${this.name}: play`);
    } else {
      await this.client.stop();
      this.log.info(`${this.name}: stop`);
    }

    this.lastState.on = on;
  }

  async getBrightness() {
    const state = await this.readStatus();
    return state.volume;
  }

  async setBrightness(value) {
    const volume = clampVolume(value);
    await this.client.setVolume(volume);
    this.lastState.volume = volume;
    this.log.info(`${this.name}: volume ${volume}`);
  }
}

module.exports = api => {
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;

  api.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, MoodeAccessory);
};

module.exports.MoodeAccessory = MoodeAccessory;
