//Importante leer el README

async function renderIndex() {

    //Constantes que seteo tanto del lado del server como del cliente ya que deben coincidir.
    //Quizás convenga hacerlas variables de entorno (en un .env)
    const CHATMSG = 'chat_msg'
    const PRODMSG = 'prod_msg'

    //Registro Partials hbs
    Handlebars.registerPartial('header', await (await fetch('static/views/partials/header.hbs')).text());
    Handlebars.registerPartial('prodForm', await (await fetch('static/views/partials/prodForm.hbs')).text());
    Handlebars.registerPartial('prodList', await (await fetch('static/views/partials/prodList.hbs')).text());
    Handlebars.registerPartial('tableRaw', await (await fetch('static/views/partials/tableRaw.hbs')).text());
    Handlebars.registerPartial('chat', await (await fetch('static/views/partials/chat.hbs')).text());
    Handlebars.registerPartial('chatMsg', await (await fetch('static/views/partials/chatMsg.hbs')).text());
    Handlebars.registerPartial('footer', await (await fetch('static/views/partials/footer.hbs')).text());

    //Compilo Main Template hbs
    const template = Handlebars.compile(await (await fetch('static/views/main.hbs')).text());

    //Me conecto
    const socket = io();

    socket.on('connect', () => {
        //Cuando conecta inyecto template. Si el server se cae y vuelve a levantar se renderiza nuevamente (pero no es necesario un refresh)
        document.querySelector('span').innerHTML = template()

        //Tratamiento del submit de un nuevo producto al server
        const prodForm = document.querySelector('#prodForm')

        prodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let body = new FormData(prodForm)
            const prod = {
                title: body.get('productTitle'),
                price: body.get('productPrice'),
                thumbnail: body.get('productImgUrl')
            }
            socket.emit(PRODMSG, prod);
            prodForm.reset()
        });

        //Tratamiento del submit de un nuevo mensaje del chat al server
        const chatForm = document.querySelector('#chatForm')
        const inputMsj = document.querySelector('#chatMsj')
        const inputEmail = document.querySelector('#chatEmail')

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const ts = new Date()
            const mensaje = {
                email: inputEmail.value,
                timeStamp: ts.toLocaleString(),
                msj: inputMsj.value
            }
            socket.emit(CHATMSG, mensaje);
            inputMsj.value = null
        });

        //Recibo comunicación del socket informando un Producto. Lo agrego a la tabla.
        let contadorP = 0
        const tbody = document.querySelector('#tablaProd tbody')

        socket.on(PRODMSG, (data) => {

            if (contadorP == 0) { //Sólo al recibir el primer producto reemplazo subtitulo de "no hay productos" por encabezado de la tabla
                document.querySelector('#tablaProd').style.display = null
                document.querySelector('#noProd').style.display = 'none'
            }
            const item = document.createElement('tr');
            tbody.appendChild(item);
            item.outerHTML = Handlebars.compile('{{> tableRaw}}')({ producto: data }) //Compilo el html de un partial de hbs con la data del producto

            contadorP++
        });

        //Recibo comunicación del socket informando nuevo msj de chat. Lo agrego al cuadro de chat.
        const chatList = document.querySelector('#chatList')

        socket.on(CHATMSG, (data) => {

            const item = document.createElement('li');
            chatList.appendChild(item);
            item.outerHTML = Handlebars.compile('{{> chatMsg}}')({ msg: data }) //Compilo el html de un partial de hbs con la data del mensaje de chat

            chatList.parentElement.scroll(0, chatList.parentElement.scrollHeight)
        });
    })

    //En caso que el server se caiga...
    socket.on('disconnect', () => {
        //Lanzo alerta (que cuando se reconecta desaparece obviamente)
        document.querySelector('#serverAlert').style.display = null
    })
}
renderIndex()