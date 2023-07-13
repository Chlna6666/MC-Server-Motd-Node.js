const dgram = require('dgram');

class MotdBEInfo {
  constructor() {
    this.Status = 'offline';
    this.Host = '';
    this.Motd = '';
    this.Agreement = 0;
    this.Version = '';
    this.Online = 0;
    this.Max = 0;
    this.LevelName = '';
    this.GameMode = '';
    this.Delay = 0;
  }
}

function MotdBE(Host) {
  if (Host === '') {
    const MotdInfo = new MotdBEInfo();
    return Promise.resolve(MotdInfo);
  }

  const [address, port] = Host.split(':'); // 拆分地址和端口

  const socket = dgram.createSocket('udp4');
  const senddata = Buffer.from('0100000000240D12D300FFFF00FEFEFEFEFDFDFDFD12345678', 'hex');
  const timeout = 5000; // 5 seconds

  return new Promise((resolve, reject) => {
    // 设置读取超时
    socket.on('listening', () => {
      socket.setRecvBufferSize(4096);
    });

    // 接收数据
    let time1;
    socket.on('message', (UDPdata, remote) => {
      const time2 = new Date().getTime();
      socket.close();

      const MotdData = UDPdata.toString().split(';');
      const Agreement = parseInt(MotdData[2]);
      const Online = parseInt(MotdData[4]);
      const Max = parseInt(MotdData[5]);

      const MotdInfo = new MotdBEInfo();
      MotdInfo.Status = 'online';
      MotdInfo.Host = Host;
      MotdInfo.Motd = MotdData[1];
      MotdInfo.Agreement = Agreement;
      MotdInfo.Version = MotdData[3];
      MotdInfo.Online = Online;
      MotdInfo.Max = Max;
      MotdInfo.LevelName = MotdData[7];
      MotdInfo.GameMode = MotdData[8];
      MotdInfo.Delay = time2 - time1;

      resolve(MotdInfo);
    });

    // 超时处理
    socket.on('timeout', () => {
      const MotdInfo = new MotdBEInfo();
      socket.unref(); // 解除对 socket 的引用，而不是直接关闭
      resolve(MotdInfo);
    });

    // 错误处理
    socket.on('error', (err) => {
      const MotdInfo = new MotdBEInfo();
      socket.unref(); // 解除对 socket 的引用，而不是直接关闭
      reject(err);
    });

    // 绑定端口并开始监听
    socket.bind(() => {
      // 发送数据
      time1 = new Date().getTime();
      socket.send(senddata, 0, senddata.length, parseInt(port), address, (err) => {
        if (err) {
          const MotdInfo = new MotdBEInfo();
          socket.unref(); // 解除对 socket 的引用，而不是直接关闭
          resolve(MotdInfo);
        }
      });
    });

    // 设置超时定时器
    const timeoutTimer = setTimeout(() => {
      const MotdInfo = new MotdBEInfo();
      socket.unref(); // 解除对 socket 的引用，而不是直接关闭
      resolve(MotdInfo);
    }, timeout);
  });
}

module.exports = {
  default: MotdBE,
};

