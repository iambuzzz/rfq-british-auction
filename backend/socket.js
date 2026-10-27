const { Server } = require('socket.io');

const initSocket = (server, clientUrls) => {
  const io = new Server(server, {
    cors: { origin: clientUrls },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // details page joins a room with the rfq id,
    // so we only send updates of that auction to it
    socket.on('join-auction', (rfqId) => {
      socket.join(rfqId);
    });

    socket.on('leave-auction', (rfqId) => {
      socket.leave(rfqId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initSocket;
