
const fs = require('fs')
const path = require('path');

class Contenedor {

    constructor(archivo) {

        this.archivo = archivo
        this.lastId = 0 



        if (!fs.existsSync(archivo)) { 

            const dir = path.dirname(archivo)
            if (!fs.existsSync(dir)) {
   
                try {
                    fs.mkdirSync(dir)

                } catch (error) {
                    throw `Error al crear carpeta: ${dir}`
                }
            }
            try {
                fs.writeFileSync(archivo, JSON.stringify([]))
                console.log(`Archivo ${archivo} creado de cero`)

            } catch (error) {
                throw 'Error al querer crear archivo de cero'
            }
        }


        try {
            const contenidoFile = JSON.parse(fs.readFileSync(archivo, 'utf-8'))
            for (const obj of contenidoFile) {
                if (obj.id > this.lastId) {
                    this.lastId = obj.id
                }
            }
            console.log('Objeto Contenedor creado en base al archivo:', archivo)

        } catch (error) {
            throw `El formato del contenido del archivo ${archivo} es incompatible con esta aplicación. No puede obtenerse un Array de su parseo.`
        }
    }

    async getAll() { 
        try {
            return JSON.parse(await fs.promises.readFile(this.archivo, 'utf-8'))

        } catch (error) {
            throw `Error al querer leer el contenido del archivo: ${this.archivo}`
        }
    }

    async save(obj) {

        let objeto = Array.isArray(obj) ? obj[0] : obj

        if (objeto && Object.prototype.toString.call(objeto) === '[object Object]' && Object.keys(objeto).length > 0) {
            try {
         
                const contenidoFile = await this.getAll()

                const newObj = { ...objeto, id: this.lastId + 1 } 
                contenidoFile.push(newObj)

                await fs.promises.writeFile(this.archivo, JSON.stringify(contenidoFile, null, 2))

                this.lastId++ 
                return this.lastId

            } catch (error) {
                throw `Error al querer procesar el contenido del archivo: ${this.archivo}`
            }
        } else {
            console.log('El parámetro recibido por el método save no es un objeto');
            return null
        }
    }

    async getById(number) { 
        try {
            const contenidoFile = await this.getAll()
            return contenidoFile.find(obj => obj.id == number) ?? null

        } catch (error) {
            throw `Error al obtener objeto con id ${number}`
        }
    }

    async deleteById(number) { 
        try {
            const contenidoFile = await this.getAll()
            const newContenido = contenidoFile.filter(obj => obj.id != number)

            if (contenidoFile.length > newContenido.length) { 

                await fs.promises.writeFile(this.archivo, JSON.stringify(newContenido, null, 2))
                console.log(`Eliminado del file objeto con id: ${number}`);
                return true

            } else {
                console.log(`No hay objeto con id: ${number} para eliminar. Contenido del file sigue igual`);
                return false
            }
        } catch (error) {
            throw `Error al eliminar objeto con id ${number}`
        }
    }

    async deleteAll() { 
        try {
            await fs.promises.writeFile(this.archivo, JSON.stringify([]))
            console.log('Se ha vaciado el file:', this.archivo);
            return true

        } catch (error) {
            return false
        }
    }

    async editById(id, obj) {

        if (await this.getById(id)) {

            let objeto = Array.isArray(obj) ? obj[0] : obj
       
            if (objeto && Object.prototype.toString.call(objeto) === '[object Object]') {
                try {
                    const contenidoFile = await this.getAll()

                    const newCF = contenidoFile.map(x => {
                        if (x.id == id) {
                            Object.assign(x, objeto)
                            x.id = parseInt(id)
                        }
                        return x
                    })

                    await fs.promises.writeFile(this.archivo, JSON.stringify(newCF, null, 2))
                    return true

                } catch (error) {
                    throw `Error al querer procesar el contenido del archivo: ${this.archivo}`
                }
            } else {
                console.log('El parámetro no es un objeto');
                return false 
            }
        } else {
            console.log('No existe objeto con id:', id);
            return false
        }
    }
}

module.exports = Contenedor