const express = require('express')
const app = express()

// Módulo para manipulação de arquivos, caso queira salvar os dados em um arquivo JSON
//                 em vez de usar um banco de dados simulado em memória.
const fs = require('fs') 

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json())

// Simulando um banco de dados em memória para 
// armazenar os funcionários cadastrados, começamos com um array vazio.
let bancoDeDados = []

// Verificamos se existe um arquivo JSON com os dados salvos. Se existir, carregamos os dados para o nosso banco de dados simulado.
if (fs.existsSync('FolhaDePagamento.json')) {
    const dadosArquivo = fs.readFileSync('FolhaDePagamento.json', 'utf-8')
    bancoDeDados = JSON.parse(dadosArquivo)
    console.log("Sistema: Dados carregados com sucesso!")
}

// Nossa primeira e única rota!
app.get('/', (requisicao, resposta) => {
    resposta.send("API de Folha de Pagamento rodando!")
})

//  Criando uma rota para retornar um objeto JSON
//  Essa rota simula a consulta de um funcionário e retorna seus dados, incluindo o salário líquido após os descontos.
//  app.get => método para criar uma rota do tipo GET, que é usada para solicitar dados do servidor. 
//  O primeiro argumento é o caminho da rota (neste caso, '/funcionario'), e o segundo argumento é uma função de callback que será executada quando a rota for acessada. 
//  A função recebe dois parâmetros: 'requisicao' (objeto que representa a solicitação feita pelo cliente) e 'resposta' (objeto usado para enviar a resposta de volta ao cliente).
/* app.get('/funcionario', (requisicao, resposta) => {
    const dadosFuncionario = {
        id: 1,
        nome: 'Jean Costa',
        cargo: "Desenvolvedor",
        salarioBase: 4500,
        // Desconto de 15% para impostos
        salarioLiquido: 4500 - (4500 * 0.15) 
    }

    resposta.json(dadosFuncionario)
})  MUDAMOS A FORMA DE FAZER O GET DOS FUNCIONARIOS  */

//Busca os dados direto do nosso banco de dados simulado, que é um array onde armazenamos os funcionários cadastrados.
app.get('/funcionario', (requisicao, resposta) => {
    resposta.json(bancoDeDados)
})

//Criando uma nova rota post: para cadastrar um novo funcionário
// app.post => método para criar uma rota do tipo POST, que é usada para enviar dados ao servidor.
/* app.post('/funcionario', (requisicao, resposta) => {
    //requisicao.body => é onde fica os dados que o usuário enviou.
    const novoFucionario = requisicao.body

    //Simula que o banco de dados gerou um ID para o novo funcionário
    // Math.random() => gera um número aleatório entre 0 e 1. Multiplicando por 1000, obtemos um número entre 0 e 999.
    // Adicionando 1, garantimos que o ID seja entre 1 e 1000.
    novoFucionario.id = Math.floor(Math.random() * 1000) + 1

    // Calcula o salário líquido com desconto de 15% e atribui ao novo funcionário
    novoFucionario.salarioLiquido = novoFucionario.salarioBase - (novoFucionario.salarioBase * 0.15)

    //Devolvemos uma mensagem de sucesso e os dados do novo funcionário
    resposta.json({
        mensagem: 'Funcionário cadastrado com sucesso!',
        dadosCadastrados: novoFucionario
    })
})  MUDAMOS A FORMA DE FAZER POST NO BANCO DE DADOS  */

