

async function serverMain() {
    
    const CHATMENSAJE = 'chat_Mensaje'
    const PRODMENSAJE = 'prod_Mensaje'

    try {
        const Contenedor = require('./class/class_Contenedor')
        const contenedorProd = new Contenedor('./datos/productos.txt')
        const contenedorChat = new Contenedor('./datos/mensajes.txt')

        const express = require('express');
        const app = express();
        const { createServer } = require("http");
        const { Server } = require("socket.io");
        const httpServer = createServer(app);
        const io = new Server(httpServer);

        const STATICPATH = '/static'
        app.use(STATICPATH, express.static(__dirname + '/public'));

        const mwError = (err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: err });
        }
        app.use(mwError)

        app.get('/', (req, res) => {
            try {res.sendFile(__dirname + '/public/index.html');}
            catch (error) {res.status(500).json({ error: error });}
        });

        const mensajes = await contenedorChat.getAll()
        const productos = await contenedorProd.getAll()

        io.on('connection', (socket) => {

            console.log('Client connected:', socket.id);

            for (const p of productos) {
                socket.emit(PRODMENSAJE, p)
            }
            for (const m of mensajes) {
                socket.emit(CHATMENSAJE, m)
            }

            socket.on(PRODMENSAJE, async (data) => {
                try {
                    let newId = await contenedorProd.save(data)
                    if (newId) {
                        const prod = { ...data, id: newId }
                        productos.push(prod)
                        io.sockets.emit(PRODMENSAJE, prod);
                    } else {
                        throw 'Error guardando el nuevo producto'
                    }
                } catch (error) {
                    console.log(error);
                }
            });

            socket.on(CHATMENSAJE, async (data) => {
                try {
                    let newId = await contenedorChat.save(data)
                    if (newId) {
                        mensajes.push(data)
                        io.sockets.emit(CHATMENSAJE, data);
                    } else {
                        throw 'Error guardando el nuevo mensaje de chat'
                    }
                } catch (error) {
                    console.log(error);
                }
            });
            socket.on('desconectado', () => console.log('DESCONECTADO', socket.id));
        });

        io.engine.on("connection_error", (err) => {
            console.log(err.req);    
            console.log(err.code); 
            console.log(err.message); 
            console.log(err.context);
        });

        try {
            const PORT = process.env.PORT || 8080;
            httpServer.listen(PORT, () => console.log(`Socket.IO server running. PORT: ${httpServer.address().port}`));
        } catch (error) {
            httpServer.listen(0, () => console.log(`Socket.IO server running. PORT: ${httpServer.address().port}`));
        }
        httpServer.on("error", error => {
            console.log('Error en el servidor:', error);
        })
    } catch (error) {
        console.log('Error en el hilo principal:', error);
    }
}
serverMain()