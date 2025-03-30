async function carregarMedicamentos() {
    const response = await fetch('/lembretes');
    const lembretes = await response.json();
    const ul = document.getElementById('medicamentos');
    ul.innerHTML = '';
    lembretes.forEach(lembrete => {
        const li = document.createElement('li');
        li.innerHTML = `${lembrete.medicamento} - ${lembrete.horarios} 
            <div>
                <button class="editar" onclick="editarMedicamento(${lembrete.id})">Editar</button>
                <button onclick="removerMedicamento(${lembrete.id})">Remover</button>
            </div>`;
        ul.appendChild(li);
    });
}

async function exibirLinks() {
    const response = await fetch('/links');
    const links = await response.json();
    const div = document.getElementById('listaLinks');
    div.innerHTML = links.map(l => `<p>${l.horario}: <a href="${l.link}" target="_blank">Enviar para ${l.whatsapp}</a></p>`).join('');
}

document.getElementById('medForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const whatsapp = document.getElementById('whatsapp').value;
    const medicamento = document.getElementById('medicamento').value;
    const frequencia = parseInt(document.getElementById('frequencia').value);
    const horarioInicial = document.getElementById('horarioInicial').value;

    const horaIni = parseInt(horarioInicial.slice(0, 2));
    const minIni = parseInt(horarioInicial.slice(2, 4));
    if (horaIni > 23 || minIni > 59 || isNaN(horaIni) || isNaN(minIni)) {
        document.getElementById('mensagem').textContent = 'Horário inicial inválido!';
        return;
    }

    const intervalo = 24 / frequencia;
    const horarios = [];
    for (let i = 0; i < frequencia; i++) {
        let hora = Math.floor(horaIni + (intervalo * i));
        if (hora >= 24) hora -= 24;
        const horaStr = String(hora).padStart(2, '0') + ':' + String(minIni).padStart(2, '0');
        horarios.push(horaStr);
    }

    document.getElementById('listaHorarios').textContent = horarios.join(', ');
    document.getElementById('horariosCalculados').style.display = 'block';

    document.getElementById('confirmar').onclick = async () => {
        const data = { whatsapp, medicamento, horarios: horarios.join(',') };
        try {
            const response = await fetch('/cadastrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const result = await response.json();
            document.getElementById('mensagem').textContent = result.message;
            document.getElementById('horariosCalculados').style.display = 'none';
            carregarMedicamentos();
            exibirLinks();
            document.getElementById('medForm').reset();
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            document.getElementById('mensagem').textContent = 'Erro ao cadastrar. Veja o console.';
        }
    };
});

async function removerMedicamento(id) {
    await fetch(`/remover/${id}`, { method: 'DELETE' });
    carregarMedicamentos();
    document.getElementById('mensagem').textContent = 'Medicamento removido!';
}

async function editarMedicamento(id) {
    const response = await fetch('/lembretes');
    const lembretes = await response.json();
    const lembrete = lembretes.find(l => l.id === id);

    document.getElementById('whatsapp').value = lembrete.whatsapp;
    document.getElementById('medicamento').value = lembrete.medicamento;
    document.getElementById('frequencia').value = lembrete.horarios.split(',').length;
    document.getElementById('horarioInicial').value = lembrete.horarios.split(',')[0].replace(':', '');

    await fetch(`/remover/${id}`, { method: 'DELETE' });
    document.getElementById('mensagem').textContent = 'Edite os dados e clique em Calcular Horários.';
}

carregarMedicamentos();
setInterval(exibirLinks, 60000); // Atualiza links a cada minuto