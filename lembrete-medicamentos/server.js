const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('lembretes.db');
db.run('CREATE TABLE IF NOT EXISTS lembretes (id INTEGER PRIMARY KEY AUTOINCREMENT, whatsapp TEXT, medicamento TEXT, horarios TEXT)');

let linksGerados = [];

app.post('/cadastrar', (req, res) => {
    const { whatsapp, medicamento, horarios } = req.body;
    if (!whatsapp || !medicamento || !horarios) {
        return res.status(400).json({ message: 'Dados incompletos!' });
    }

    const horariosArray = horarios.split(',').map(h => h.trim());
    db.run('INSERT INTO lembretes (whatsapp, medicamento, horarios) VALUES (?, ?, ?)', 
        [whatsapp, medicamento, horarios], function(err) {
            if (err) {
                console.error('Erro ao salvar:', err);
                return res.status(500).json({ message: 'Erro ao salvar!' });
            }

            horariosArray.forEach(horario => {
                const [hora, minuto] = horario.split(':');
                cron.schedule(`${minuto} ${hora} * * *`, () => {
                    const mensagem = `Olá! São ${horario}. Hora de tomar seu ${medicamento}. Cuide-se!`;
                    const numeroLimpo = whatsapp.replace(/\D/g, '');
                    const whatsappLink = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
                    linksGerados.push({ whatsapp, horario, link: whatsappLink });
                    console.log(`Lembrete para ${whatsapp} às ${horario}: ${whatsappLink}`);
                });
            });
            res.json({ message: 'Cadastro realizado com sucesso!' });
        });
});

app.get('/lembretes', (req, res) => {
    db.all('SELECT * FROM lembretes', (err, rows) => {
        if (err) {
            console.error('Erro ao carregar:', err);
            return res.status(500).json({ message: 'Erro ao carregar!' });
        }
        res.json(rows);
    });
});

app.delete('/remover/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM lembretes WHERE id = ?', [id], function(err) {
        if (err || this.changes === 0) {
            console.error('Erro ao remover:', err);
            return res.status(400).json({ message: 'Índice inválido!' });
        }
        res.json({ message: 'Medicamento removido!' });
    });
});

app.get('/links', (req, res) => {
    res.json(linksGerados);
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});