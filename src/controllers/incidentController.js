const connection = require('../database/connection');
module.exports = {
    async index(request, response) {
        const {page = 1} = request.query;
        const [count] = await connection('incidents').count();
        const incidents = await connection('incidents').join('ongs', 'ongs.id', '=', 'incidents.ong_id').limit(5).offset((page-1)*5).select(['incidents.*', 'ongs.name', 'ongs.email', 'ongs.whatsapp', 'ongs.city', 'ongs.uf']);//retorna todos os dados do banco de dados (juntando os dados dos incidents com os dados da ong "dona" daquele incident) porém separados por páginas (cada página com 5 incidents). O id da ong não foi puxado também porque o incidents já possui e foi puxado no "incidents.*"
        response.header('X-Total-Count', count['count(*)']);
        return response.json(incidents);
    },
    async create(request, response) {
        const {title, description, value} = request.body;
        const ong_id = request.headers.authorization;
        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id
        });
        return response.json({id});
    },
    async delete(request, response) {
        const {id} = request.params;
        const ong_id = request.headers.authorization;
        const incident = await connection('incidents').where('id', id).select('ong_id').first();
        if (incident.ong_id != ong_id) { //se os ong_id's divergirem, não deleta
            return response.status(401).json({error: 'Operation not permitted.'}); //401 = Unauthorized http status code
        }
        await connection ('incidents').where('id', id).delete();
        return response.status(204).send(); //204 = No Content http status code
    }
}