const net = require('net');

class MotdJEInfo {
  constructor() {
    this.Status = 'offline';
    this.Host = '';
    this.Motd = '';
    this.Agreement = 0;
    this.Version = '';
    this.Online = 0;
    this.Max = 0;
    this.Sample = [];
    this.Favicon = '';
    this.Delay = 0;
  }
}

class MotdJEJson {
  constructor() {
    this.Description = '';
    this.Players = {
      Max: 0,
      Online: 0,
      Sample: [],
    };
    this.Version = {
      Name: '',
      Protocol: 0,
    };
    this.Favicon = '';
  }
}

function readVarInt(buffer) {
  let result = 0;
  let shift = 0;
  let index = 0;
  let byteValue;

  do {
    byteValue = buffer[index];
    result |= (byteValue & 0x7F) << shift;
    shift += 7;
    index++;
  } while (byteValue & 0x80);

  return [result, buffer.slice(index)];
}

function putVarInt(buf, value) {
  const bytes = [];
  let val = value;
  do {
    let byteValue = val & 0x7F;
    val >>>= 7;
    if (val !== 0) {
      byteValue |= 0x80;
    }
    bytes.push(byteValue);
  } while (val !== 0);

  buf.push(...bytes);
}

function MotdJE(Host) {
  const MotdInfo = new MotdJEInfo();

  if (Host === '') {
    MotdInfo.Status = 'offline';
    return Promise.resolve(MotdInfo);
  }

  const timeout = 5000; // 5 seconds

  const [address, port] = Host.split(':');

  const time1 = new Date().getTime();

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, address, () => {
      const time2 = new Date().getTime();

      socket.setTimeout(timeout);

      const handshakePacket = makeHandshakePacket(address, port);
      socket.write(handshakePacket);
      socket.write(Buffer.from([1, 0]));
      socket.write(Buffer.from(handshakePacket));
    });

let rawData = Buffer.from([]);

socket.on('data', (data) => {
  rawData = Buffer.concat([rawData, data]);

  while (rawData.length > 0) {
    const [packetLength, remainingData] = readVarInt(rawData);
    if (rawData.length < packetLength) {
      break; 
    }

    const packetData = remainingData.slice(0, packetLength);
    rawData = remainingData.slice(packetLength);

    const [packetId, base64Data] = readVarInt(packetData);
    
    const time2 = new Date().getTime();

    if (packetId === 0) {

 const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');

let sanitizedJsonString = jsonString.replace(/[^\x20-\x7E]/g, '');
sanitizedJsonString = sanitizedJsonString.replace(/[\u0000-\u001F]+/g, ''); // 删除控制字符

const responseJson = JSON.parse(sanitizedJsonString);


      MotdInfo.Status = 'online';
      MotdInfo.Host = Host;
      MotdInfo.Motd = responseJson.description.text;
      MotdInfo.Agreement = responseJson.version.protocol;
      MotdInfo.Version = responseJson.version.name;
      MotdInfo.Online = responseJson.players.online;
      MotdInfo.Max = responseJson.players.max;
      MotdInfo.Sample = responseJson.players.sample || [];
      MotdInfo.Favicon = responseJson.favicon;
      MotdInfo.Delay = time2 - time1;
    }
  }

  socket.end();
});



    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    // 在所有数据填充完毕后，再进行 resolve
    socket.on('end', () => {
      resolve(MotdInfo);
    });
  });
}

function makeHandshakePacket(address, port) {
  const buf = [];

  buf.push(0x00);
  putVarInt(buf, 47); // Hardcoded protocol version 47 for Minecraft 1.8.x
  putVarInt(buf, address.length);
  buf.push(...Buffer.from(address));
  buf.push((port >> 8) & 0xFF, port & 0xFF);
  putVarInt(buf, 1); // Next state: status

  const out = [];
  putVarInt(out, buf.length);
  out.push(...buf);

  return Buffer.from(out);
}

module.exports = {
  default: MotdJE,
};



MotdJE('mc.hypixel.net:25565')
  .then((motdInfo) => {
    console.log('MotdInfo:', motdInfo);
  })
  .catch((err) => {
    console.error('Error:', err);
  });