app.post('/funcionario', (requisicao, resposta) => {
    const novoFuncionario = requisicao.body
    novoFuncionario.id = Math.floor(Math.random() * 1000) + 1

    // ==========================================
    //       CÁLCULOS DA FOLHA DE PAGAMENTO
    // ==========================================

    const salarioBase = novoFuncionario.salarioBase

    // Cálculo do INSS (11% do salário base)
    const inss = salarioBase * 0.10
    novoFuncionario.inss = inss

    // Cálculo do IRRF => SalarioBase - INSS
    const calculoIRRF = salarioBase - inss
    let irrf = 0
   
    //Regras de Imposto de Renda
    if(calculoIRRF > 5000){
        // 27,5% para salários acima de R$ 5.000
        irrf = calculoIRRF * 0.275 
    }else if(calculoIRRF > 2500){
        // 15% para salários entre R$ 2.500 e R$ 5.000
        irrf = calculoIRRF * 0.15
    }

    //Se for menor que 2500, está insento de IRRF, então irrf = 0
    novoFuncionario.irrf = Number(irrf).toFixed(2)

    // Cálculo do salário líquido
    novoFuncionario.salarioLiquido = salarioBase - inss - irrf

    // ==========================================
    //           SALVANDO O FUNCIONÁRIO
    // ==========================================

    //O comando push() => é usado para adicionar o novo funcionário ao nosso banco de dados simulado (array).
    bancoDeDados.push(novoFuncionario)

    //Devolvemos uma mensagem de resposta com os cálculos prontos e os dados do novo funcionário.
    resposta.json({
        mensagem: 'Funcionário cadastrado com sucesso!',
        dadosCadastrados: novoFuncionario
    })
})
    // ==========================================
    //            EXPORTAR PARA JSON
    // ==========================================

    app.get('/exportar', (requisicao, resposta) => {
        // Transforma o que está na memória em texto JSON
        const dadosJson = JSON.stringify(bancoDeDados, null, 2)
    
        // Escreve no arquivo 
        fs.writeFileSync('FolhaDePagamento.json', dadosJson)
    
        console.log("Sistema: Arquivo JSON atualizado com sucesso!")
        
        resposta.json({
            mensagem: 'Dados exportados para FolhaDePagamento.json com sucesso!'
        })
    })

    // ==========================================
    //            EXPORTAR PARA CSV
    // ==========================================

    app.get('/exportar-csv', (requisicao, resposta) => {
        // Criamos o cabeçalho (os títulos das colunas)
        const cabecalho = "ID;Nome;Cargo;Salário Base;INSS;IRRF;Salário Líquido\n"
    
        // Transformamos cada funcionário em uma linha de texto separada por ;
        const linhas = bancoDeDados.map((func) => {
            return `${func.id};${func.nome};${func.cargo};${func.salarioBase};${func.inss};${func.irrf};${func.salarioLiquido}`
        }).join('\n')
    
        // Juntamos o cabeçalho com as linhas
        const conteudoFinal = cabecalho + linhas
    
        // Salvamos o texto formatado no arquivo CSV
        fs.writeFileSync('FolhaDePagamento.csv', conteudoFinal)
    
        console.log("Sistema: Planilha CSV atualizada com sucesso!")
        
        resposta.json({
            mensagem: 'Dados exportados para FolhaDePagamento.csv com sucesso!'
        })
    })

    // ==========================================
    //            DELETAR FUNCIONÁRIO
    // ==========================================

    // O ":id" na rota avisa a API que ela vai receber um número variável ali, que representa o ID do funcionário que queremos deletar.
    app.delete('/funcionario/:id', (requisicao, resposta) => {
        // Pegamos o ID da URL e transformamos em número
        const idFuncionario = Number(requisicao.params.id)

        // Procuramos em que posição do array está o funcionário com o ID fornecido
        // O método findIndex() => é usado para encontrar o índice do funcionário no array 'bancoDeDados' que tem o ID igual ao 'idFuncionario' fornecido na URL.
        const indice = bancoDeDados.findIndex(func => func.id === idFuncionario)

        // Se o índice for -1, significa que o funcionário não foi encontrado
        if(indice === -1){
            return resposta.status(404).json({
                mensagem: 'Funcionário não encontrado!'
            })
        }

        //Se o funcionário for encontrado, usamos o método splice() para removê-lo do array
        bancoDeDados.splice(indice, 1)

        //Devolvemos uma resposta de sucesso para o cliente
        resposta.json({
            mensagem: 'Funcionário deletado com sucesso!'
        })

    })

    // ==========================================
    //            BUSCAR FUNCIONÁRIO
    // ==========================================

    app.get('/buscar', (requisicao, resposta) => {
        // O .trim() remove espaços acidentais no início ou fim
        const nomeBusca = requisicao.query.nome ? requisicao.query.nome.trim() : ""
    
        console.log(`Buscando por: "${nomeBusca}"`); // Verifique isso no terminal!
        console.log("Dados em memória:", bancoDeDados.length, "funcionários.")
    
        if (!nomeBusca || !isNaN(nomeBusca)) {
            return resposta.status(400).json({ mensagem: "Por favor, digite um nome." })
        }
    
        const resultados = bancoDeDados.filter(func => 
            func.nome.toLowerCase().includes(nomeBusca.toLowerCase())
        )
    
        if (resultados.length === 0) {
            return resposta.status(404).json({ mensagem: "Nenhum funcionário encontrado." })
        }
    
        resposta.json(resultados)
    })

    // ==========================================
    //            EDITAR FUNCIONÁRIO (UPDATE)
    // ==========================================
    app.put('/funcionario/:id', (requisicao, resposta) => {
        const idParaEditar = Number(requisicao.params.id)
        const novosDados = requisicao.body

        // Procuramos o funcionário na lista
        const funcionario = bancoDeDados.find(f => f.id === idParaEditar)

        if (!funcionario) {
            return resposta.status(404).json({ mensagem: "Funcionário não encontrado!" })
        }

        // Atualizamos apenas o que foi enviado (Nome, Cargo ou Salário)
        if (novosDados.nome) funcionario.nome = novosDados.nome
        if (novosDados.cargo) funcionario.cargo = novosDados.cargo
        
        if (novosDados.salarioBase) {
            funcionario.salarioBase = novosDados.salarioBase
            
            // Caso o salário base seja atualizado, iremos atualizar o cálculo do INSS, IRRF e salário líquido.
            const inss = funcionario.salarioBase * 0.10
            let irrf = 0
            const calculoIRRF = funcionario.salarioBase - inss
            
            if(calculoIRRF > 5000) irrf = calculoIRRF * 0.275
            else if(calculoIRRF > 2500) irrf = calculoIRRF * 0.15

            funcionario.inss = inss
            funcionario.irrf = Number(irrf).toFixed(2)
            funcionario.salarioLiquido = funcionario.salarioBase - inss - irrf
        }

        resposta.json({
            mensagem: "Cadastro atualizado com sucesso!",
            funcionarioAtualizado: funcionario
        })
    })


// Ligando o servidor na porta 3000
app.listen(3000, () => {
    console.log("Servidor rodando! Acesse: http://localhost:3000")
})