const express = require('express')
const app = express()

// Módulo para manipulação de arquivos, caso queira salvar os dados em um arquivo JSON
//                 em vez de usar um banco de dados simulado em memória.
const fs = require('fs') 

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json())

// Simulando um banco de dados em memória para 
// armazenar os funcionários cadastrados, começamos com um array vazio.
const bancoDeDados = []

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
        // Transforma a lista do Banco de Dados em uma string JSON formatada
        const dadosJson = JSON.stringify(bancoDeDados, null, 2)

        //O servidor checa se o arquivo já existe no computador
        if(fs.existsSync('FolhaDePagamento.json', dadosJson)){
            // Se o arquivo existe, ele lê o texto do arquivo
            const dadosExistentes = fs.readFileSync('FolhaDePagamento.json', 'utf-8')

            // Transforma o texto de volta em uma lista (Array) de objetos
            bancoDeDados = JSON.parse(dadosExistentes)

            console.log("Sistema: Dados antigos carregados com sucesso!")
        }else{
            console.log("Sistema: Nenhum arquivo encontrado. Iniciando banco de dados do zero.")
        }

        //Devolve uma reposta de sucesso para o cliente
        resposta.json({
            mensagem: 'Dados exportados para FolhaDePagamento.json com sucesso!'
        })
    })

    // ==========================================
    //            EXPORTAR PARA CSV
    // ==========================================

    app.get('/exportar-csv', (requisicao, resposta) => {
        //Cabeçalho do CSV
        const cabecalho = "ID;Nome;Cargo;Salario Base;INSS;IRRF;Salario Liquido\n"

        //Pegamos os dados do banco de dados e transformamos em linhas de CSV
        /* O método map() => é usado para criar um novo array a partir do array original (bancoDeDados), 
        transformando cada objeto funcionário em uma string formatada como uma linha de CSV. */
        const linhas = bancoDeDados.map((func) => {
            //func => representa cada funcionário do banco de dados. Para cada funcionário, criamos uma string onde os campos são separados por ponto e vírgula (;),
            //  seguindo a ordem definida no cabeçalho do CSV.
            return `${func.id};${func.nome};${func.cargo};${func.salarioBase};${func.inss};${func.irrf};${func.salarioLiquido}`
        })

        //Juntamos o cabecalho com todas as linhas criadas, separando por quebra de linha
        // O método join("\n") => é usado para unir todas as linhas do array 'linhas' em uma única string.
        const conteudoCsv = cabecalho + linhas.join("\n")

        //Escreve o conteúdo CSV no arquivo 'funcionarios.csv'
        fs.writeFileSync('FolhaDePagamento.csv', conteudoCsv)

        //Devolve uma resposta de sucesso para o cliente
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

// Ligando o servidor na porta 3000
app.listen(3000, () => {
    console.log("Servidor rodando! Acesse: http://localhost:3000")
})